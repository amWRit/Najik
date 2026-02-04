'use client';

import { useState, useEffect, useCallback } from 'react';

interface WakeLockSentinel {
  released: boolean;
  type: 'screen';
  release: () => Promise<void>;
}

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!isSupported || isLocked) return false;

    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      setWakeLock(lock);
      setIsLocked(true);

      lock.addEventListener('release', () => {
        setIsLocked(false);
        setWakeLock(null);
      });

      return true;
    } catch (err) {
      console.error('Failed to request wake lock:', err);
      return false;
    }
  }, [isSupported, isLocked]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        setIsLocked(false);
      } catch (err) {
        console.error('Failed to release wake lock:', err);
      }
    }
  }, [wakeLock]);

  useEffect(() => {
    // Re-request wake lock when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLocked && !wakeLock) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [isLocked, wakeLock, requestWakeLock]);

  return {
    isSupported,
    isLocked,
    requestWakeLock,
    releaseWakeLock,
  };
}
