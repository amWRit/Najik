# Najik - Family Location Tracking

A Progressive Web App (PWA) for real-time location tracking designed specifically for elderly parents and their family helpers. Features include live location sharing, SOS emergency alerts with instant push notifications, and an intuitive interface optimized for elderly users.

![Najik Banner](https://via.placeholder.com/1200x400/4F46E5/FFFFFF?text=Najik+-+Stay+Connected+with+Loved+Ones)

## ✨ Features

### For Parents (Elderly Users)
- **🟢 One-Tap Location Sharing**: Large, clear button to start sharing location with helpers
- **🚨 SOS Emergency Button**: Instant emergency alert with:
  - Loud alarm sound
  - Phone vibration
  - Automatic location capture
  - High-priority push notifications to all helpers
  - Visual alerts
- **🔋 Battery Monitoring**: Shows current battery level to helpers
- **📱 Simple UI**: Extra-large buttons and text optimized for elderly users
- **🔒 Wake Lock**: Keeps screen on while sharing location

### For Helpers (Family Members)
- **🗺️ Real-Time Map View**: See parent's location updated live
- **📍 Breadcrumb Trail**: View last 30 minutes of location history
- **👥 Multiple Parents**: Monitor several parents from one dashboard
- **🚨 SOS Alerts**: Receive instant emergency notifications with:
  - Critical priority alerts
  - Sound and vibration
  - Auto-navigate to parent's location
  - Acknowledge button to stop alarm
- **📊 Status Dashboard**: See sharing status, last seen time, battery level
- **🔔 Push Notifications**: Get alerts even when app is closed

### Technical Features
- **⚡ Real-Time Updates**: Location updates every 10 seconds using Supabase Realtime
- **🔔 Push Notifications**: Firebase Cloud Messaging with background support
- **📱 PWA**: Installable on home screen, works offline
- **🔐 Secure**: Row Level Security (RLS) with Supabase
- **🎨 Modular Components**: Clean, reusable React components with CSS modules
- **🌓 Dark Mode**: Automatic dark mode support
- **♿ Accessibility**: High contrast, large touch targets (60px minimum)

## 🏗️ Tech Stack

- **Frontend**: Next.js 14+ with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with modular CSS for components
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth with role-based access
- **Maps**: Leaflet with OpenStreetMap (free tier)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **PWA**: Service Worker, Web App Manifest, offline support
- **APIs**: Geolocation API, Wake Lock API, Vibration API, Battery API

## 📋 Prerequisites

Before setting up, you'll need:

1. **Node.js** 18+ installed
2. **Supabase Account** (free tier): https://supabase.com
3. **Firebase Account** (free tier): https://firebase.google.com
4. **Git** for version control

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Navigate to project directory
cd najik

# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at https://supabase.com
2. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon/Public Key
3. Go to **SQL Editor** and run the schema from `lib/supabase/schema.sql`
4. Enable Realtime for tables:
   - Go to **Database > Replication**
   - Enable for: `location_updates`, `sos_alerts`, `messages`

### 3. Set Up Firebase

1. Create a new project at https://console.firebase.google.com
2. Enable **Cloud Messaging** (under Build menu)
3. Get your Firebase config:
   - Go to **Project Settings > General**
   - Scroll to "Your apps" and click Web app icon
   - Copy the config object
4. Generate VAPID key:
   - Go to **Project Settings > Cloud Messaging**
   - Under "Web Push certificates", click "Generate key pair"
   - Copy the VAPID key
5. Get Server Key:
   - Still in Cloud Messaging settings
   - Copy the "Server key" (needed for API)

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

# Firebase Server Key (for API routes)
FIREBASE_SERVER_KEY=your-server-key
```

### 5. Update Firebase Service Worker

Edit `public/firebase-messaging-sw.js` and replace the placeholder config with your actual Firebase config:

```javascript
firebase.initializeApp({
  apiKey: 'YOUR_ACTUAL_API_KEY',
  authDomain: 'YOUR_ACTUAL_AUTH_DOMAIN',
  projectId: 'YOUR_ACTUAL_PROJECT_ID',
  // ... rest of your config
});
```

### 6. Add SOS Alarm Sound

1. Create the directory: `public/sounds/`
2. Add an alarm sound file as `sos-alarm.mp3`
   - Use a loud, attention-grabbing alarm sound
   - Recommended: 3-5 seconds, looping-friendly
   - Free sounds: https://freesound.org or https://pixabay.com/sound-effects/

### 7. Generate PWA Icons

You'll need to create icons in various sizes. Use a tool like https://realfavicongenerator.net or create them manually:

Required icon sizes in `public/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`
- `apple-touch-icon.png` (180x180)
- `favicon.ico`
- `badge-72x72.png` (notification badge)

### 8. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 9. Test on Mobile Device

For proper testing of geolocation and notifications:

1. **Enable HTTPS**: Use ngrok or similar:
   ```bash
   npx ngrok http 3000
   ```
2. **Test on real device**: Open the ngrok URL on your phone
3. **Grant permissions**: Allow location and notifications when prompted

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel: https://vercel.com
3. Add environment variables in Vercel dashboard
4. Deploy!

Vercel automatically provides HTTPS, which is required for:
- Geolocation API
- Push Notifications
- Service Workers

### Post-Deployment Steps

1. **Update Firebase Config**: Add your Vercel domain to:
   - Firebase Console > Project Settings > Authorized domains
2. **Test PWA Installation**: On mobile, tap "Add to Home Screen"
3. **Test Notifications**: Ensure push notifications work when app is closed

## 🔧 Configuration

### Customize Brand Colors

Edit `app/globals.css` to change brand colors:

```css
:root {
  --color-brand-primary: #4F46E5;        /* Main brand color */
  --color-brand-sos-red: #DC2626;        /* SOS button color */
  --color-brand-share-green: #22C55E;    /* Share button color */
  /* ... */
}
```

### Adjust Location Update Frequency

Edit `app/parent/page.tsx`:

```typescript
// Change update interval (default: continuous with 10s intervals)
const UPDATE_INTERVAL = 10000; // milliseconds
```

### Modify Auto-Stop Sharing

By default, location sharing continues until manually stopped. To add auto-stop:

```typescript
// Add timeout (e.g., 4 hours)
const AUTO_STOP_HOURS = 4;
setTimeout(() => {
  handleStopSharing();
}, AUTO_STOP_HOURS * 60 * 60 * 1000);
```

## 📱 User Guide

### For Parents

1. **Register**: Create account with "Parent" role
2. **Share Location**:
   - Tap green "SHARE LOCATION" button
   - Grant location permission when prompted
   - Location updates every 10 seconds
3. **Emergency**:
   - Tap red "SOS HELP" button
   - Alarm plays and helpers are notified immediately
   - Tap "CANCEL SOS" to stop

### For Helpers

1. **Register**: Create account with "Helper" role
2. **Connect with Parent**:
   - Ask parent for their email
   - Add relationship in database (see Database section)
3. **Monitor Location**:
   - Select parent from list
   - View real-time location on map
   - See breadcrumb trail of recent movement
4. **Respond to SOS**:
   - Receive high-priority notification
   - Tap to view parent's location
   - Click "Acknowledge SOS" to stop alarm

## 🗄️ Database Management

### Add Relationship (Connect Helper to Parent)

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO relationships (helper_id, parent_id)
VALUES (
  'helper-user-id',
  'parent-user-id'
);
```

### View Active SOS Alerts

```sql
SELECT sa.*, u.name, u.email
FROM sos_alerts sa
JOIN users u ON sa.user_id = u.id
WHERE sa.is_active = true
ORDER BY sa.timestamp DESC;
```

### Clean Old Location Data

```sql
-- Run this periodically (or set up cron job)
DELETE FROM location_updates
WHERE timestamp < NOW() - INTERVAL '24 hours';
```

## 🔒 Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Row Level Security** is enabled - users can only access their own data
3. **HTTPS required** for geolocation and notifications
4. **Firebase Server Key** should be kept secret (server-side only)
5. **Rotate keys** periodically for production apps

## 🐛 Troubleshooting

### Location Not Updating

- Check location permission in browser settings
- Ensure HTTPS is enabled
- Verify Supabase Realtime is enabled for `location_updates` table
- Check browser console for errors

### Push Notifications Not Working

- Verify Firebase config is correct
- Check notification permission granted
- Ensure service worker is registered (check DevTools > Application > Service Workers)
- Test with Firebase's test notification feature first
- iOS requires iOS 16.4+ for web push

### Map Not Loading

- Check Leaflet CSS is imported
- Verify internet connection (OpenStreetMap requires online access)
- Check browser console for CORS errors

### SOS Alarm Not Playing

- Ensure `sos-alarm.mp3` exists in `public/sounds/`
- Check browser allows autoplay (may require user interaction first)
- Test alarm in browser console: `new Audio('/sounds/sos-alarm.mp3').play()`

## 📚 Project Structure

```
najik/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   └── send-notification/   # FCM notification sender
│   ├── auth/                    # Authentication pages
│   │   ├── login/              # Login page
│   │   └── register/           # Registration page
│   ├── parent/                  # Parent interface
│   ├── helper/                  # Helper dashboard
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles (brand colors)
├── components/                  # Reusable UI components
│   ├── Button/                 # Button component + styles
│   ├── Card/                   # Card component + styles
│   ├── StatusIndicator/        # Status badges + styles
│   ├── BatteryIndicator/       # Battery display + styles
│   ├── Loading/                # Loading spinner + styles
│   ├── Map/                    # Leaflet map component
│   └── PWARegister/            # PWA service worker registration
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts              # Authentication hook
│   ├── useGeolocation.ts       # Geolocation and location sharing
│   ├── useSOS.ts               # SOS alert management
│   ├── useRealtime.ts          # Supabase realtime subscriptions
│   ├── usePushNotifications.ts # FCM push notifications
│   └── useWakeLock.ts          # Wake Lock API
├── lib/                         # Utilities and configuration
│   ├── supabase/               # Supabase clients and schema
│   ├── firebase/               # Firebase configuration
│   └── types/                  # TypeScript type definitions
├── public/                      # Static assets
│   ├── sounds/                 # Audio files (SOS alarm)
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # Main service worker
│   ├── firebase-messaging-sw.js # Firebase messaging service worker
│   ├── offline.html            # Offline fallback page
│   └── icon-*.png              # PWA icons (various sizes)
└── README.md                    # This file
```

## 🎨 Component Architecture

All components follow a modular pattern:
- Each component has its own directory
- Component logic in `.tsx` file
- Component-specific styles in `.module.css`
- Global brand colors defined in `app/globals.css`
- Easy to customize and maintain

## 🤝 Contributing

This is a personal/family project, but suggestions are welcome:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - feel free to use this project for your own family!

## 🙏 Acknowledgments

- Built with love for elderly parents who need a simple way to stay connected
- OpenStreetMap for free map tiles
- Supabase for amazing real-time database
- Firebase for reliable push notifications
- Next.js team for the excellent framework

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review Firebase and Supabase documentation

---

**Made with ❤️ for families who care**

Stay connected, stay safe! 🌟
