"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/types/enums";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, LogIn, Loader2, ShieldCheck } from "lucide-react";
import { fetchCurrentUser } from "@/lib/api/auth";
import { ErrorState } from "@/components/ui/ErrorState";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      // Fetch server-authoritative role from /api/auth/me
      await refreshUser();
      const verifiedUser = await fetchCurrentUser();

      if (!verifiedUser) {
        throw new Error("Unable to retrieve verified user profile");
      }

      if (verifiedUser.role === UserRole.ADMIN) {
        router.push("/admin/dashboard");
      } else if (verifiedUser.role === UserRole.DELIVERY_AGENT) {
        router.push("/agent/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-4 bg-canvas">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-hairline bg-surface-1 p-6 sm:p-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-surface-2 border border-hairline text-ink">
            <span className="font-mono font-bold text-sm">LX</span>
          </div>
          <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-product-vault">
            Security & Access
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight font-sans">
            Sign In to LastMileX
          </h1>
          <p className="text-xs text-ink-muted leading-relaxed">
            Enter your credentials to access your dispatch node
          </p>
        </div>

        {error && (
          <ErrorState
            title="Authentication Error"
            message={error}
            code="UNAUTHORIZED"
            className="p-4"
          />
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@company.com"
              className="input-surface mt-1 block w-full text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-surface mt-1 block w-full text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="btn-primary w-full py-2.5 mt-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />}
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-xs text-ink-subtle border-t border-hairline-soft pt-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-product-waypoint hover:underline focus-visible:outline-2 focus-visible:outline-accent-blue rounded-xs">
            Create Customer Account
          </Link>
        </div>
      </div>
    </div>
  );
}
