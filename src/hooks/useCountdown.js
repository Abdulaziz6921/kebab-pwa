import { useState, useEffect, useCallback } from 'react';

// Hook for countdown timer
export const useCountdown = (initialSeconds = 60, onComplete = null) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsComplete(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newSeconds = initialSeconds) => {
    setSeconds(newSeconds);
    setIsRunning(false);
    setIsComplete(false);
  }, [initialSeconds]);

  const toggle = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  useEffect(() => {
    let interval = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0 && isRunning) {
      setIsRunning(false);
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, seconds, onComplete]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formatted = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

  return {
    seconds,
    minutes,
    remainingSeconds,
    formatted,
    isRunning,
    isComplete,
    start,
    pause,
    reset,
    toggle,
  };
};

export default useCountdown;
