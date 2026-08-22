"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, UserPlus, Loader2 } from "lucide-react";
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
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Truck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Customer Account</h1>
          <p className="text-sm text-gray-500">Sign up to book and track shipments on LastMileX</p>
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
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition"
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
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
              placeholder="alice@example.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition"
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 rounded">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
