'use client';

import { useState, useCallback } from 'react';
import { SOSState } from '@/lib/types/database.types';


const SOS_SOUND_PATH = '/sounds/sos-alarm.mp3';

export function useSOS(userId: string) {
  const [state, setState] = useState<SOSState>({
    isActive: false,
    alertId: null,
    audio: null,
  });

  const playAlarm = useCallback(() => {
    try {
      const audio = new Audio(SOS_SOUND_PATH);
      audio.loop = true;
      audio.volume = 1.0;
      
      audio.play().catch((err) => {
        console.error('Failed to play SOS alarm:', err);
        // Fallback: try to play again after user interaction
        window.alert('🚨 SOS EMERGENCY ALERT 🚨');
      });

      return audio;
    } catch (err) {
      console.error('Failed to create audio:', err);
      return null;
    }
  }, []);

  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      // Pattern: vibrate for 500ms, pause for 200ms, repeat
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }, []);

  const triggerSOS = useCallback(async (latitude: number, longitude: number) => {
    try {
      // Call API route to create SOS alert
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, latitude, longitude }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create SOS alert');
      }
      const data = await res.json();

      // Play alarm sound
      const audio = playAlarm();

      // Vibrate phone
      vibrate();

      // Update state
      setState({
        isActive: true,
        alertId: data.id,
        audio,
      });

      return data.id;
    } catch (error) {
      console.error('Error triggering SOS:', error);
      throw error;
    }
  }, [userId, playAlarm, vibrate]);

  const cancelSOS = useCallback(async () => {
    try {
      if (state.alertId) {
        // Call API route to update SOS alert as inactive
        const res = await fetch(`/api/sos/${state.alertId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to cancel SOS alert');
        }
      }

      // Delete all location_updates for this user
      if (userId) {
        await fetch('/api/location-update', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
      }

      // Debug: check if audio exists
      if (state.audio) {
        console.log('[SOS DEBUG] Stopping alarm audio instance:', state.audio);
        state.audio.pause();
        state.audio.currentTime = 0;
      } else {
        console.log('[SOS DEBUG] No alarm audio instance to stop.');
      }

      // Stop vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }

      setState({
        isActive: false,
        alertId: null,
        audio: null,
      });

      return true;
    } catch (error) {
      console.error('Error cancelling SOS:', error);
      return false;
    }
  }, [state.alertId, state.audio, userId]);

  const acknowledgeSOS = useCallback(async (alertId: string, helperId: string) => {
    try {
      await fetch(`/api/sos/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helperId }),
      });
      return true;
    } catch (error) {
      console.error('Error acknowledging SOS:', error);
      return false;
    }
  }, []);

  return {
    ...state,
    triggerSOS,
    cancelSOS,
    acknowledgeSOS,
  };
}
