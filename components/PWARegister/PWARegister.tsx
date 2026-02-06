'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register main service worker only in production
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000); // Check every hour
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      }

      // Register Firebase Messaging service worker for push notifications (if needed)
      // navigator.serviceWorker
      //   .register('/firebase-messaging-sw.js')
      //   .then((registration) => {
      //     console.log('Firebase Messaging SW registered:', registration);
      //   })
      //   .catch((error) => {
      //     console.error('Firebase Messaging SW registration failed:', error);
      //   });

      // Listen for service worker updates
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        // Only reload if a new service worker is waiting and skip in development
        if (process.env.NODE_ENV === 'production' && navigator.serviceWorker.controller) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Handle install prompt
      let deferredPrompt: any;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // Store for later use
        (window as any).deferredPrompt = deferredPrompt;
      });

      // Handle successful installation
      window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        deferredPrompt = null;
      });
    }
  }, []);

  return null;
}
