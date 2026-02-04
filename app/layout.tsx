

import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Najik - Family Location Tracking",
  description: "Simple location tracking for elderly parents and family helpers",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/images/logos/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logos/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/logos/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/images/logos/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Najik",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
