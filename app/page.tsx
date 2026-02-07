

'use client';
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "parent" | "helper" | string;
};

type Session = {
  user?: SessionUser;
};

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession() as { data: Session; status: string };

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.role === "parent") {
      router.replace("/parent");
    } else if (session?.user?.role === "helper") {
      router.replace("/helper");
    }
  }, [session, status, router]);

  // Show spinner for loading or authenticated users (until redirect completes)
  if (
    status === "loading" ||
    session?.user?.role === "parent" ||
    session?.user?.role === "helper"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mx-auto mb-8"></div>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Checking session...</h2>
        </div>
      </div>
    );
  }

  // Only show home page content for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="text-center space-y-8 max-w-2xl">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Najik
        </h1>
        <p className="text-2xl text-gray-700 dark:text-gray-300">
          Stay Connected with Your Loved Ones
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Simple location tracking designed for elderly parents and family helpers
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link 
            href="/auth/login"
            className="btn-primary text-center"
          >
            Get Started
          </Link>
          <Link 
            href="/auth/register"
            className="btn-secondary text-center"
          >
            Create Account
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="card text-center">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-bold mb-2">Real-Time Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Share your location with family in real-time
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="text-xl font-bold mb-2">SOS Emergency</h3>
            <p className="text-gray-600 dark:text-gray-400">
              One-tap emergency alert to notify helpers instantly
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-xl font-bold mb-2">Push Notifications</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get instant alerts even when app is closed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
