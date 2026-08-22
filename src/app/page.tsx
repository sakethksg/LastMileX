"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/types/enums";
import {
  Truck,
  Package,
  ShieldCheck,
  Zap,
  ArrowRight,
  Calculator,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.role === UserRole.ADMIN) return "/admin/dashboard";
    if (user.role === UserRole.DELIVERY_AGENT) return "/agent/dashboard";
    return "/dashboard";
  };

  return (
    <div className="w-full space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-xs">
          <Zap className="h-3.5 w-3.5" />
          Enterprise-Grade Last-Mile Dispatch & Logistics
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Precision Delivery Logistics for the <span className="text-blue-600">Modern Supply Chain</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Deterministic rate quoting, transactional order snapshots, multi-factor driver auto-assignment, strict delivery state machine transitions, and real-time operational dashboards.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href={getDashboardHref()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700 transition"
          >
            {user ? "Open Your Dashboard" : "Enter Dispatch Platform"}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <Calculator className="h-4 w-4 text-blue-600" />
            Instant Rate Calculator
          </Link>
        </div>
      </section>

      {/* Role Portals Grid */}
      <section className="grid md:grid-cols-3 gap-6 pt-4">
        {/* Customer Portal */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Package className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Customer Portal</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Create shipments with live volumetric quotes, track dispatches with granular state timeline events, and reschedule failed deliveries.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Access Customer App <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Delivery Agent Portal */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Truck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Driver Portal</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Manage route dispatches, view active workloads, execute state transitions (Pickup $\rightarrow$ In Transit $\rightarrow$ Complete), and record failure reasons.
          </p>
          <div className="pt-2">
            <Link
              href="/agent/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Access Driver App <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Admin Console */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Admin Console</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Real-time fleet monitoring, deterministic driver auto-assignment, manual dispatches, snapshot financial KPIs, and notification retry management.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700"
            >
              Access Admin Console <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="rounded-3xl border border-gray-200 bg-white p-8 sm:p-10 shadow-xs space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Engineered Core Principles</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Deterministic Pricing
            </div>
            <p className="text-xs text-gray-500">
              Volumetric weight resolution and slab rate cards protected by immutable order snapshots.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              State Machine Safety
            </div>
            <p className="text-xs text-gray-500">
              Strict finite transitions prevent invalid status jumps and safeguard terminal delivered states.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Monotonic Retries
            </div>
            <p className="text-xs text-gray-500">
              Rescheduling creates new attempts ($n+1$) while preserving historical failure records.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Idempotent Events
            </div>
            <p className="text-xs text-gray-500">
              Event-driven notifications decoupled from core transactions with exponential retry.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
