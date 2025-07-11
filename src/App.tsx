import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { useBackgroundMusic } from './hooks/useBackgroundMusic';
import { AuroraBackground } from './components/ui/aurora-background';

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [selectedMinutes, setSelectedMinutes] = useState(25); // For the slider
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // Track if timer has ever been started
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const { 
    isMusicEnabled, 
    toggleMusic, 
    hasMusic,
    nextTrack,
    currentTrackIndex,
    totalTracks,
    stopMusic
  } = useBackgroundMusic();

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            // Stop music when timer completes
            stopMusic();
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
  }, [isRunning, timeLeft, stopMusic]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isCompleted) {
      // Reset if completed
      setTimeLeft(selectedMinutes * 60);
      setIsCompleted(false);
      setIsRunning(true);
      setHasStarted(true);
    } else if (!hasStarted) {
      // First time starting - use selected time
      setTimeLeft(selectedMinutes * 60);
      setIsRunning(true);
      setHasStarted(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedMinutes * 60);
    setIsCompleted(false);
    setHasStarted(false);
  };

  // Spacebar event handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger on spacebar and prevent if user is interacting with form elements
      if (event.code === 'Space' && 
          event.target instanceof HTMLElement && 
          !['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)) {
        event.preventDefault(); // Prevent page scroll
        handlePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isCompleted, hasStarted, isRunning, selectedMinutes]); // Dependencies to ensure latest state

  const handleSliderChange = (value: number) => {
    setSelectedMinutes(value);
    if (!hasStarted && !isRunning) {
      setTimeLeft(value * 60);
    }
  };

  const calculateSliderValue = (clientX: number) => {
    if (!sliderRef.current) return selectedMinutes;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(1 + percentage * 59); // 1 to 60 minutes
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow interaction if timer hasn't started
    if (hasStarted || isRunning || isCompleted) return;
    
    setIsDragging(true);
    const newValue = calculateSliderValue(e.clientX);
    handleSliderChange(newValue);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newValue = calculateSliderValue(e.clientX);
    handleSliderChange(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow interaction if timer hasn't started
    if (hasStarted || isRunning || isCompleted) return;
    
    setIsDragging(true);
    const touch = e.touches[0];
    const newValue = calculateSliderValue(touch.clientX);
    handleSliderChange(newValue);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const newValue = calculateSliderValue(touch.clientX);
    handleSliderChange(newValue);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add global event listeners for mouse and touch events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const getTimerStateClass = () => {
    if (isCompleted) return 'text-emerald-400 animate-pulse';
    if (isRunning) return 'text-emerald-400';
    return 'text-slate-300';
  };

  const getTimerBorderClass = () => {
    if (isCompleted) return 'border-emerald-400/50 shadow-lg shadow-emerald-400/20 animate-pulse bg-emerald-400/5';
    if (isRunning) return 'border-emerald-400/30 shadow-lg shadow-emerald-400/10 bg-emerald-400/5';
    return 'border-slate-600/30 bg-slate-800/20';
  };

  const getPlayButtonTooltip = () => {
    if (isCompleted) return 'Start New Session (Space)';
    if (!hasStarted) return 'Start Timer (Space)';
    return isRunning ? 'Pause Timer (Space)' : 'Resume Timer (Space)';
  };

  const isSliderDisabled = hasStarted || isRunning || isCompleted;

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
                : 'border-slate-600/50 hover:border-emerald-400/50 hover:bg-emerald-400/10'
            }`}
            title={isMusicEnabled ? 'Turn off background music' : 'Turn on background music'}
          >
            <div className="flex items-center justify-center">
              {isMusicEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400 transition-colors" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              )}
            </div>
          </button>

          {/* Skip Track Button - Only show when music is playing */}
          {isMusicEnabled && totalTracks > 1 && (
            <button
              onClick={nextTrack}
              className="group relative w-9 h-9 rounded-full border border-slate-600/50 hover:border-emerald-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-emerald-400/10"
              title={`Skip to next track (${currentTrackIndex + 1}/${totalTracks})`}
            >
              <div className="flex items-center justify-center">
                <SkipForward className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
             </button>
          )}
        </div>
      )}

    
      <div className="relative z-10 flex flex-col items-center space-y-12">
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.2em] text-slate-300 mb-2">
            LETS-FOCUS
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent mx-auto"></div>
        </div>

        {/* Timer Display */}
        <div className={`relative border-2 rounded-2xl p-8 md:p-12 backdrop-blur-sm transition-all duration-300 ${getTimerBorderClass()}`}>
          <div className={`text-7xl md:text-[200px] font-mono font-light tracking-wider transition-colors duration-300 ${getTimerStateClass()}`}>
            {formatTime(timeLeft)}
          </div>
          
          {/* Status indicator */}
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-emerald-400 animate-pulse' :
              isRunning ? 'bg-emerald-400' : 'bg-slate-600'
            }`}></div>
          </div>
        </div>

        {/* Time Slider - Always visible but disabled when timer has started */}
        <div className={`w-full max-w-md px-4 transition-all duration-300 ${
          isSliderDisabled ? 'opacity-30' : 'opacity-100 animate-fade-in'
        }`}>
          <div className="relative">
            {/* Slider Track */}
            <div 
              ref={sliderRef}
              className={`relative h-3 bg-slate-800/50 rounded-full backdrop-blur-sm border border-slate-700/30 transition-all duration-200 ${
                isSliderDisabled 
                  ? 'cursor-not-allowed' 
                  : `cursor-pointer ${isDragging ? 'scale-105' : 'hover:scale-102'}`
              }`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Progress Fill */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full transition-all duration-200"
                style={{ width: `${((selectedMinutes - 1) / 59) * 100}%` }}
              ></div>
              
              {/* Slider Thumb */}
              <div 
                className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-emerald-600 rounded-full border-3 border-slate-900 shadow-lg transition-all duration-200 ${
                  isSliderDisabled 
                    ? 'cursor-not-allowed' 
                    : `cursor-grab ${isDragging ? 'scale-125 cursor-grabbing shadow-xl' : 'hover:scale-110'}`
                }`}
                style={{ left: `${((selectedMinutes - 1) / 59) * 100}%` }}
              ></div>
            </div>
            
            {/* Slider Labels */}
            <div className="flex justify-between mt-3 text-xs text-slate-500 font-light">
              <span>1 min</span>
              <span>60 min</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-6">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className={`group relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
              isRunning 
                ? 'border-emerald-400/50 bg-emerald-400/10 hover:bg-emerald-400/20' 
                : 'border-slate-600/50 hover:border-emerald-400/50 hover:bg-emerald-400/10'
            }`}
            title={getPlayButtonTooltip()}
          >
            <div className="flex items-center justify-center">
              {isRunning ? (
                <Pause className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 transition-colors" />
              ) : (
                <Play className="w-6 h-6 md:w-8 md:h-8 text-slate-500 group-hover:text-emerald-400 transition-colors ml-1" />
              )}
            </div>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="group relative w-12 h-12 md:w-16 md:h-16 rounded-full border border-slate-600/50 hover:border-slate-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-slate-800/50"
            title="Reset Timer"
          >
            <div className="flex items-center justify-center">
              <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-hover:text-slate-300 transition-colors" />
            </div>
          </button>
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div className="text-center animate-fade-in">
            <p className="text-emerald-400 text-lg md:text-xl font-light tracking-wide mb-2">
              Time to take a break
            </p>
            <p className="text-slate-400 text-sm">
              Press spacebar or click play to start another focus session
            </p>
          </div>
        )}
      </div>
    </AuroraBackground>
  );
}

export default App;