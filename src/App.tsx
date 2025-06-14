import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { useBackgroundMusic } from './hooks/useBackgroundMusic';
import { AuroraBackground } from './components/ui/aurora-background';

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    isMusicEnabled, 
    toggleMusic, 
    hasMusic,
    nextTrack,
    currentTrackIndex,
    totalTracks
  } = useBackgroundMusic();

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isCompleted) {
      // Reset if completed
      setTimeLeft(25 * 60);
      setIsCompleted(false);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
    setIsCompleted(false);
  };

  const getTimerStateClass = () => {
    if (isCompleted) return 'text-emerald-400 animate-pulse';
    if (isRunning) return 'text-emerald-400';
    return 'text-slate-300 dark:text-slate-400';
  };

  const getTimerBorderClass = () => {
    if (isCompleted) return 'border-emerald-400/50 shadow-lg shadow-emerald-400/20 animate-pulse bg-emerald-400/5';
    if (isRunning) return 'border-emerald-400/30 shadow-lg shadow-emerald-400/10 bg-emerald-400/5';
    return 'border-slate-300/20 dark:border-slate-600/30 bg-white/10 dark:bg-slate-800/20';
  };

  return (
    <AuroraBackground className="min-h-screen">
      {/* Music Controls - Top Right */}
      {hasMusic && (
        <div className="absolute top-6 right-6 z-20 flex flex-col items-center space-y-3">
          {/* Music Toggle */}
          <button
            onClick={toggleMusic}
            className={`group relative w-12 h-12 rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
              isMusicEnabled 
                ? 'border-emerald-400/50 bg-emerald-400/10 hover:bg-emerald-400/20' 
                : 'border-slate-300/30 dark:border-slate-600/50 hover:border-emerald-400/50 hover:bg-emerald-400/10'
            }`}
            title={isMusicEnabled ? 'Turn off background music' : 'Turn on background music'}
          >
            <div className="flex items-center justify-center">
              {isMusicEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400 transition-colors" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-400 transition-colors" />
              )}
            </div>
          </button>

          {/* Skip Track Button - Only show when music is playing */}
          {isMusicEnabled && totalTracks > 1 && (
            <button
              onClick={nextTrack}
              className="group relative w-9 h-9 rounded-full border border-slate-300/30 dark:border-slate-600/50 hover:border-emerald-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-emerald-400/10"
              title={`Skip to next track (${currentTrackIndex + 1}/${totalTracks})`}
            >
              <div className="flex items-center justify-center">
                <SkipForward className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </button>
          )}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center space-y-12">
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.2em] text-slate-700 dark:text-slate-300 mb-2">
            LETS-FOCUS
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent mx-auto"></div>
        </div>

        {/* Timer Display */}
        <div className={`relative border-2 rounded-2xl p-8 md:p-12 backdrop-blur-sm transition-all duration-300 ${getTimerBorderClass()}`}>
          <div className={`text-6xl md:text-8xl font-mono font-light tracking-wider transition-colors duration-300 ${getTimerStateClass()}`}>
            {formatTime(timeLeft)}
          </div>
          
          {/* Status indicator */}
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-emerald-400 animate-pulse' :
              isRunning ? 'bg-emerald-400' : 'bg-slate-400 dark:bg-slate-600'
            }`}></div>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <p className={`text-sm md:text-base font-light tracking-wide transition-colors duration-300 ${
            isCompleted ? 'text-emerald-400' :
            isRunning ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {isCompleted ? 'FOCUS SESSION COMPLETE' :
             isRunning ? 'FOCUS MODE ACTIVE' : 'READY TO FOCUS'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-6">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className={`group relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
              isRunning 
                ? 'border-emerald-400/50 bg-emerald-400/10 hover:bg-emerald-400/20' 
                : 'border-slate-300/30 dark:border-slate-600/50 hover:border-emerald-400/50 hover:bg-emerald-400/10'
            }`}
          >
            <div className="flex items-center justify-center">
              {isRunning ? (
                <Pause className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 transition-colors" />
              ) : (
                <Play className="w-6 h-6 md:w-8 md:h-8 text-slate-400 dark:text-slate-500 group-hover:text-emerald-400 transition-colors ml-1" />
              )}
            </div>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="group relative w-12 h-12 md:w-16 md:h-16 rounded-full border border-slate-300/30 dark:border-slate-600/50 hover:border-slate-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-slate-200/10 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center justify-center">
              <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>
          </button>
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div className="text-center animate-fade-in">
            <p className="text-emerald-400 text-lg md:text-xl font-light tracking-wide mb-2">
              Time to take a break
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Click play to start another focus session
            </p>
          </div>
        )}
      </div>
    </AuroraBackground>
  );
}

export default App;