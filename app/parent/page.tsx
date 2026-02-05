'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLocationSharing } from '@/hooks/useGeolocation';
import { useSOSPolling } from '@/hooks/useSOSPolling';
import { useSOS } from '@/hooks/useSOS';
import { useWakeLock } from '@/hooks/useWakeLock';
import Button from '@/components/Button/Button';
import StatusIndicator from '@/components/StatusIndicator/StatusIndicator';
import BatteryIndicator from '@/components/BatteryIndicator/BatteryIndicator';
import Loading from '@/components/Loading/Loading';
import Toast from '@/components/Toast/Toast';
import styles from './parent.module.css';
import { prisma } from '@/lib/prisma/client';

export default function ParentPage() {
  const [addHelperEmail, setAddHelperEmail] = useState("");
  const [addHelperStatus, setAddHelperStatus] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    isSharing,
    lastUpdate,
    error: locationError,
    startSharing,
    stopSharing,
  } = useLocationSharing();
  const { triggerSOS, cancelSOS } = useSOS(user?.id || '');
  const { sosActive, alertId } = useSOSPolling(user?.id || '');
  // Track if SOS was previously active
  const [wasSOSActive, setWasSOSActive] = useState(false);
  const [showCancelToast, setShowCancelToast] = useState(false);
  const { requestWakeLock, releaseWakeLock, isLocked: wakeLockActive } = useWakeLock();
  
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [helperName, setHelperName] = useState<string>('your helper');
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  // Periodically send location to backend while sharing
  useEffect(() => {
    if (!isSharing || !user?.id || !lastUpdate) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/location-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            latitude: lastUpdate.latitude,
            longitude: lastUpdate.longitude,
            accuracy: lastUpdate.accuracy,
            battery_level: batteryLevel,
            is_sharing: true,
            timestamp: new Date(lastUpdate.timestamp).toISOString(),
          }),
        });
        const result = await res.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to save location (interval)');
        }
      } catch (err) {
        console.error('Failed to save location (interval):', err);
      }
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [isSharing, user?.id, lastUpdate, batteryLevel]);

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

  // Auto-cancel SOS if helper acknowledges
  useEffect(() => {
    if (wasSOSActive && alertId === null) {
      // SOS was active, now cancelled by helper
      cancelSOS();
      stopSharing();
      releaseWakeLock();
      setShowCancelToast(true);
      setWasSOSActive(false);
    } else if (sosActive) {
      setWasSOSActive(true);
      // Alarm is managed by useSOS, no manual audio logic needed
    } else {
      // Alarm is managed by useSOS, no manual audio logic needed
    }
  }, [sosActive, alertId, wasSOSActive, cancelSOS, stopSharing, releaseWakeLock]);

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
        const res = await fetch('/api/location-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            battery_level: batteryLevel,
            is_sharing: true,
            timestamp: new Date(position.timestamp).toISOString(),
          }),
        });
        const result = await res.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to save location');
        }
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
    if (user?.id) {
      fetch('/api/location-update', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
    }
  }, [stopSharing, releaseWakeLock, user?.id]);

  const handleSOSClick = useCallback(async () => {
    if (!user) return;

    if (sosActive) {
      await cancelSOS();
      stopSharing();
      releaseWakeLock();
    } else {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await triggerSOS(pos.coords.latitude, pos.coords.longitude);
            if (!isSharing) {
              handleStartSharing();
            }
          },
          (err) => {
            console.error('Failed to get location for SOS:', err);
            triggerSOS(0, 0);
          }
        );
      }
    }
  }, [user, sosActive, cancelSOS, triggerSOS, isSharing, handleStartSharing, stopSharing, releaseWakeLock]);

  useEffect(() => {
    if (lastUpdate && typeof window !== 'undefined') {
      setLastUpdateTime(new Date(lastUpdate.timestamp).toLocaleTimeString());
    }
  }, [lastUpdate]);

  if (authLoading) {
    return <Loading size="large" text="Loading..." />;
  }

  if (!user || user.role !== 'parent') {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Toast for SOS cancelled by helper */}
      {showCancelToast && (
          <Toast message="SOS acknowledged by your helper." onClose={() => setShowCancelToast(false)} />
      )}
      {/* Add Helper UI */}
      <section className={styles.addHelperSection}>
        <h2>Add a Helper</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setAddHelperStatus(null);
            if (!addHelperEmail) return setAddHelperStatus("Please enter an email.");
            try {
              const res = await fetch("/api/relationship/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ parent_id: user.id, helper_email: addHelperEmail }),
              });
              const result = await res.json();
              if (result.success) {
                setAddHelperStatus("✅ Helper added successfully!");
                setAddHelperEmail("");
              } else {
                switch (res.status) {
                  case 400:
                    setAddHelperStatus("❌ Missing parent ID or helper email.");
                    break;
                  case 404:
                    setAddHelperStatus("❌ Helper not found or not a helper. Please check the email and role.");
                    break;
                  case 409:
                    setAddHelperStatus("⚠️ Relationship already exists.");
                    break;
                  default:
                    setAddHelperStatus(result.error ? `❌ ${result.error}` : "❌ Failed to add helper.");
                }
              }
            } catch (err) {
              setAddHelperStatus("❌ Network or server error while adding helper.");
            }
          }}
        >
          <input
            type="email"
            placeholder="Helper's email"
            value={addHelperEmail}
            onChange={(e) => setAddHelperEmail(e.target.value)}
            required
            className={styles.input}
          />
          <Button type="submit" variant="primary" size="medium">
            Add Helper
          </Button>
        </form>
        {addHelperStatus && <p className={styles.statusMsg}>{addHelperStatus}</p>}
      </section>
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

        {lastUpdate && lastUpdateTime && (
          <div className={styles.infoBox}>
            <span>✓</span>
            <span>Last updated: {lastUpdateTime}</span>
          </div>
        )}
      </main>
    </div>
  );
}
