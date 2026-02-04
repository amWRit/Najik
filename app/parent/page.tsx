'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLocationSharing } from '@/hooks/useGeolocation';
import { useSOS } from '@/hooks/useSOS';
import { useWakeLock } from '@/hooks/useWakeLock';
import Button from '@/components/Button/Button';
import StatusIndicator from '@/components/StatusIndicator/StatusIndicator';
import BatteryIndicator from '@/components/BatteryIndicator/BatteryIndicator';
import Loading from '@/components/Loading/Loading';
import styles from './parent.module.css';
import { prisma } from '@/lib/prisma/client';

export default function ParentPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    isSharing,
    lastUpdate,
    error: locationError,
    startSharing,
    stopSharing,
  } = useLocationSharing();
  const {
    isActive: sosActive,
    triggerSOS,
    cancelSOS,
  } = useSOS(user?.id || '');
  const { requestWakeLock, releaseWakeLock, isLocked: wakeLockActive } = useWakeLock();
  
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [helperName, setHelperName] = useState<string>('your helper');

  // Check authentication and role
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user && user.role === 'parent') {
      // Stay on parent page
    } else if (user && user.role === 'helper') {
      router.push('/helper');
    } else if (user && (!user.role || (user.role !== 'parent' && user.role !== 'helper'))) {
      // Unknown role, sign out and redirect to login
      signOut();
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Get battery level
  useEffect(() => {
    const getBatteryLevel = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery: any = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        } catch (err) {
          console.error('Battery API not available:', err);
        }
      }
    };

    getBatteryLevel();
  }, []);

  // Get helper name
  useEffect(() => {
    const fetchHelperName = async () => {
      if (!user || !user.id) return;
      try {
        const res = await fetch(`/api/relationship?parent_id=${user.id}`);
        const data = await res.json();
        if (data.helperName) {
          setHelperName(data.helperName);
        }
      } catch (err) {
        console.error('Failed to fetch helper name:', err);
      }
    };
    fetchHelperName();
  }, [user]);

  const handleStartSharing = useCallback(() => {
    if (!user || !user.id) return;
    const success = startSharing(async (position) => {
      try {
        if (!user?.id) throw new Error('User ID is missing');
        await prisma.location_updates.create({
          data: {
            user_id: user.id,
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            battery_level: batteryLevel,
            is_sharing: true,
            timestamp: new Date(position.timestamp).toISOString(),
          },
        });
      } catch (err) {
        console.error('Failed to save location:', err);
      }
    });
    if (success) {
      requestWakeLock();
    }
  }, [user, startSharing, batteryLevel, requestWakeLock]);

  const handleStopSharing = useCallback(() => {
    stopSharing();
    releaseWakeLock();
  }, [stopSharing, releaseWakeLock]);

  const handleSOSClick = useCallback(async () => {
    if (!user) return;

    if (sosActive) {
      await cancelSOS();
    } else {
      // Get current position for SOS
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await triggerSOS(pos.coords.latitude, pos.coords.longitude);
            
            // Auto-start sharing if not already
            if (!isSharing) {
              handleStartSharing();
            }
          },
          (err) => {
            console.error('Failed to get location for SOS:', err);
            // Trigger SOS anyway with no location
            triggerSOS(0, 0);
          }
        );
      }
    }
  }, [user, sosActive, cancelSOS, triggerSOS, isSharing, handleStartSharing]);

  if (authLoading) {
    return <Loading size="large" text="Loading..." />;
  }

  if (!user || user.role !== 'parent') {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Najik</h1>
          <button type="button" onClick={() => signOut()} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
        <p className={styles.subtitle}>Hello, {user?.name}!</p>
      </header>

      <main className={styles.main}>
        {/* Status Display */}
        <div className={styles.statusCard}>
          {isSharing && (
            <StatusIndicator
              status="sharing"
              text={`Sharing with ${helperName}`}
              pulse
            />
          )}
          {sosActive && (
            <StatusIndicator
              status="sos"
              text="🚨 SOS ACTIVE - Help is notified"
              pulse
            />
          )}
          {!isSharing && !sosActive && (
            <StatusIndicator status="offline" text="Not sharing location" />
          )}
          
          {batteryLevel !== null && (
            <div className={styles.batteryContainer}>
              <BatteryIndicator level={batteryLevel} size="large" />
            </div>
          )}
        </div>

        {/* Error Display */}
        {locationError && (
          <div className={styles.errorAlert}>
            ⚠️ {locationError}
          </div>
        )}

        {/* Main Action Buttons */}
        <div className={styles.buttonGrid}>
          {/* Share Location Button */}
          <div className={styles.buttonContainer}>
            {!isSharing ? (
              <Button
                variant="share"
                size="large"
                fullWidth
                onClick={handleStartSharing}
                className={styles.mainButton}
              >
                <span className={styles.buttonIcon}>📍</span>
                <span>SHARE LOCATION</span>
              </Button>
            ) : (
              <Button
                variant="danger"
                size="large"
                fullWidth
                onClick={handleStopSharing}
                className={styles.mainButton}
              >
                <span className={styles.buttonIcon}>⏹</span>
                <span>STOP SHARING</span>
              </Button>
            )}
            <p className={styles.buttonHint}>
              {!isSharing
                ? 'Let your helper see where you are'
                : 'Your location is being shared'}
            </p>
          </div>

          {/* SOS Emergency Button */}
          <div className={styles.buttonContainer}>
            {!sosActive ? (
              <Button
                variant="sos"
                size="large"
                fullWidth
                onClick={handleSOSClick}
                className={styles.mainButton}
              >
                <span className={styles.buttonIcon}>🚨</span>
                <span>SOS HELP</span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="large"
                fullWidth
                onClick={handleSOSClick}
                className={styles.mainButton}
              >
                <span className={styles.buttonIcon}>❌</span>
                <span>CANCEL SOS</span>
              </Button>
            )}
            <p className={styles.buttonHint}>
              {!sosActive
                ? 'Press if you need immediate help'
                : 'Alarm is playing - help notified'}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        {wakeLockActive && (
          <div className={styles.infoBox}>
            <span>🔒</span>
            <span>Screen will stay on while sharing</span>
          </div>
        )}

        {lastUpdate && (
          <div className={styles.infoBox}>
            <span>✓</span>
            <span>Last updated: {new Date(lastUpdate.timestamp).toLocaleTimeString()}</span>
          </div>
        )}
      </main>
    </div>
  );
}
