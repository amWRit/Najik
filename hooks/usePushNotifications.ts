'use client';

import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase/config';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function usePushNotifications(userId?: string) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setIsSupported(true);
        setPermission(Notification.permission);
      }
    };
    checkSupport();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!isSupported) {
        setError('Notifications are not supported in this browser');
        return false;
      }

      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await registerServiceWorker();
        await getNotificationToken();
        return true;
      } else {
        setError('Notification permission denied');
        return false;
      }
    } catch (err: any) {
      console.error('Error requesting notification permission:', err);
      setError(err.message);
      return false;
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      } catch (err) {
        console.error('Service Worker registration failed:', err);
      }
    }
  };

  const getNotificationToken = async () => {
    try {
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        throw new Error('Firebase Messaging not available');
      }

      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (currentToken) {
        setToken(currentToken);
        
        // Save token to database
        if (userId) {
          // Save token to database using Prisma/REST API instead of supabase
        }
        
        return currentToken;
      } else {
        console.warn('No registration token available');
        return null;
      }
    } catch (err: any) {
      console.error('Error getting notification token:', err);
      setError(err.message);
      return null;
    }
  };

  const setupForegroundHandler = async () => {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification
      if (payload.notification) {
        new Notification(payload.notification.title || 'Najik', {
          body: payload.notification.body,
          icon: 'images/logos/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: payload.data?.type || 'default',
          requireInteraction: payload.data?.type === 'sos_alert',
        });
      }
    });
  };

  useEffect(() => {
    if (permission === 'granted') {
      setupForegroundHandler();
    }
  }, [permission]);

  return {
    permission,
    token,
    error,
    isSupported,
    requestPermission,
    getNotificationToken,
  };
}
