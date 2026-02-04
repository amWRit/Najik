'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationUpdate } from '@/lib/types/database.types';
import styles from './Map.module.css';

interface MapProps {
  center: [number, number];
  zoom?: number;
  locations: LocationUpdate[];
  sosActive?: boolean;
}

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Map({ center, zoom = 15, locations, sosActive }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const pathRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers and path
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (pathRef.current) {
      pathRef.current.remove();
      pathRef.current = null;
    }

    if (locations.length === 0) return;

    // Get the most recent location
    const sortedLocations = [...locations].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latestLocation = sortedLocations[0];

    // Create custom icon for SOS
    const icon = sosActive
      ? L.divIcon({
          html: '<div class="marker-sos">🚨</div>',
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })
      : L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

    // Add current location marker
    const marker = L.marker([latestLocation.latitude, latestLocation.longitude], { icon })
      .addTo(mapRef.current)
      .bindPopup(
        `<div>
          <strong>${sosActive ? '🚨 SOS LOCATION' : 'Current Location'}</strong><br/>
          Time: ${new Date(latestLocation.timestamp).toLocaleTimeString()}<br/>
          Accuracy: ${Math.round(latestLocation.accuracy)}m
        </div>`
      );

    markersRef.current.push(marker);

    // Draw path (breadcrumb trail) for last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentLocations = sortedLocations
      .filter(loc => new Date(loc.timestamp) > thirtyMinutesAgo)
      .reverse(); // Oldest to newest

    if (recentLocations.length > 1) {
      const path = L.polyline(
        recentLocations.map(loc => [loc.latitude, loc.longitude] as [number, number]),
        {
          color: sosActive ? '#dc2626' : '#3b82f6',
          weight: 4,
          opacity: 0.7,
        }
      ).addTo(mapRef.current);

      pathRef.current = path;
    }

    // Center map on latest location
    mapRef.current.setView([latestLocation.latitude, latestLocation.longitude], zoom);
  }, [locations, sosActive, zoom]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapContainerRef} className={styles.map} />
      {sosActive && (
        <div className={styles.sosOverlay}>
          🚨 SOS ACTIVE - Emergency Location
        </div>
      )}
    </div>
  );
}
