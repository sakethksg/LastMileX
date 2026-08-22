"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUserContext } from "@/types/domain";
import { fetchCurrentUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  user: AuthUserContext | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      setUser(null);
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Sign out failed");
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        refreshUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
