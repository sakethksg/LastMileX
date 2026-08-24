"use client";

import React, { useState } from "react";
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
  Lock,
  Cpu,
  Layers,
  Terminal,
  Server,
  Workflow,
  Sparkles,
  Check,
  ChevronRight,
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
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="eyebrow-label flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-product-waypoint animate-pulse"></span>
              Enterprise Dispatch Infrastructure
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[72px] xl:text-display-xl font-bold text-ink tracking-tightest leading-[1.17]">
              Deterministic Logistics for Modern Supply Chains.
            </h1>

            <p className="text-body-lg text-ink-muted leading-[1.69] max-w-2xl">
              An enterprise delivery runtime featuring mathematical volumetric rate cards, cryptographic state custody, multi-factor autonomous fleet orchestration, and strict finite state machine guarantees.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={getDashboardHref()}
                className="btn-primary"
              >
                <span>{user ? "Open Your Console" : "Launch Dispatch Engine"}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/orders/new"
                className="btn-secondary"
              >
                <Calculator className="mr-2 h-4 w-4 text-product-waypoint" />
                <span>Calculate Live Quote</span>
              </Link>
            </div>

            {/* Architecture Identity Pills */}
            <div className="pt-8 border-t border-hairline-soft flex flex-wrap items-center gap-4 text-caption text-ink-subtle">
              <span className="font-mono text-ink-muted">Stack:</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-1 border border-hairline text-ink-muted">
                <span className="h-2 w-2 rounded-full bg-product-terraform"></span>
                <span>Terraform Quoting</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-1 border border-hairline text-ink-muted">
                <span className="h-2 w-2 rounded-full bg-product-vault"></span>
                <span>Vault Custody</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-1 border border-hairline text-ink-muted">
                <span className="h-2 w-2 rounded-full bg-product-waypoint"></span>
                <span>Waypoint FSM</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-1 border border-hairline text-ink-muted">
                <span className="h-2 w-2 rounded-full bg-product-nomad"></span>
                <span>Nomad Dispatch</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Isometric Visual Canvas */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-lg bg-surface-1 border border-hairline p-6 shadow-2xl space-y-4 overflow-hidden">
              {/* Header bar of mock telemetry terminal */}
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-product-consul/80"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-product-vault/80"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-product-nomad/80"></div>
                  <span className="ml-2 font-mono text-[11px] text-ink-subtle">
                    lastmilex-node-cluster.us-east
                  </span>
                </div>
                <span className="font-mono text-[10px] text-product-nomad bg-product-nomad/10 px-2 py-0.5 rounded-xs border border-product-nomad/20">
                  HEALTHY
                </span>
              </div>

              {/* Telemetry Visual Cards */}
              <div className="space-y-3 font-mono text-xs">
                {/* State Machine Transition Node */}
                <div className="rounded-md bg-surface-2 p-3.5 border border-hairline space-y-2">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span className="text-[11px] uppercase tracking-wider text-product-waypoint flex items-center gap-1.5">
                      <Workflow className="h-3.5 w-3.5" />
                      FSM Transition Engine
                    </span>
                    <span className="text-[10px] text-ink-subtle">LATENCY: 1.2ms</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-ink-muted">CREATED</span>
                    <span className="text-product-waypoint">&rarr;</span>
                    <span className="text-ink-muted">ASSIGNED</span>
                    <span className="text-product-waypoint">&rarr;</span>
                    <span className="text-product-waypoint font-bold">IN_TRANSIT</span>
                    <span className="text-product-waypoint">&rarr;</span>
                    <span className="text-product-nomad font-bold">DELIVERED</span>
                  </div>
                </div>

                {/* Rate Snapshot Node */}
                <div className="rounded-md bg-surface-2 p-3.5 border border-hairline space-y-2">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span className="text-[11px] uppercase tracking-wider text-product-terraform-bright flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5" />
                      Deterministic Rate Quoting
                    </span>
                    <span className="text-product-terraform-bright text-[10px]">LXV-5000</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-ink-subtle">VOLUMETRIC: </span>
                      <span className="text-ink font-semibold">1.50 kg</span>
                    </div>
                    <div>
                      <span className="text-ink-subtle">CHARGEABLE: </span>
                      <span className="text-ink font-semibold">2.00 kg</span>
                    </div>
                  </div>
                </div>

                {/* Security Vault Custody */}
                <div className="rounded-md bg-surface-2 p-3.5 border border-hairline flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-product-vault" />
                    <div>
                      <div className="text-[11px] font-semibold text-ink">Cryptographic Event Log</div>
                      <div className="text-[10px] text-ink-subtle">SHA-256 State Verification</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-product-vault font-semibold">
                    IMMUTABLE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SIGNATURE PRODUCT IDENTITY CARDS SECTION */}
      <section className="py-24 border-t border-hairline-soft bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-3">
            <div className="eyebrow-label">
              Integrated Product Ecosystem
            </div>
            <h2 className="text-3xl sm:text-display-md font-bold text-ink tracking-tight">
              Six Purpose-Engineered Modules. One Cohesive Fabric.
            </h2>
            <p className="text-body text-ink-muted max-w-2xl leading-relaxed">
              Every stage of the dispatch lifecycle is anchored by a dedicated product engine with unmistakable chromatic identity.
            </p>
          </div>

          {/* 3-Column Product Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. TERRAFORM CARD - Violet Ground */}
            <div className="rounded-lg bg-product-terraform p-6 text-white space-y-4 transition hover:brightness-105">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-white/80">
                  Rate Engine Module
                </div>
                <div className="h-2 w-2 rounded-full bg-white"></div>
              </div>
              <h3 className="text-card-title font-bold text-white tracking-tight">
                Deterministic Surcharging
              </h3>
              <p className="text-body-sm text-white/90 leading-relaxed">
                Computes volumetric and actual mass against zone slab matrices. Creates immutable rate snapshots to eliminate invoice drift and reconciliation disputes.
              </p>
              <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                <span>Volumetric Quotient: 5000</span>
                <Link href="/orders/new" className="inline-flex items-center gap-1 text-white hover:underline">
                  Explore Engine <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 2. VAULT CARD - Yellow Ground (Dark Text) */}
            <div className="rounded-lg bg-product-vault p-6 text-inverse-ink space-y-4 transition hover:brightness-105">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-inverse-ink/80">
                  Security & Audit
                </div>
                <div className="h-2 w-2 rounded-full bg-inverse-ink"></div>
              </div>
              <h3 className="text-card-title font-bold text-inverse-ink tracking-tight">
                Cryptographic Custody
              </h3>
              <p className="text-body-sm text-inverse-ink/90 leading-relaxed">
                Enforces strict Row-Level Security, multi-tenant workspace isolation, role clearance validation, and append-only attempt event histories.
              </p>
              <div className="pt-4 border-t border-inverse-ink/20 flex items-center justify-between text-xs font-semibold">
                <span>Zero-Trust RBAC Model</span>
                <Link href="/login" className="inline-flex items-center gap-1 text-inverse-ink hover:underline">
                  View Security <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. WAYPOINT CARD - Cyan Ground (Dark Text) */}
            <div className="rounded-lg bg-product-waypoint p-6 text-inverse-ink space-y-4 transition hover:brightness-105">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-inverse-ink/80">
                  Lifecycle Pipeline
                </div>
                <div className="h-2 w-2 rounded-full bg-inverse-ink"></div>
              </div>
              <h3 className="text-card-title font-bold text-inverse-ink tracking-tight">
                Finite State Machine
              </h3>
              <p className="text-body-sm text-inverse-ink/90 leading-relaxed">
                Deterministic lifecycle transitions guarantee that packages cannot bypass checkpoints or jump backwards. Sealed terminal delivered states are inviolable.
              </p>
              <div className="pt-4 border-t border-inverse-ink/20 flex items-center justify-between text-xs font-semibold">
                <span>Formal FSM Verification</span>
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-inverse-ink hover:underline">
                  Inspect States <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 4. NOMAD CARD - Charcoal Surface 1 with Nomad Green Identity */}
            <div className="card-surface-1 space-y-4 transition hover:border-product-nomad/50">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-product-nomad">
                  Fleet Orchestration
                </div>
                <div className="h-2 w-2 rounded-full bg-product-nomad"></div>
              </div>
              <h3 className="text-card-title font-bold text-ink tracking-tight">
                Autonomous Auto-Assignment
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Scores available drivers using active load balancing, geographic zone proximity, and vehicle capacity to achieve optimal sub-second dispatch assignment.
              </p>
              <div className="pt-4 border-t border-hairline-soft flex items-center justify-between text-xs font-semibold">
                <span className="text-ink-subtle">Load Factor Balancing</span>
                <Link href="/agent/dashboard" className="inline-flex items-center gap-1 text-product-nomad hover:underline">
                  Driver Portal <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 5. CONSUL CARD - Charcoal Surface 1 with Consul Red Identity */}
            <div className="card-surface-1 space-y-4 transition hover:border-product-consul/50">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-product-consul">
                  Event Mesh & Routing
                </div>
                <div className="h-2 w-2 rounded-full bg-product-consul"></div>
              </div>
              <h3 className="text-card-title font-bold text-ink tracking-tight">
                Idempotent Notifications
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Asynchronous event webhooks decoupled from transactional writes. Employs exponential backoff retry algorithms to guarantee delivery across noisy channels.
              </p>
              <div className="pt-4 border-t border-hairline-soft flex items-center justify-between text-xs font-semibold">
                <span className="text-ink-subtle">Exponential Backoff</span>
                <Link href="/admin/notifications" className="inline-flex items-center gap-1 text-product-consul hover:underline">
                  Notification Ops <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 6. VAGRANT CARD - Charcoal Surface 1 with Vagrant Blue Identity */}
            <div className="card-surface-1 space-y-4 transition hover:border-product-vagrant/50">
              <div className="flex items-center justify-between">
                <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-product-vagrant">
                  Developer Platform
                </div>
                <div className="h-2 w-2 rounded-full bg-product-vagrant"></div>
              </div>
              <h3 className="text-card-title font-bold text-ink tracking-tight">
                Developer Sandboxing
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Complete REST APIs, TypeScript type bindings, deterministic test seeds, and sandbox simulation environments for building high-throughput logistics integrations.
              </p>
              <div className="pt-4 border-t border-hairline-soft flex items-center justify-between text-xs font-semibold">
                <span className="text-ink-subtle">REST / TypeScript API</span>
                <Link href="/orders/new" className="inline-flex items-center gap-1 text-product-vagrant hover:underline">
                  API Docs <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE VOLUMETRIC SIMULATOR */}
      <section className="py-24 border-t border-hairline-soft bg-surface-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-3 text-center max-w-3xl mx-auto">
            <div className="eyebrow-label text-product-terraform-bright">
              Live Interactive Simulator
            </div>
            <h2 className="text-3xl sm:text-display-md font-bold text-ink tracking-tight">
              Test Volumetric Quotation in Real Time
            </h2>
            <p className="text-body text-ink-muted leading-relaxed">
              Experience the deterministic chargeable weight algorithm used across all LastMileX dispatch zones.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center bg-canvas p-6 sm:p-10 rounded-lg border border-hairline">
            {/* Input Parameters */}
            <div className="lg:col-span-7 space-y-6">
              <div className="text-sm font-semibold uppercase tracking-wider text-ink-subtle border-b border-hairline-soft pb-2">
                Package Dimension & Mass Inputs
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
                  <label className="block text-xs font-semibold text-ink-muted uppercase">Actual Scale Weight (kg)</label>
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
                      className="rounded-xs text-product-terraform focus:ring-product-terraform"
                    />
                    <span className="text-xs font-semibold text-ink">Cash-on-Delivery (COD)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="lg:col-span-5 bg-surface-1 p-6 rounded-lg border border-hairline space-y-4">
              <div className="flex items-center justify-between border-b border-hairline-soft pb-3">
                <span className="text-eyebrow font-semibold uppercase text-product-terraform-bright">
                  Settlement Breakdown
                </span>
                <span className="font-mono text-xs text-ink-muted">ZONE_LOCAL</span>
              </div>

              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between text-ink-muted">
                  <span>Volumetric Weight:</span>
                  <span className="text-ink">{volumetricWeight} kg</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Actual Scale Mass:</span>
                  <span className="text-ink">{calcActualWeight} kg</span>
                </div>
                <div className="flex justify-between text-product-waypoint font-bold pt-1 border-t border-hairline-soft">
                  <span>Chargeable Weight:</span>
                  <span>{chargeableWeight} kg</span>
                </div>
                <div className="flex justify-between text-ink-muted pt-2">
                  <span>Base Slab Charge:</span>
                  <span>₹{baseRate}.00</span>
                </div>
                {weightCharge > 0 && (
                  <div className="flex justify-between text-ink-muted">
                    <span>Incremental Surcharge:</span>
                    <span>₹{weightCharge}.00</span>
                  </div>
                )}
                {isCod && (
                  <div className="flex justify-between text-ink-muted">
                    <span>COD Handling Escrow:</span>
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

      {/* 4. ENTERPRISE PRICING & TIERS */}
      <section className="py-24 border-t border-hairline-soft bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-3 text-center max-w-3xl mx-auto">
            <div className="eyebrow-label">
              Predictable Tiering
            </div>
            <h2 className="text-3xl sm:text-display-md font-bold text-ink tracking-tight">
              Transparent Infrastructure Pricing
            </h2>
            <p className="text-body text-ink-muted leading-relaxed">
              No hidden fees. Pay per completed dispatch attempt with full cryptographic audit trails.
            </p>
          </div>

          {/* 3-Up Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Developer Tier */}
            <div className="card-surface-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">Developer</div>
                <div className="text-3xl font-bold text-ink">Free <span className="text-xs font-normal text-ink-subtle">/ sandbox</span></div>
                <p className="text-body-sm text-ink-muted leading-relaxed">
                  Ideal for logistics developers building integrations and testing rate cards in sandbox mode.
                </p>
                <ul className="space-y-2.5 pt-4 border-t border-hairline-soft text-caption text-ink-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>Up to 100 mock orders / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>Full REST & Rate APIs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>Deterministic FSM validation</span>
                  </li>
                </ul>
              </div>
              <Link href="/register" className="btn-secondary w-full text-center">
                Get Started Free
              </Link>
            </div>

            {/* Standard Fleet Tier - FEATURED (Surface-2 Lift) */}
            <div className="card-surface-2 flex flex-col justify-between space-y-6 relative border-product-terraform">
              <div className="absolute -top-3 right-6 bg-product-terraform text-white px-3 py-0.5 rounded-pill text-[11px] font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <div className="text-eyebrow font-semibold uppercase text-product-terraform-bright">Professional Fleet</div>
                <div className="text-3xl font-bold text-ink">₹2,499 <span className="text-xs font-normal text-ink-subtle">/ mo base</span></div>
                <p className="text-body-sm text-ink-muted leading-relaxed">
                  Designed for active delivery operations, regional couriers, and high-frequency dispatchers.
                </p>
                <ul className="space-y-2.5 pt-4 border-t border-hairline-soft text-caption text-ink-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>Unlimited order volume</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>Autonomous Driver Auto-Assignment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>Cash-on-Delivery Escrow Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>SMS / Email Retry Mesh</span>
                  </li>
                </ul>
              </div>
              <Link href="/register" className="btn-primary w-full text-center">
                Start 14-Day Trial
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="card-surface-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">Enterprise Multi-Region</div>
                <div className="text-3xl font-bold text-ink">Custom <span className="text-xs font-normal text-ink-subtle">/ SLA</span></div>
                <p className="text-body-sm text-ink-muted leading-relaxed">
                  Dedicated clusters, isolated database instances, custom slab matrices, and 99.99% dispatch uptime SLAs.
                </p>
                <ul className="space-y-2.5 pt-4 border-t border-hairline-soft text-caption text-ink-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>Dedicated Cluster Isolation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>Custom Rate Cards & Surcharges</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-product-nomad" />
                    <span>24/7 Dedicated Engineering Support</span>
                  </li>
                </ul>
              </div>
              <Link href="/login" className="btn-secondary w-full text-center">
                Contact Enterprise Sales
              </Link>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="pt-8 space-y-4">
            <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink">
              Feature Comparison Matrix
            </div>
            <div className="overflow-x-auto rounded-lg border border-hairline bg-surface-1">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-hairline bg-surface-2 text-caption font-semibold uppercase text-ink-muted">
                  <tr>
                    <th className="py-3.5 px-6">Capability</th>
                    <th className="py-3.5 px-6">Developer</th>
                    <th className="py-3.5 px-6">Professional Fleet</th>
                    <th className="py-3.5 px-6">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-mono text-caption">
                  <tr className="bg-canvas/40">
                    <td className="py-3 px-6 text-ink font-sans font-medium">Volumetric Surcharging</td>
                    <td className="py-3 px-6 text-ink-muted">Standard 5000</td>
                    <td className="py-3 px-6 text-product-nomad">Custom Divisors</td>
                    <td className="py-3 px-6 text-product-nomad">Zone-Specific Matrix</td>
                  </tr>
                  <tr className="bg-canvas/40">
                    <td className="py-3 px-6 text-ink font-sans font-medium">Auto-Assignment Algorithm</td>
                    <td className="py-3 px-6 text-ink-subtle">Manual Only</td>
                    <td className="py-3 px-6 text-product-nomad">Multi-Factor Scoring</td>
                    <td className="py-3 px-6 text-product-nomad">Custom Weight Modifiers</td>
                  </tr>
                  <tr className="bg-canvas/40">
                    <td className="py-3 px-6 text-ink font-sans font-medium">Cryptographic Audit Trails</td>
                    <td className="py-3 px-6 text-ink-muted">7 Days</td>
                    <td className="py-3 px-6 text-ink-muted">90 Days</td>
                    <td className="py-3 px-6 text-product-nomad">Indefinite Cold Storage</td>
                  </tr>
                  <tr className="bg-canvas/40">
                    <td className="py-3 px-6 text-ink font-sans font-medium">State Machine Invariants</td>
                    <td className="py-3 px-6 text-product-nomad">Enforced</td>
                    <td className="py-3 px-6 text-product-nomad">Enforced</td>
                    <td className="py-3 px-6 text-product-nomad">Enforced + Formal Model</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA BANNER */}
      <section className="py-24 border-t border-hairline-soft bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xxl bg-surface-1 border border-hairline p-8 sm:p-12 md:p-16 text-center space-y-6">
            <div className="eyebrow-label text-product-waypoint">
              Ready to Upgrade Your Dispatch Stack?
            </div>
            <h2 className="text-3xl sm:text-headline md:text-display-md font-bold text-ink max-w-3xl mx-auto tracking-tight">
              Start Dispatching with Mathematical Precision Today.
            </h2>
            <p className="text-body-lg text-ink-muted max-w-2xl mx-auto leading-relaxed">
              Join leading logistics networks running on LastMileX. Book your first shipment or explore the admin console in seconds.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="btn-primary text-sm px-6 py-3"
              >
                Create Free Account
              </Link>
              <Link
                href="/orders/new"
                className="btn-secondary text-sm px-6 py-3"
              >
                Launch Rate Calculator
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
