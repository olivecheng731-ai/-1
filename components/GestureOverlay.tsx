
import React, { useRef, useEffect, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { HandData } from '../types';

interface GestureOverlayProps {
  onHandUpdate: (data: HandData | null) => void;
}

export const GestureOverlay: React.FC<GestureOverlayProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [smoothedCursor, setSmoothedCursor] = useState({ x: 0, y: 0 });
  // Fix: Added null as the initial value to satisfy the requirement of exactly one argument for useRef in this TypeScript context
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        landmarkerRef.current = handLandmarker;
        setIsLoaded(true);

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240 } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.error("MediaPipe failed to load", err);
      }
    }

    initMediaPipe();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Smoothing loop for cursor
  useEffect(() => {
    let animId: number;
    const smooth = () => {
        setSmoothedCursor(prev => ({
            x: prev.x + (cursorPos.x - prev.x) * 0.15,
            y: prev.y + (cursorPos.y - prev.y) * 0.15
        }));
        animId = requestAnimationFrame(smooth);
    };
    animId = requestAnimationFrame(smooth);
    return () => cancelAnimationFrame(animId);
  }, [cursorPos]);

  const detect = () => {
    if (videoRef.current && landmarkerRef.current && videoRef.current.readyState >= 2) {
      const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const dist = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) + 
          Math.pow(thumbTip.y - indexTip.y, 2)
        );
        const isGrabbing = dist < 0.06;

        const middleTip = landmarks[12];
        const middleBase = landmarks[9];
        const isOpen = middleTip.y < middleBase.y - 0.05 && !isGrabbing;

        setCursorPos({ 
            x: (1 - indexTip.x) * window.innerWidth, 
            y: indexTip.y * window.innerHeight 
        });

        onHandUpdate({
          isGrabbing,
          isOpen,
          x: 1 - indexTip.x,
          y: indexTip.y
        });
      } else {
        onHandUpdate(null);
      }
    }
    requestRef.current = requestAnimationFrame(detect);
  };

  useEffect(() => {
    if (isLoaded) {
      requestRef.current = requestAnimationFrame(detect);
    }
  }, [isLoaded]);

  return (
    <>
      <div className="absolute bottom-6 right-6 w-48 h-36 rounded-3xl border-2 border-white/20 overflow-hidden shadow-2xl bg-black z-30">
        {!isLoaded && (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-pink-300 uppercase tracking-widest bg-[#050103]">
            Initializing Sensor
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover -scale-x-100 opacity-80"
        />
        <div className="absolute top-2 right-2 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_5px_#ec4899]" />
        </div>
      </div>

      {isLoaded && (
        <div 
          className="fixed w-10 h-10 pointer-events-none z-[100] transition-transform"
          style={{ 
            left: smoothedCursor.x, 
            top: smoothedCursor.y, 
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-pink-500/30 rounded-full blur-xl animate-pulse" />
            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_white]" />
            <div className="absolute inset-0 border border-white/30 rounded-full animate-ping" />
          </div>
        </div>
      )}
    </>
  );
};
