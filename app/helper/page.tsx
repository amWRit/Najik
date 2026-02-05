'use client';

import { useState, useEffect } from 'react';
import { useParentSOSPolling } from '@/hooks/useParentSOSPolling';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSubscription } from '@/hooks/useRealtime';
import { LocationUpdate, SOSAlert, User } from '@/lib/types/database.types';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import StatusIndicator from '@/components/StatusIndicator/StatusIndicator';
import BatteryIndicator from '@/components/BatteryIndicator/BatteryIndicator';
import Loading from '@/components/Loading/Loading';
import dynamic from 'next/dynamic';
import styles from './helper.module.css';

// Dynamically import Map component (client-side only)
const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

interface ParentStatus {
  user: User;
  lastLocation: LocationUpdate | null;
  sosAlert: SOSAlert | null;
  isSharing: boolean;
}

export default function HelperPage() {
    const [parentUsers, setParentUsers] = useState<{id: string, name: string, email: string}[]>([]);
    const [selectedParent, setSelectedParent] = useState<User | null>(null);
    // New state for latest location update
    const [latestLocation, setLatestLocation] = useState<LocationUpdate | null>(null);
    // Fetch latest location for selected parent (for fallback and debug)
    useEffect(() => {
      if (!selectedParent) {
        setLatestLocation(null);
        return;
      }
      const fetchLatest = async () => {
        try {
          const res = await fetch(`/api/location-update/latest?user_id=${selectedParent.id}`);
          if (res.ok) {
            const data = await res.json();
            console.log('DEBUG: /api/location-update/latest response for selectedParent:', data);
            setLatestLocation(data.locationUpdate || null);
          } else {
            console.warn('Failed to fetch latest locationUpdate for selectedParent', selectedParent.id, res.status);
            setLatestLocation(null);
          }
        } catch (err) {
          console.error('Error fetching latest locationUpdate for selectedParent', selectedParent.id, err);
          setLatestLocation(null);
        }
      };
      fetchLatest();
    }, [selectedParent]);
  
    // Auto-select first parent when parentUsers is loaded
    useEffect(() => {
      if (parentUsers.length > 0 && !selectedParent) {
        setSelectedParent({
          id: parentUsers[0].id,
          name: parentUsers[0].name,
          email: parentUsers[0].email,
        } as User);
      }
    }, [parentUsers, selectedParent]);
    // Track sharing status for each parent
    const [parentSharing, setParentSharing] = useState<Record<string, boolean>>({});
  // (Test click handler removed)
  // Selected parent info for display
  const [selectedParentInfo, setSelectedParentInfo] = useState<ParentStatus | null>(null);
  // SOS polling for selected parent
  const { sosActive: parentSOSActive } = useParentSOSPolling(selectedParent?.id || '');
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
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
    if (!authLoading && !user) {
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
  }, [user, authLoading, router]);

  // Fetch latest location update for each parent to determine sharing status
  useEffect(() => {
    if (!parentUsers.length) {
      setParentSharing({});
      return;
    }
    const fetchSharing = async () => {
      const sharing: Record<string, boolean> = {};
      await Promise.all(parentUsers.map(async (parent) => {
        try {
          const res = await fetch(`/api/location-update/latest?user_id=${parent.id}`);
          if (res.ok) {
            const data = await res.json();
            console.log('Fetched locationUpdate for parent', parent.id, parent.name, data.locationUpdate);
            sharing[parent.id] = !!(data?.locationUpdate?.is_sharing);
          } else {
            console.warn('Failed to fetch locationUpdate for parent', parent.id, parent.name, res.status);
            sharing[parent.id] = false;
          }
        } catch (err) {
          console.error('Error fetching locationUpdate for parent', parent.id, parent.name, err);
          sharing[parent.id] = false;
        }
      }));
      setParentSharing(sharing);
    };
    fetchSharing();
  }, [parentUsers]);

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
      sosAlert: parentSOSActive
        ? {
            id: 'active',
            user_id: selectedParent.id,
            latitude: 0,
            longitude: 0,
            timestamp: new Date().toISOString(),
            acknowledged_at: null,
            acknowledged_by: null,
            is_active: true,
          }
        : null,
      isSharing: !!parentSharing[selectedParent.id],
    });
  }, [selectedParent, locationUpdates, parentSharing, latestLocation, parentSOSActive]);

  
  // Fetch parents and their status
  useEffect(() => {
    if (authLoading) return;
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
  }, [authLoading, user?.id, user?.role]);

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
    // TODO: Replace Supabase update with Prisma or other backend mutation
    setParents(prev =>
      prev.map(p =>
        p.sosAlert?.id === alertId
          ? { ...p, sosAlert: null }
          : p
      )
    );
  };

  const getTimeSince = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  if (authLoading) {
    return <Loading size="large" text="Loading dashboard..." />;
  }

  if (!user || user.role !== 'helper') {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Main header only, temp duplicate removed */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Helper Dashboard</h1>
          <button onClick={signOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
        <p className={styles.subtitle}>Welcome, {user.name}!</p>
      </header>

      <div className={styles.layout}>
        {/* Sidebar - Parents List */}
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Your Parents</h2>
          {parentLoading ? (
            <Loading size="large" text="Loading parents..." />
          ) : parentUsers.length === 0 ? (
            <Card>
              <p className={styles.emptyMessage}>
                No parents connected yet. Ask them to add you as a helper.
              </p>
            </Card>
          ) : (
            <div className={styles.parentsList}>
              {parentUsers.map((parent) => {
                const isSelected = selectedParent && selectedParent.id === parent.id;
                return (
                  <Card
                    key={parent.id}
                    className={
                      styles.parentCard +
                      (isSelected ? ' ' + styles.selectedParentCard : '') +
                      ' cursor-pointer'
                    }
                    onClick={() => {
                      console.log('Parent card clicked:', parent);
                      setSelectedParent({ id: parent.id, name: parent.name, email: parent.email } as User);
                    }}
                  >
                    <div className={styles.parentInfo}>
                      <h3 className={styles.parentName}>{parent.name}</h3>
                      <span className={styles.parentEmail}>{parent.email}</span>
                      {parentSharing[parent.id] && (
                        <span className={styles.sharingLabel}>Sharing Location</span>
                      )}
                      <button
                        style={{marginTop:'0.5rem',padding:'0.25rem 0.5rem',background:'#0070f3',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer'}}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParent({ id: parent.id, name: parent.name, email: parent.email } as User);
                        }}
                      >Select</button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </aside>

        {/* Main Content - Map and Details */}
        <main className={styles.mainContent}>
          {selectedParentInfo ? (
            <>
              {/* SOS Alert Banner */}
              {selectedParentInfo.sosAlert?.is_active && (
                <div className={styles.sosAlert}>
                  <div className={styles.sosAlertContent}>
                    <span className={styles.sosIcon}>🚨</span>
                    <div>
                      <h3 className={styles.sosTitle}>
                        EMERGENCY from {selectedParentInfo.user.name}
                      </h3>
                      <p className={styles.sosTime}>
                        {selectedParentInfo.sosAlert.timestamp ? new Date(selectedParentInfo.sosAlert.timestamp).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="success"
                    size="medium"
                    onClick={() => handleAcknowledgeSOS(selectedParentInfo.sosAlert!.id)}
                  >
                    ✓ Acknowledge SOS
                  </Button>
                </div>
              )}

              {/* Map */}
              {selectedParentInfo.lastLocation ? (
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
                <Card>
                  <div className={styles.noLocation}>
                    <span className={styles.noLocationIcon}>📍</span>
                    <h3>No Location Data</h3>
                    <p>{selectedParentInfo.user.name} hasn't shared their location yet.</p>
                  </div>
                </Card>
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
                <span className={styles.noSelectionIcon}>👈</span>
                <h3>Select a Parent</h3>
                <p>Choose a parent from the list to view their location</p>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
