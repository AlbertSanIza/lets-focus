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
      
      // Try to find sound files (soundN.mp3) - check up to 20 but only add existing ones
      while (index <= 4) {
        try {
          const response = await fetch(`/sound${index}.mp3`, { method: 'HEAD' });
          if (response.ok) {
            tracks.push(`/sound${index}.mp3`);
          } else {
            // If we hit a missing file and we already have some tracks, 
            // assume we've found all consecutive tracks
            if (tracks.length > 0) {
              break;
            }
          }
        } catch {
          // File doesn't exist - if we have tracks, we're probably done with consecutive numbering
          if (tracks.length > 0) {
            break;
          }
        }
        index++;
      }
      
      // Sort tracks to ensure proper order (sound1, sound2, etc.)
      tracks.sort((a, b) => {
        const aNum = parseInt(a.match(/sound(\d+)\.mp3/)?.[1] || '0');
        const bNum = parseInt(b.match(/sound(\d+)\.mp3/)?.[1] || '0');
        return aNum - bNum;
      });
      
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

  const stopMusic = () => {
    setIsMusicEnabled(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return {
    isMusicEnabled,
    toggleMusic,
    nextTrack,
    setVolume,
    stopMusic,
    currentTrackIndex,
    totalTracks: musicTracks.length,
    hasMusic: musicTracks.length > 0
  };
};