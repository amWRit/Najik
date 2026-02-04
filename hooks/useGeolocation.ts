'use client';

import { useState, useEffect, useCallback } from 'react';
import { GeolocationPosition, LocationSharingState } from '@/lib/types/database.types';

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const geoPos: GeolocationPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setPosition(geoPos);
          setError(null);
          resolve(geoPos);
        },
        (err) => {
          const errorMessage = 
            err.code === 1 ? 'Location permission denied' :
            err.code === 2 ? 'Position unavailable' :
            err.code === 3 ? 'Location request timeout' :
            'An unknown error occurred';
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await getCurrentPosition();
      return true;
    } catch (err) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentPosition]);

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
    requestPermission,
  };
}

export function useLocationSharing() {
  const [state, setState] = useState<LocationSharingState>({
    isSharing: false,
    watchId: null,
    lastUpdate: null,
  });
  const [error, setError] = useState<string | null>(null);

  const startSharing = useCallback((
    onUpdate: (position: GeolocationPosition) => void
  ): boolean => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return false;
    }

    if (state.isSharing) {
      return false;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const geoPos: GeolocationPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setState((prev) => ({ ...prev, lastUpdate: geoPos }));
        onUpdate(geoPos);
        setError(null);
      },
      (err) => {
        const errorMessage =
          err.code === 1 ? 'Location permission denied' :
          err.code === 2 ? 'Position unavailable' :
          err.code === 3 ? 'Location request timeout' :
          'An unknown error occurred';
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setState({
      isSharing: true,
      watchId,
      lastUpdate: null,
    });

    return true;
  }, [state.isSharing]);

  const stopSharing = useCallback(() => {
    if (state.watchId !== null) {
      navigator.geolocation.clearWatch(state.watchId);
    }
    setState({
      isSharing: false,
      watchId: null,
      lastUpdate: null,
    });
    setError(null);
  }, [state.watchId]);

  useEffect(() => {
    return () => {
      if (state.watchId !== null) {
        navigator.geolocation.clearWatch(state.watchId);
      }
    };
  }, [state.watchId]);

  return {
    ...state,
    error,
    startSharing,
    stopSharing,
  };
}
