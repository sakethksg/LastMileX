import React from "react";
import Link from "next/link";
import { Terminal, Shield, Network, Cpu, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-hairline-soft bg-canvas text-ink-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1: Brand & Status */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 text-ink font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-inverse-canvas text-inverse-ink font-mono font-bold text-sm">
                X
              </div>
              <span className="tracking-tight text-ink">LastMileX</span>
            </Link>
            <p className="text-caption text-ink-muted max-w-sm leading-relaxed">
              Deterministic last-mile dispatch engine, volumetric rate settlement, and finite state machine infrastructure for mission-critical logistics.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-product-nomad opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-product-nomad"></span>
              </span>
              <span className="text-[12px] font-mono text-ink-subtle">
                Fleet Dispatch Mesh: <span className="text-product-nomad font-medium">Nominal (99.99%)</span>
              </span>
            </div>
          </div>

          {/* Col 2: Core Infrastructure */}
          <div className="space-y-3">
            <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink">
              Infrastructure
            </div>
            <ul className="space-y-2 text-caption">
              <li>
                <Link href="/orders/new" className="hover:text-ink transition flex items-center gap-1">
                  <span>Rate Quoting</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-product-terraform"></span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-ink transition flex items-center gap-1">
                  <span>Dispatch State Machine</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-product-waypoint"></span>
                </Link>
              </li>
              <li>
                <Link href="/agent/dashboard" className="hover:text-ink transition flex items-center gap-1">
                  <span>Fleet Driver Routing</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-product-nomad"></span>
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-ink transition flex items-center gap-1">
                  <span>Operations Console</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-product-consul"></span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Security & Protocols */}
          <div className="space-y-3">
            <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink">
              Security & Custody
            </div>
            <ul className="space-y-2 text-caption">
              <li>
                <Link href="/login" className="hover:text-ink transition flex items-center gap-1">
                  <span>Immutable Audit Log</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-product-vault"></span>
                </Link>
              </li>
              <li>
                <span className="text-ink-subtle">Cash-on-Delivery Escrow</span>
              </li>
              <li>
                <span className="text-ink-subtle">Row-Level Security</span>
              </li>
              <li>
                <span className="text-ink-subtle">Idempotent Webhooks</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & SDK */}
          <div className="space-y-3">
            <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink">
              Developers & APIs
            </div>
            <ul className="space-y-2 text-caption">
              <li>
                <Link href="/orders/new" className="hover:text-ink transition flex items-center gap-1">
                  <span>Rate Card Simulator</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-product-vagrant"></span>
                </Link>
              </li>
              <li>
                <span className="text-ink-subtle">TypeScript SDK</span>
              </li>
              <li>
                <span className="text-ink-subtle">REST API v1</span>
              </li>
              <li>
                <span className="text-ink-subtle">Webhook Subscriptions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-hairline-soft flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-ink-subtle">
          <div>
            &copy; {new Date().getFullYear()} LastMileX Inc. All rights reserved. Engineered with deterministic state semantics.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-ink-muted cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-ink-muted cursor-pointer transition">Security Whitepaper</span>
            <span className="hover:text-ink-muted cursor-pointer transition">Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
