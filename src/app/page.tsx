"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/types/enums";
import {
  ShieldCheck,
  ArrowRight,
  Calculator,
  Workflow,
  Check,
  ChevronRight,
  Truck,
  Package,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  // Interactive Live Rate Estimator State
  const [calcLength, setCalcLength] = useState(25);
  const [calcBreadth, setCalcBreadth] = useState(20);
  const [calcHeight, setCalcHeight] = useState(15);
  const [calcActualWeight, setCalcActualWeight] = useState(2.5);
  const [isCod, setIsCod] = useState(false);

  // Volumetric formula: (L * B * H) / 5000
  const volumetricWeight = Number(((calcLength * calcBreadth * calcHeight) / 5000).toFixed(2));
  const chargeableWeight = Math.max(calcActualWeight, volumetricWeight);
  const baseRate = 80;
  const extraWeight = Math.max(0, chargeableWeight - 1);
  const weightCharge = Math.ceil(extraWeight) * 40;
  const codFee = isCod ? 45 : 0;
  const totalEstimate = baseRate + weightCharge + codFee;

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.role === UserRole.ADMIN) return "/admin/dashboard";
    if (user.role === UserRole.DELIVERY_AGENT) return "/agent/dashboard";
    return "/dashboard";
  };

  return (
    <div className="w-full bg-canvas text-ink">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-hairline-soft pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="eyebrow-label flex items-center gap-2 text-sky-400">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
              Enterprise Last-Mile Logistics Infrastructure
            </div>

            <h1 className="max-w-4xl text-4xl sm:text-5xl lg:text-display-lg font-bold text-ink tracking-tight leading-[1.1]">
              Every shipment. Accounted for.
            </h1>

            <p className="text-body-lg text-ink-muted leading-relaxed max-w-xl">
              Quote accurately, assign drivers automatically, and maintain an immutable record of every delivery from pickup to proof of delivery.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={getDashboardHref()}
                className="btn-primary"
              >
                <span>{user ? "Open Console" : "Start Dispatching"}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/orders/new"
                className="btn-secondary"
              >
                <Calculator className="mr-2 h-4 w-4 text-ink-muted" />
                <span>Calculate Quote</span>
              </Link>
            </div>

            {/* Logistics Feature Capabilities */}
            <div className="pt-8 border-t border-hairline-soft flex flex-wrap items-center gap-x-6 gap-y-3 text-caption text-ink-muted">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Volumetric Weight Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Automated Driver Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Immutable Audit Logs</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Tracking & Telemetry Terminal Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-lg bg-surface-1 border border-hairline p-5 sm:p-6 space-y-4 overflow-hidden">
              {/* Header bar of dispatch preview */}
              <div className="flex items-center justify-between border-b border-hairline-soft pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-ink">ORDER #LX-9482</span>
                  <span className="text-caption text-ink-subtle">· Intra-Zone</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-xs border border-emerald-500/20 font-medium">
                  IN TRANSIT
                </span>
              </div>

              {/* Live Dispatch Steps */}
              <div className="space-y-3 font-sans text-xs">
                <div className="rounded-md bg-surface-2 p-3.5 border border-hairline-soft space-y-2">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <Workflow className="h-3.5 w-3.5 text-sky-400" />
                      Lifecycle Pipeline
                    </span>
                    <span className="font-mono text-[10px] text-ink-subtle">LATENCY: &lt; 2ms</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 font-mono">
                    <span className="text-ink-subtle">CONFIRMED</span>
                    <span className="text-sky-400">&rarr;</span>
                    <span className="text-ink-subtle">ASSIGNED</span>
                    <span className="text-sky-400">&rarr;</span>
                    <span className="text-sky-400 font-bold">IN_TRANSIT</span>
                    <span className="text-ink-subtle">&rarr;</span>
                    <span className="text-ink-subtle">DELIVERED</span>
                  </div>
                </div>

                {/* Rate Breakdown */}
                <div className="rounded-md bg-surface-2 p-3.5 border border-hairline-soft space-y-2">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5 text-indigo-400" />
                      Rate Snapshot
                    </span>
                    <span className="font-mono text-ink-muted font-bold text-xs">₹160.00</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                    <div>
                      <span className="text-ink-subtle">VOLUMETRIC: </span>
                      <span className="text-ink font-semibold">{volumetricWeight} kg</span>
                    </div>
                    <div>
                      <span className="text-ink-subtle">CHARGEABLE: </span>
                      <span className="text-ink font-semibold">{chargeableWeight} kg</span>
                    </div>
                  </div>
                </div>

                {/* Driver & Route Status */}
                <div className="rounded-md bg-surface-2 p-3.5 border border-hairline-soft flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Truck className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="text-[12px] font-semibold text-ink">Driver #AG-102 (Rajesh K.)</div>
                      <div className="text-[10px] sm:text-[11px] text-ink-muted">Zone A · 2 active deliveries</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-xs border border-emerald-500/20">
                    ASSIGNED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRODUCT CAPABILITIES SECTION */}
      <section className="py-20 border-t border-hairline-soft bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-3">
            <div className="eyebrow-label">
              Integrated Capabilities
            </div>
            <h2 className="text-2xl sm:text-headline font-bold text-ink tracking-tight">
              Engineered for Enterprise Logistics Control
            </h2>
            <p className="text-body text-ink-muted max-w-2xl leading-relaxed">
              Every stage of the dispatch lifecycle is supported by explicit business rules, rate settlement matrices, and role clearance bounds.
            </p>
          </div>

          {/* 3-Column Capability Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. RATE ENGINE */}
            <div className="card-surface-1 space-y-4 hover:border-hairline transition">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">
                  Pricing & Settlement
                </div>
                <Calculator className="h-4 w-4 text-sky-400" />
              </div>
              <h3 className="text-card-title font-bold text-ink tracking-tight">
                Volumetric Rate Engine
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Calculates actual vs. volumetric weight, evaluates zone slab matrices, and creates immutable rate snapshots upon order confirmation.
              </p>
              <div className="pt-4 border-t border-hairline-soft flex items-center justify-between text-xs">
                <span className="text-ink-subtle font-mono">Volumetric Quotient: 5000</span>
                <Link href="/orders/new" className="inline-flex items-center gap-1 text-ink font-semibold hover:underline">
                  Rate Calculator <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 2. STATE MACHINE */}
            <div className="card-surface-1 space-y-4 hover:border-hairline transition">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">
                  Workflow Control
                </div>
                <Workflow className="h-4 w-4 text-indigo-400" />
              </div>
              <h3 className="text-card-title font-bold text-ink tracking-tight">
                Order Lifecycle Engine
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Strict 10-state lifecycle transitions prevent out-of-order state updates and append immutable tracking event histories.
              </p>
              <div className="pt-4 border-t border-hairline-soft flex items-center justify-between text-xs">
                <span className="text-ink-subtle font-mono">10 Lifecycle States</span>
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-ink font-semibold hover:underline">
                  View Timeline <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. DISPATCH ASSIGNMENT */}
            <div className="card-surface-1 space-y-4 hover:border-hairline transition">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">
                  Fleet Automation
                </div>
                <Truck className="h-4 w-4 text-emerald-400" />
              </div>
              <h3 className="text-card-title font-bold text-ink tracking-tight">
                Automated Driver Dispatch
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Deterministic driver scoring matches availability, zone coverage, active workload limits, and proximity with race-condition protection.
              </p>
              <div className="pt-4 border-t border-hairline-soft flex items-center justify-between text-xs">
                <span className="text-ink-subtle font-mono">Concurrency Protection</span>
                <Link href="/agent/dashboard" className="inline-flex items-center gap-1 text-ink font-semibold hover:underline">
                  Driver Fleet <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 4. AUDIT & CUSTODY */}
            <div className="card-surface-1 space-y-4 hover:border-hairline transition">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">
                  Security & Access
                </div>
                <ShieldCheck className="h-4 w-4 text-amber-400" />
              </div>
              <h3 className="text-card-title font-bold text-ink tracking-tight">
                Role-Based Access Control
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Enforces strict role permissions for Customers, Delivery Drivers, and Operations Admins with audit trails for status overrides.
              </p>
              <div className="pt-4 border-t border-hairline-soft flex items-center justify-between text-xs">
                <span className="text-ink-subtle font-mono">Customer · Driver · Admin</span>
                <Link href="/login" className="inline-flex items-center gap-1 text-ink font-semibold hover:underline">
                  Security Model <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 5. RESCHEDULE & FAILURE */}
            <div className="card-surface-1 space-y-4 hover:border-hairline transition">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">
                  Exception Management
                </div>
                <Zap className="h-4 w-4 text-rose-400" />
              </div>
              <h3 className="text-card-title font-bold text-ink tracking-tight">
                Failure & Reschedule Pipeline
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Structured failure reason reporting with self-service customer rescheduling capped at 3 attempts before manual resolution.
              </p>
              <div className="pt-4 border-t border-hairline-soft flex items-center justify-between text-xs">
                <span className="text-ink-subtle font-mono">Max 3 Reschedule Attempts</span>
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-ink font-semibold hover:underline">
                  Exception Rules <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 6. EVENT MESH */}
            <div className="card-surface-1 space-y-4 hover:border-hairline transition">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">
                  Notifications
                </div>
                <Clock className="h-4 w-4 text-cyan-400" />
              </div>
              <h3 className="text-card-title font-bold text-ink tracking-tight">
                Event Mesh Audit Log
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Multi-channel email and SMS notification dispatcher with provider delivery logging and operations admin retry mechanics.
              </p>
              <div className="pt-4 border-t border-hairline-soft flex items-center justify-between text-xs">
                <span className="text-ink-subtle font-mono">SMS / Email Retry Logs</span>
                <Link href="/admin/notifications" className="inline-flex items-center gap-1 text-ink font-semibold hover:underline">
                  Event Logs <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE VOLUMETRIC SIMULATOR */}
      <section className="py-20 border-t border-hairline-soft bg-surface-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-2 text-center max-w-3xl mx-auto">
            <div className="eyebrow-label text-sky-400">
              Interactive Estimator
            </div>
            <h2 className="text-2xl sm:text-headline font-bold text-ink tracking-tight">
              Test Volumetric Rate Calculation
            </h2>
            <p className="text-body text-ink-muted leading-relaxed">
              Calculates chargeable weight using the standard quotient formula: <span className="font-mono text-ink">(L × B × H) / 5000</span>.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center bg-canvas p-6 sm:p-8 rounded-lg border border-hairline">
            {/* Input Parameters */}
            <div className="lg:col-span-7 space-y-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted border-b border-hairline-soft pb-2">
                Package Dimensions & Weight
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase">Length (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={calcLength}
                    onChange={(e) => setCalcLength(Number(e.target.value))}
                    className="input-surface w-full mt-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase">Breadth (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={calcBreadth}
                    onChange={(e) => setCalcBreadth(Number(e.target.value))}
                    className="input-surface w-full mt-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase">Height (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={calcHeight}
                    onChange={(e) => setCalcHeight(Number(e.target.value))}
                    className="input-surface w-full mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase">Actual Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={calcActualWeight}
                    onChange={(e) => setCalcActualWeight(Number(e.target.value))}
                    className="input-surface w-full mt-1.5"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="inline-flex items-center gap-2 cursor-pointer p-2.5 rounded-md bg-surface-1 border border-hairline hover:bg-surface-2 transition">
                    <input
                      type="checkbox"
                      checked={isCod}
                      onChange={(e) => setIsCod(e.target.checked)}
                      className="rounded-xs text-sky-500 focus:ring-sky-500"
                    />
                    <span className="text-xs font-semibold text-ink">Cash-on-Delivery (COD)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Live Calculation Output Panel */}
            <div className="lg:col-span-5 bg-surface-1 p-6 rounded-lg border border-hairline space-y-4">
              <div className="flex items-center justify-between border-b border-hairline-soft pb-3">
                <span className="text-eyebrow font-semibold uppercase text-ink-muted">
                  Quote Breakdown
                </span>
                <span className="font-mono text-xs text-ink-subtle">INTRA_ZONE</span>
              </div>

              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between text-ink-muted">
                  <span>Volumetric Weight:</span>
                  <span className="text-ink">{volumetricWeight} kg</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Actual Scale Weight:</span>
                  <span className="text-ink">{calcActualWeight} kg</span>
                </div>
                <div className="flex justify-between text-sky-400 font-bold pt-1 border-t border-hairline-soft">
                  <span>Chargeable Weight:</span>
                  <span>{chargeableWeight} kg</span>
                </div>
                <div className="flex justify-between text-ink-muted pt-2">
                  <span>Base Rate:</span>
                  <span>₹{baseRate}.00</span>
                </div>
                {weightCharge > 0 && (
                  <div className="flex justify-between text-ink-muted">
                    <span>Weight Surcharge:</span>
                    <span>₹{weightCharge}.00</span>
                  </div>
                )}
                {isCod && (
                  <div className="flex justify-between text-ink-muted">
                    <span>COD Fee:</span>
                    <span>₹{codFee}.00</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-hairline flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-subtle">Estimated Price</div>
                  <div className="text-3xl font-bold text-ink">₹{totalEstimate}.00</div>
                </div>
                <Link
                  href="/orders/new"
                  className="btn-primary"
                >
                  Book Shipment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA BANNER */}
      <section className="py-20 border-t border-hairline-soft bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-surface-1 border border-hairline p-8 sm:p-12 text-center space-y-5">
            <div className="eyebrow-label text-sky-400">
              Ready to Dispatch?
            </div>
            <h2 className="text-2xl sm:text-headline font-bold text-ink max-w-2xl mx-auto tracking-tight">
              Start Managing Last-Mile Deliveries
            </h2>
            <p className="text-body text-ink-muted max-w-xl mx-auto leading-relaxed">
              Access customer, driver, or admin consoles directly. Calculate rates or create shipments with instant quote snapshots.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link
                href="/register"
                className="btn-primary"
              >
                Create Account
              </Link>
              <Link
                href="/orders/new"
                className="btn-secondary"
              >
                Book Shipment
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
