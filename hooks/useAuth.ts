"use client";
import { useSession, signOut } from "next-auth/react";


export interface AuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export function useAuth(): {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => void;
} {
  const { data: session, status } = useSession();
  // Map session.user to AuthUser, including id and role if present
  const user: AuthUser | null = session?.user
    ? {
        id: (session.user as any).id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        role: (session.user as any).role ?? null,
      }
    : null;
  const loading = status === "loading";
  return {
    user,
    loading,
    signOut,
  };
}
