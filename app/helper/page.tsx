'use client';

import { useState, useEffect } from 'react';
// import { useParentSOSPolling } from '@/hooks/useParentSOSPolling';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSubscription } from '@/hooks/useRealtime';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { LocationUpdate, SOSAlert, User } from '@/lib/types/database.types';

import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import StatusIndicator from '@/components/StatusIndicator/StatusIndicator';
import BatteryIndicator from '@/components/BatteryIndicator/BatteryIndicator';
import Loading from '@/components/Loading/Loading';
import Modal from '@/components/Modal/Modal';
import Toast from '@/components/Toast/Toast';
import Navbar from '@/components/Navbar/Navbar';
import styles from './helper.module.css';
import dynamic from 'next/dynamic';
import SupportedUsersModal from '@/components/SupportedUsersModal/SupportedUsersModal';
import GenericSelector from '@/components/GeneralSelector/GeneralSelector';

// Dynamically import Map component (client-side only)
const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

interface ParentStatus {
  user: User;
  lastLocation: LocationUpdate | null;
  sosAlert: SOSAlert | null;
  isSharing: boolean;
}

export default function HelperPage() {
    // Toast for cancel/acknowledge
    const [showCancelToast, setShowCancelToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    // Welcome modal state
    const [showWelcome, setShowWelcome] = useState(true);
    // Settings modal state
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    // Supported users modal state
    const [showSupportedUsersModal, setShowSupportedUsersModal] = useState(false);
    // Authentication hook (add this before push notification integration)
    const { user, signOut, loading } = useAuth();

    // Push notification integration
    const {
      permission,
      token,
      error: notifError,
      requestPermission
    } = usePushNotifications(user?.id);
    // Notification prompt modal state
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
    // Request notification permission on first load
    useEffect(() => {
      if (user && permission === 'default') {
        setShowNotificationPrompt(true);
      }
    }, [user, permission]);
    const handleEnableNotifications = async () => {
      const granted = await requestPermission();
      if (granted) {
        setToastMsg('✅ Notifications enabled! You\'ll receive SOS alerts.');
        setShowCancelToast(true);
      } else {
        setToastMsg('❌ Please enable notifications to receive emergency alerts.');
        setShowCancelToast(true);
      }
      setShowNotificationPrompt(false);
    };
    // Unlock audio context on first user interaction
    useEffect(() => {
      let ctx: AudioContext | null = null;
      const unlockAudio = () => {
        try {
          ctx = window.AudioContext ? new window.AudioContext() : (window as any).webkitAudioContext && new (window as any).webkitAudioContext();
          if (ctx && ctx.state === 'suspended') {
            ctx.resume();
          }
        } catch {}
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
      return () => {
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        if (ctx) ctx.close();
      };
    }, []);
    const [parentUsers, setParentUsers] = useState<{id: string, name: string, email: string}[]>([]);
    // For SupportedUsersModal
    const supportedUsers = parentUsers.map(p => ({ name: p.name, email: p.email }));
    const [selectedParent, setSelectedParent] = useState<User | null>(null);
    // New state for latest location update
    const [latestLocation, setLatestLocation] = useState<LocationUpdate | null>(null);
    // Manual selection only: do not auto-select parent
    // Track sharing status for each parent
    const [parentSharing, setParentSharing] = useState<Record<string, boolean>>({});
    // (Test click handler removed)
    // Poll for latest location if parent is selected and sharing
    const selectedParentRef = useRef<User | null>(null);
    const parentSharingRef = useRef<Record<string, boolean>>({});
    useEffect(() => {
      selectedParentRef.current = selectedParent;
    }, [selectedParent]);
    useEffect(() => {
      parentSharingRef.current = parentSharing;
    }, [parentSharing]);

    useEffect(() => {
      let cancelled = false;
      let pollTimeout: NodeJS.Timeout | null = null;
      async function pollLocation() {
        const currentParent = selectedParentRef.current;
        const currentSharing = parentSharingRef.current;
        if (!currentParent || !currentSharing[currentParent.id]) {
          setLatestLocation(null);
          return;
        }
        try {
          const res = await fetch(`/api/location-update/latest?user_id=${currentParent.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.locationUpdate) {
              setLatestLocation(data.locationUpdate);
              setParentSharing(prev => ({ ...prev, [currentParent.id]: !!data.locationUpdate.is_sharing }));
            } else {
              setLatestLocation(null);
              setParentSharing(prev => ({ ...prev, [currentParent.id]: false }));
            }
          } else {
            setLatestLocation(null);
            setParentSharing(prev => ({ ...prev, [currentParent.id]: false }));
          }
        } catch {
          setLatestLocation(null);
          setParentSharing(prev => ({ ...prev, [currentParent.id]: false }));
        }
        if (!cancelled && currentParent && currentSharing[currentParent.id]) {
          pollTimeout = setTimeout(pollLocation, 3000);
        }
      }
      if (selectedParent && parentSharing[selectedParent.id]) {
        pollLocation();
      } else {
        setLatestLocation(null);
      }
      return () => {
        cancelled = true;
        if (pollTimeout) clearTimeout(pollTimeout);
      };
    }, [selectedParent, parentSharing]);
    // Selected parent info for display
    const [selectedParentInfo, setSelectedParentInfo] = useState<ParentStatus | null>(null);
    // SOS polling for all parents
    const [sosAlertsState, setSosAlertsState] = useState<Record<string, SOSAlert | null>>({});
    const audioRef = useRef<HTMLAudioElement | null>(null);
    // Track acknowledging state for each SOS alert
    const [acknowledging, setAcknowledging] = useState<Record<string, boolean>>({});

    useEffect(() => {
      if (!parentUsers.length) return;
      let polling = true;
      const pollSOS = async () => {
        const newSosAlerts: Record<string, SOSAlert | null> = {};
        let anyActiveSOS = false;
        for (const parent of parentUsers) {
          try {
            const res = await fetch(`/api/sos/latest?userId=${parent.id}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.is_active) {
                newSosAlerts[parent.id] = data;
                anyActiveSOS = true;
              } else {
                newSosAlerts[parent.id] = null;
              }
            } else {
              newSosAlerts[parent.id] = null;
            }
          } catch {
            newSosAlerts[parent.id] = null;
          }
        }
        setSosAlertsState(newSosAlerts);
        // Play sound if any SOS active
        if (anyActiveSOS) {
          if (!audioRef.current) {
            const audio = new Audio('/sounds/sos-alarm.mp3');
            audio.loop = true;
            audio.volume = 1.0;
            audio.play().catch(() => {});
            audioRef.current = audio;
          }
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
          }
        }
        if (polling) setTimeout(pollSOS, 3000);
      };
      pollSOS();
      return () => {
        polling = false;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
      };
    }, [parentUsers]);
  const router = useRouter();
  const [parents, setParents] = useState<ParentStatus[]>([]);
  const [parentLoading, setParentLoading] = useState(true);

  // Subscribe to location updates for selected parent
  const locationFilter = selectedParent ? { column: 'user_id', value: selectedParent.id } : undefined;
  const { data: locationUpdates } = useRealtimeSubscription<LocationUpdate>(
    'location_updates',
    locationFilter
  );

  // Subscribe to SOS alerts
  const { data: sosAlerts } = useRealtimeSubscription<SOSAlert>(
    'sos_alerts',
    { column: 'is_active', value: true }
  );

  // Check authentication and role
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user && user.role === 'helper') {
      // Stay on helper page
    } else if (user && user.role === 'parent') {
      router.push('/parent');
    } else if (user && (!user.role || (user.role !== 'parent' && user.role !== 'helper'))) {
      // Unknown role, sign out and redirect to login
      signOut();
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Fetch latest location update for each parent to determine sharing status
  useEffect(() => {
    if (!parentUsers.length || !selectedParent) {
      setParentSharing({});
      return;
    }
    let cancelled = false;
    const fetchSharing = async () => {
      try {
        const res = await fetch(`/api/location-update/latest?user_id=${selectedParent.id}`);
        const sharing: Record<string, boolean> = {};
        if (res.ok) {
          const data = await res.json();
          sharing[selectedParent.id] = !!(data?.locationUpdate?.is_sharing);
        } else {
          sharing[selectedParent.id] = false;
        }
        if (!cancelled) setParentSharing(sharing);
      } catch (err) {
        if (!cancelled) setParentSharing({ [selectedParent.id]: false });
      }
    };
    fetchSharing();
    const interval = setInterval(fetchSharing, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [parentUsers, selectedParent]);

  // Fetch selected parent's location and status when selected
  useEffect(() => {
    if (!selectedParent) {
      setSelectedParentInfo(null);
      setLatestLocation(null);
      return;
    }
    // Find the latest location update for the selected parent
    let lastLocation = null;
    if (Array.isArray(locationUpdates) && locationUpdates.length > 0) {
      lastLocation = locationUpdates[locationUpdates.length - 1];
    } else if (latestLocation) {
      // Fallback: use latestLocation from fetch if real-time is empty
      lastLocation = latestLocation;
    }
    setLatestLocation(lastLocation);
    setSelectedParentInfo({
      user: selectedParent,
      lastLocation,
      sosAlert: sosAlertsState[selectedParent.id] || null,
      isSharing: !!parentSharing[selectedParent.id],
    });
  }, [selectedParent, locationUpdates, parentSharing, latestLocation, sosAlertsState]);

  
  // Fetch parents and their status
  useEffect(() => {
    if (loading) return;
    if (!user || !user.id || user.role !== 'helper') return;
    setParentLoading(true);
    fetch(`/api/relationship/parents?helper_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setParentUsers(data.parents || []);
        setParentLoading(false);
      })
      .catch(() => {
        setParentUsers([]);
        setParentLoading(false);
      });
    // Only run when user.id or user.role changes
  }, [loading, user?.id, user?.role]);

  // Auto-select parent if SOS alert
  useEffect(() => {
    if (sosAlerts.length > 0) {
      const sosParent = parents.find(p => p.sosAlert?.is_active);
      if (sosParent) {
        setSelectedParent(sosParent.user);
      }
    }
  }, [sosAlerts, parents]);

  const handleAcknowledgeSOS = async (alertId: string) => {
    if (!user) return;
    setAcknowledging((prev) => ({ ...prev, [alertId]: true }));
    try {
      const res = await fetch(`/api/sos/${alertId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: false,
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        }),
      });
      const result = await res.json();
      // Stop alarm audio immediately
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (res.ok && result.success) {
        setToastMsg('SOS acknowledged and alarm cancelled');
        setShowCancelToast(true);
        setParents(prev =>
          prev.map(p =>
            p.sosAlert?.id === alertId
              ? { ...p, sosAlert: null }
              : p
          )
        );
      } else {
        setToastMsg(result.error || 'Failed to acknowledge SOS');
        setShowCancelToast(true);
      }
    } catch (err) {
      // Stop alarm audio on error as well
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setToastMsg('Network error while acknowledging SOS');
      setShowCancelToast(true);
    } finally {
      setAcknowledging((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  const getTimeSince = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

    // State for custom select menu
  const [showParentMenu, setShowParentMenu] = useState(false);
  // Close menu on outside click
  useEffect(() => {
    if (!showParentMenu) return;
    const handle = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.' + styles.customSelect)) {
        setShowParentMenu(false);
      }
    };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [showParentMenu]);

  if (loading) {
    if (showNotificationPrompt) {
      return (
        <Modal isOpen={showNotificationPrompt} onClose={() => setShowNotificationPrompt(false)} title="Enable Notifications?">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-base text-gray-700">To receive real-time SOS alerts, please enable push notifications.</p>
            <Button size="medium" variant="primary" onClick={handleEnableNotifications} className="px-6 py-2 rounded-full flex items-center gap-2 shadow-md">
              <span>Enable Notifications</span>
              <span aria-hidden="true">🔔</span>
            </Button>
            {notifError && <p className="text-red-500 text-sm mt-2">{notifError}</p>}
          </div>
        </Modal>
      );
    }
    return <Loading size="large" text="Loading dashboard..." />;
  }

  if (!user || user.role !== 'helper') {
    return null;
  }

    return (
      <div className={styles.container}>
        {/* Show a visible enable notifications banner if not granted */}
        {permission !== 'granted' && (
          <div style={{position: 'fixed', top: 0, left: 0, width: '100%', background: '#FEF3C7', color: '#92400E', padding: '12px 0', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{marginRight: 16}}>Push notifications are not enabled.</span>
            <Button size="medium" variant="primary" onClick={handleEnableNotifications}>
              Enable Notifications
            </Button>
          </div>
        )}
        {/* Toast for SOS cancel/acknowledge */}
        {showCancelToast && (
          <Toast message={toastMsg} onClose={() => setShowCancelToast(false)} />
        )}
        <Modal isOpen={showWelcome} onClose={() => setShowWelcome(false)} title="Helper Dashboard!">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-base text-gray-700">This dashboard helps you monitor and assist your connected supported users in real time.</p>
            <Button size="medium" variant="primary" onClick={() => setShowWelcome(false)} className="px-6 py-2 rounded-full flex items-center gap-2 shadow-md">
              <span>Get Started</span>
              <span aria-hidden="true">🚀</span>
            </Button>
          </div>
        </Modal>
        {/* Navbar with settings menu */}
        <Navbar
          title="Najik Helper"
          userRole="helper"
          userName={user.name ?? undefined}
          onSignOut={signOut}
          onSettingsClick={() => setShowSettingsMenu(true)}
        />
        {/* Settings Menu Modal */}
        {showSettingsMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>
              <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded" onClick={() => { setShowSupportedUsersModal(true); setShowSettingsMenu(false); }}>
                Supported Users
              </button>
              <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded mt-2" onClick={signOut}>
                Sign Out
              </button>
              <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded mt-2" onClick={() => setShowSettingsMenu(false)}>
                Close
              </button>
            </div>
          </div>
        )}
        {/* Supported Users Modal */}
        <SupportedUsersModal
          open={showSupportedUsersModal}
          supportedUsers={supportedUsers}
          helperId={user.id}
          helperName={user.name ?? undefined}
          onClose={() => setShowSupportedUsersModal(false)}
          onDelete={async (email) => {
            if (!user?.id) return;
            try {
              const res = await fetch('/api/relationship', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ helper_id: user.id, parent_email: email }),
              });
              if (res.ok) {
                setParentUsers((prev) => prev.filter((u) => u.email !== email));
              } else {
                // Optionally show error toast
                setToastMsg('Failed to remove supported user');
                setShowCancelToast(true);
              }
            } catch {
              setToastMsg('Network error while removing supported user');
              setShowCancelToast(true);
            }
          }}
        />
        <div className={styles.layout}>
          {/* Modern Parent Selector */}
          <div className={styles.parentSelectWrapper}>
            <div className={styles.selectContainer}>
              {(() => {
                const parentOptions = [
                  { id: '', label: 'Deselect', sublabel: 'Stop monitoring location' },
                  ...parentUsers.map(parent => ({
                    id: parent.id,
                    label: parent.name,
                    sublabel: parent.email,
                    badge:
                      selectedParent && selectedParent.id === parent.id && parentSharing[parent.id]
                        ? 'Sharing'
                        : undefined,
                  }))
                ];
                return (
                  <GenericSelector
                    label="Your Supported Users"
                    placeholder="Select a supported user..."
                    options={parentOptions}
                    value={selectedParent?.id || null}
                    onChange={option => {
                      if (option.id === '') {
                        setSelectedParent(null);
                      } else {
                        const parent = parentUsers.find(p => p.id === option.id);
                        if (parent) setSelectedParent({ id: parent.id, name: parent.name, email: parent.email } as User);
                      }
                    }}
                    loading={parentLoading}
                    loadingText="Loading parents..."
                    emptyMessage="No parents connected yet. Ask them to add you as a helper."
                  />
                );
              })()}
            </div>
          </div>

        {/* Main Content - Map and Details */}
        <main className={styles.mainContent}>
          {/* Show SOS alert for any parent with active SOS (always visible) */}
          {Object.entries(sosAlertsState).map(([pid, alert]) =>
            alert?.is_active ? (
              <div key={pid} className={styles.sosAlert}>
                <div className={styles.sosAlertContent}>
                  <span className={styles.sosIcon}>🚨</span>
                  <div>
                    <h3 className={styles.sosTitle}>
                      EMERGENCY from {parentUsers.find(p => p.id === pid)?.name || 'Unknown'}
                    </h3>
                    <p className={styles.sosTime}>
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
                <Button
                  variant="success"
                  size="medium"
                  onClick={() => handleAcknowledgeSOS(alert.id)}
                  disabled={!!acknowledging[alert.id]}
                >
                  {acknowledging[alert.id] ? 'Acknowledging...' : '✓ Acknowledge SOS'}
                </Button>
              </div>
            ) : null
          )}

          {selectedParentInfo ? (
            <>
              {/* Map */}
              {selectedParentInfo.isSharing && selectedParentInfo.lastLocation ? (
                <div className={styles.mapContainer}>
                  <Map
                    center={[
                      selectedParentInfo.lastLocation.latitude,
                      selectedParentInfo.lastLocation.longitude,
                    ]}
                    locations={
                      Array.isArray(locationUpdates) && locationUpdates.length > 0
                        ? locationUpdates
                        : [selectedParentInfo.lastLocation]
                    }
                    sosActive={selectedParentInfo.sosAlert?.is_active}
                  />
                </div>
              ) : (
                parentLoading || !selectedParent ? null : (
                  <Card>
                    <div className={styles.noLocation}>
                      <span className={styles.noLocationIcon}>📍</span>
                      <h3>No Location Data</h3>
                      <p>{selectedParentInfo.user.name} hasn't shared their location yet.</p>
                    </div>
                  </Card>
                )
              )}

              {/* Location Details */}
              {selectedParentInfo.lastLocation && (
                <Card variant="elevated" className={styles.detailsCard}>
                  <h3 className={styles.detailsTitle}>Location Details</h3>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Last Update</span>
                      <span className={styles.detailValue}>
                        {new Date(selectedParentInfo.lastLocation.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Accuracy</span>
                      <span className={styles.detailValue}>
                        ±{Math.round(selectedParentInfo.lastLocation.accuracy)}m
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Coordinates</span>
                      <span className={styles.detailValue}>
                        {selectedParentInfo.lastLocation.latitude.toFixed(6)}, {selectedParentInfo.lastLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className={styles.noSelection}>
                <span className={styles.noSelectionIcon}>🧑‍🤝‍🧑</span>
                <h3>Select a Supported User</h3>
                <p>Choose a supported user from the list to view their location</p>
              </div>
            </Card>
          )}
        </main>
      </div>
      </div>
    );
}
