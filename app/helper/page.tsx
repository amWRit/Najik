'use client';

import { useState, useEffect } from 'react';
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
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [parents, setParents] = useState<ParentStatus[]>([]);
  const [selectedParent, setSelectedParent] = useState<ParentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to location updates for selected parent
  const { data: locationUpdates } = useRealtimeSubscription<LocationUpdate>(
    'location_updates',
    selectedParent ? { column: 'user_id', value: selectedParent.user.id } : undefined
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

  // Fetch parents and their status
    useEffect(() => {
      // TODO: Replace Supabase logic with Prisma or other backend fetch
      // setParents([]); // Clear for now
      setLoading(false);
    }, [user]);

  // Auto-select parent if SOS alert
  useEffect(() => {
    if (sosAlerts.length > 0) {
      const sosParent = parents.find(p => p.sosAlert?.is_active);
      if (sosParent) {
        setSelectedParent(sosParent);
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

  if (authLoading || loading) {
    return <Loading size="large" text="Loading dashboard..." />;
  }

  if (!user || user.role !== 'helper') {
    return null;
  }

  return (
    <div className={styles.container}>
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
          
          {parents.length === 0 ? (
            <Card>
              <p className={styles.emptyMessage}>
                No parents connected yet. Ask them to add you as a helper.
              </p>
            </Card>
          ) : (
            <div className={styles.parentsList}>
              {parents.map((parent) => (
                <Card
                  key={parent.user.id}
                  variant={selectedParent?.user.id === parent.user.id ? 'elevated' : 'default'}
                  onClick={() => setSelectedParent(parent)}
                  className={styles.parentCard}
                >
                  <div className={styles.parentInfo}>
                    <h3 className={styles.parentName}>{parent.user.name}</h3>
                    
                    {parent.sosAlert?.is_active && (
                      <StatusIndicator status="sos" text="SOS ALERT" pulse />
                    )}
                    {parent.isSharing && !parent.sosAlert?.is_active && (
                      <StatusIndicator status="sharing" text="Sharing" />
                    )}
                    {!parent.isSharing && !parent.sosAlert?.is_active && (
                      <StatusIndicator status="offline" text="Offline" />
                    )}

                    {parent.lastLocation && (
                      <div className={styles.parentMeta}>
                        <span className={styles.metaItem}>
                          {getTimeSince(parent.lastLocation.timestamp)}
                        </span>
                        {parent.lastLocation.battery_level && (
                          <BatteryIndicator
                            level={parent.lastLocation.battery_level}
                            size="small"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </aside>

        {/* Main Content - Map and Details */}
        <main className={styles.mainContent}>
          {selectedParent ? (
            <>
              {/* SOS Alert Banner */}
              {selectedParent.sosAlert?.is_active && (
                <div className={styles.sosAlert}>
                  <div className={styles.sosAlertContent}>
                    <span className={styles.sosIcon}>🚨</span>
                    <div>
                      <h3 className={styles.sosTitle}>
                        EMERGENCY from {selectedParent.user.name}
                      </h3>
                      <p className={styles.sosTime}>
                        {new Date(selectedParent.sosAlert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="success"
                    size="medium"
                    onClick={() => handleAcknowledgeSOS(selectedParent.sosAlert!.id)}
                  >
                    ✓ Acknowledge SOS
                  </Button>
                </div>
              )}

              {/* Map */}
              {selectedParent.lastLocation ? (
                <div className={styles.mapContainer}>
                  <Map
                    center={[
                      selectedParent.lastLocation.latitude,
                      selectedParent.lastLocation.longitude,
                    ]}
                    locations={locationUpdates}
                    sosActive={selectedParent.sosAlert?.is_active}
                  />
                </div>
              ) : (
                <Card>
                  <div className={styles.noLocation}>
                    <span className={styles.noLocationIcon}>📍</span>
                    <h3>No Location Data</h3>
                    <p>{selectedParent.user.name} hasn't shared their location yet.</p>
                  </div>
                </Card>
              )}

              {/* Location Details */}
              {selectedParent.lastLocation && (
                <Card variant="elevated" className={styles.detailsCard}>
                  <h3 className={styles.detailsTitle}>Location Details</h3>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Last Update</span>
                      <span className={styles.detailValue}>
                        {new Date(selectedParent.lastLocation.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Accuracy</span>
                      <span className={styles.detailValue}>
                        ±{Math.round(selectedParent.lastLocation.accuracy)}m
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Coordinates</span>
                      <span className={styles.detailValue}>
                        {selectedParent.lastLocation.latitude.toFixed(6)}, {selectedParent.lastLocation.longitude.toFixed(6)}
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
