
import React, { useEffect, useRef } from 'react';

export const AudioPlayer: React.FC<{ isMuted: boolean }> = ({ isMuted }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Standard festive loop or ambient Xmas synth
    // Using a placeholder festive-sounding URL (Public Domain/Royalty Free)
    const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); 
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    const playAudio = async () => {
        try {
            await audio.play();
        } catch (e) {
            console.log("Auto-play blocked, waiting for interaction");
        }
    };

    playAudio();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return null;
};
