'use client';

import { useState, useCallback } from 'react';
import { SOSState } from '@/lib/types/database.types';
import { supabase } from '@/lib/supabase/client';

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
      // Create SOS alert in database
      const { data: alertData, error: alertError } = await (supabase
        .from('sos_alerts') as any)
        .insert({
          user_id: userId,
          latitude,
          longitude,
          is_active: true,
        })
        .select()
        .single();

      if (alertError) throw alertError;

      // Play alarm sound
      const audio = playAlarm();

      // Vibrate phone
      vibrate();

      // Update state
      setState({
        isActive: true,
        alertId: alertData.id,
        audio,
      });

      return alertData.id;
    } catch (error) {
      console.error('Error triggering SOS:', error);
      throw error;
    }
  }, [userId, playAlarm, vibrate]);

  const cancelSOS = useCallback(async () => {
    try {
      if (state.alertId) {
        // Update SOS alert as inactive
        await (supabase
          .from('sos_alerts') as any)
          .update({ is_active: false })
          .eq('id', state.alertId);
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
      await (supabase
        .from('sos_alerts') as any)
        .update({
          is_active: false,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: helperId,
        })
        .eq('id', alertId);

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
