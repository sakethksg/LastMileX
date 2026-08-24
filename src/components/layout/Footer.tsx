import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-hairline-soft bg-canvas text-ink-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1: Brand & Overview */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 text-ink font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-inverse-canvas text-inverse-ink font-mono font-bold text-sm">
                LX
              </div>
              <span className="tracking-tight text-ink">LastMileX</span>
            </Link>
            <p className="text-caption text-ink-muted max-w-sm leading-relaxed">
              Enterprise last-mile delivery and dispatch platform. Automated driver assignment, real-time rate settlement, and full lifecycle tracking.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-[12px] font-mono text-ink-subtle">
                Dispatch System: <span className="text-emerald-400 font-medium">Operational</span>
              </span>
            </div>
          </div>

          {/* Col 2: Core Platform */}
          <div className="space-y-3">
            <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink">
              Platform
            </div>
            <ul className="space-y-2 text-caption">
              <li>
                <Link href="/orders/new" className="hover:text-ink transition">
                  Rate Calculator
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-ink transition">
                  Customer Portal
                </Link>
              </li>
              <li>
                <Link href="/agent/dashboard" className="hover:text-ink transition">
                  Driver Portal
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-ink transition">
                  Operations Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Security & Compliance */}
          <div className="space-y-3">
            <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink">
              Security & Audit
            </div>
            <ul className="space-y-2 text-caption">
              <li>
                <Link href="/login" className="hover:text-ink transition">
                  Immutable Audit Log
                </Link>
              </li>
              <li>
                <span className="text-ink-subtle">COD Collection</span>
              </li>
              <li>
                <span className="text-ink-subtle">Role-Based Access</span>
              </li>
              <li>
                <span className="text-ink-subtle">Event Mesh Delivery</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Developers */}
          <div className="space-y-3">
            <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink">
              Developers
            </div>
            <ul className="space-y-2 text-caption">
              <li>
                <Link href="/orders/new" className="hover:text-ink transition">
                  Rate Engine Preview
                </Link>
              </li>
              <li>
                <span className="text-ink-subtle">TypeScript Client</span>
              </li>
              <li>
                <span className="text-ink-subtle">REST API v1</span>
              </li>
              <li>
                <span className="text-ink-subtle">Webhook Delivery</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-hairline-soft flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-ink-subtle">
          <div>
            &copy; {new Date().getFullYear()} LastMileX Inc. All rights reserved. Enterprise Logistics Infrastructure.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-ink-muted cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-ink-muted cursor-pointer transition">Terms of Service</span>
            <span className="hover:text-ink-muted cursor-pointer transition">System Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
