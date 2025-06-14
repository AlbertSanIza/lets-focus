import { useState, useEffect, useRef } from 'react';

export const useBackgroundMusic = () => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicTracks, setMusicTracks] = useState<string[]>([]);

  // Discover available music tracks
  useEffect(() => {
    const discoverTracks = async () => {
      const tracks: string[] = [];
      let index = 1;
      
      // Try to find music files (assuming they're named music1.mp3, music2.mp3, etc.)
      while (index <= 10) { // Check up to 10 files
        try {
          const response = await fetch(`/music${index}.mp3`, { method: 'HEAD' });
          if (response.ok) {
            tracks.push(`/music${index}.mp3`);
          } else {
            break; // Stop when we can't find more files
          }
        } catch {
          break;
        }
        index++;
      }
      
      // Also check for common music file names
      const commonNames = ['background.mp3', 'ambient.mp3', 'focus.mp3', 'chill.mp3'];
      for (const name of commonNames) {
        try {
          const response = await fetch(`/${name}`, { method: 'HEAD' });
          if (response.ok && !tracks.includes(`/${name}`)) {
            tracks.push(`/${name}`);
          }
        } catch {
          // File doesn't exist, continue
        }
      }
      
      setMusicTracks(tracks);
    };

    discoverTracks();
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (musicTracks.length > 0) {
      audioRef.current = new Audio(musicTracks[0]);
      audioRef.current.loop = false; // We'll handle looping manually to cycle tracks
      audioRef.current.volume = 0.3; // Set a comfortable volume
      
      // Handle track ending to cycle to next track
      const handleEnded = () => {
        setCurrentTrackIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % musicTracks.length;
          if (audioRef.current) {
            audioRef.current.src = musicTracks[nextIndex];
            if (isMusicEnabled) {
              audioRef.current.play().catch(console.error);
            }
          }
          return nextIndex;
        });
      };

      audioRef.current.addEventListener('ended', handleEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [musicTracks]);

  // Handle music enable/disable
  useEffect(() => {
    if (audioRef.current && musicTracks.length > 0) {
      if (isMusicEnabled) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicEnabled, musicTracks]);

  // Update audio source when track index changes
  useEffect(() => {
    if (audioRef.current && musicTracks.length > 0) {
      audioRef.current.src = musicTracks[currentTrackIndex];
      if (isMusicEnabled) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrackIndex, musicTracks, isMusicEnabled]);

  const toggleMusic = () => {
    setIsMusicEnabled(!isMusicEnabled);
  };

  const nextTrack = () => {
    if (musicTracks.length > 1) {
      setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % musicTracks.length);
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  };

  return {
    isMusicEnabled,
    toggleMusic,
    nextTrack,
    setVolume,
    currentTrackIndex,
    totalTracks: musicTracks.length,
    hasMusic: musicTracks.length > 0
  };
};