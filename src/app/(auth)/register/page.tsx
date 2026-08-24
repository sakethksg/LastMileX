"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      await refreshUser();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
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
          <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-product-waypoint">
            Account Registration
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight font-sans">
            Create Customer Account
          </h1>
          <p className="text-xs text-ink-muted leading-relaxed">
            Provision access to the LastMileX dispatch platform
          </p>
        </div>

        {error && (
          <ErrorState
            title="Registration Error"
            message={error}
            code="VALIDATION_ERROR"
            className="p-4"
          />
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label
              htmlFor="register-name"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Johnson"
              className="input-surface mt-1 block w-full text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@company.com"
              className="input-surface mt-1 block w-full text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Password (min. 6 characters)
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />}
            {loading ? "Provisioning..." : "Create Customer Account"}
          </button>
        </form>

        <div className="text-center text-xs text-ink-subtle border-t border-hairline-soft pt-4">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-product-waypoint hover:underline focus-visible:outline-2 focus-visible:outline-accent-blue rounded-xs">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
