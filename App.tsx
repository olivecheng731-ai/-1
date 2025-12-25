
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Scene } from './components/Scene';
import { GestureOverlay } from './components/GestureOverlay';
import { TreeState, HandData } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<TreeState>(TreeState.TREE);
  const [handData, setHandData] = useState<HandData | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [useGesture, setUseGesture] = useState(false);
  
  const toggleState = useCallback(() => {
    setState((prev) => (prev === TreeState.TREE ? TreeState.EXPLODE : TreeState.TREE));
  }, []);

  const handleHandUpdate = useCallback((data: HandData | null) => {
    setHandData(data);
    if (data) {
      if (data.isGrabbing) {
        setState(TreeState.TREE);
      } else if (data.isOpen) {
        setState(TreeState.EXPLODE);
      }
    }
  }, []);

  const startApp = (gesture: boolean) => {
    setUseGesture(gesture);
    setIsStarted(true);
  };

  return (
    <div className="relative w-full h-full bg-[#050103] overflow-hidden">
      {!isStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl">
          <div className="text-center p-12 bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl backdrop-blur-md max-w-lg w-full">
            <h1 className="serif text-6xl text-pink-100 tracking-tighter mb-4 uppercase">Olivia</h1>
            <p className="text-pink-200/50 text-sm tracking-[0.3em] uppercase mb-12">A 3D Interactive Experience</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => startApp(false)}
                className="group relative px-8 py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-full transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(219,39,119,0.4)]"
              >
                <span className="relative z-10 font-semibold tracking-widest">ENTER EXPERIENCE</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button 
                onClick={() => startApp(true)}
                className="px-8 py-4 border border-pink-500/30 text-pink-300 rounded-full hover:bg-pink-500/10 transition-all tracking-widest font-light"
              >
                GESTURE MODE (CAMERA)
              </button>
            </div>
          </div>
        </div>
      )}

      {isStarted && (
        <>
          <div className="absolute inset-0 cursor-pointer" onClick={toggleState}>
            <Canvas
              camera={{ position: [0, 2, 18], fov: 45 }}
              dpr={[1, 2]}
              gl={{ antialias: false }}
            >
              <color attach="background" args={['#050103']} />
              <Scene state={state} handData={handData} />
              
              <EffectComposer disableNormalPass>
                <Bloom 
                  luminanceThreshold={0.5} 
                  intensity={1.5} 
                  levels={8} 
                  mipmapBlur 
                />
                <Vignette eskil={false} offset={0.1} darkness={0.8} />
              </EffectComposer>
            </Canvas>
          </div>

          <div className="absolute top-8 left-8 text-pink-100 pointer-events-none select-none z-10">
            <h1 className="serif text-4xl font-light tracking-tight mb-1">Olivia</h1>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${state === TreeState.TREE ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`} />
              <p className="text-[10px] opacity-40 tracking-[0.4em] uppercase">{state}</p>
            </div>
          </div>

          {useGesture && <GestureOverlay onHandUpdate={handleHandUpdate} />}
        </>
      )}
    </div>
  );
};

export default App;
