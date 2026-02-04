import { useEffect, useRef, useState } from 'react';

const SOS_SOUND_PATH = '/sounds/sos-alarm.mp3';

export function useParentSOSPolling(parentId: string) {
  const [sosActive, setSosActive] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!parentId) return;
    let polling = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/sos/latest?userId=${parentId}`);
        if (!res.ok) throw new Error('Failed to fetch SOS status');
        const data = await res.json();
        if (data && data.is_active) {
          setSosActive(true);
          setAlertId(data.id);
          if (!audioRef.current) {
            const audio = new Audio(SOS_SOUND_PATH);
            audio.loop = true;
            audio.volume = 1.0;
            audio.play().catch(() => {});
            audioRef.current = audio;
          }
        } else {
          setSosActive(false);
          setAlertId(null);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
          }
        }
      } catch (err) {
        // Optionally handle error
      }
      if (polling) setTimeout(poll, 3000); // poll every 3s
    };
    poll();
    return () => {
      polling = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [parentId]);

  return { sosActive, alertId };
}
