'use client';

import { useState, useCallback } from 'react';
import { SOSState } from '@/lib/types/database.types';
import { prisma } from '@/lib/prisma/client';

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
      // Create SOS alert in database using Prisma
      const alert = await prisma.sos_alerts.create({
        data: {
          user_id: userId,
          latitude,
          longitude,
          is_active: true,
          timestamp: new Date().toISOString(),
        },
      });

      // Play alarm sound
      const audio = playAlarm();

      // Vibrate phone
      vibrate();

      // Update state
      setState({
        isActive: true,
        alertId: alert.id,
        audio,
      });

      return alert.id;
    } catch (error) {
      console.error('Error triggering SOS:', error);
      throw error;
    }
  }, [userId, playAlarm, vibrate]);

  const cancelSOS = useCallback(async () => {
    try {
      if (state.alertId) {
        // Update SOS alert as inactive using Prisma
        await prisma.sos_alerts.update({
          where: { id: state.alertId },
          data: { is_active: false },
        });
      }

      // Stop alarm
      if (state.audio) {
        state.audio.pause();
        state.audio.currentTime = 0;
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
    } catch (error) {
      console.error('Error canceling SOS:', error);
    }
  }, [state]);

  const acknowledgeSOS = useCallback(async (alertId: string, helperId: string) => {
    try {
      await prisma.sos_alerts.update({
        where: { id: alertId },
        data: {
          is_active: false,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: helperId,
        },
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
