"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { useNav } from "@/context/nav-context";
import { UserRole } from "@/types/enums";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Bell,
  Truck,
  Users,
  ClipboardList,
  X,
  Layers,
} from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();
  const { isMobileNavOpen, setIsMobileNavOpen } = useNav();
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === "/dashboard" || path === "/agent/dashboard" || path === "/admin/dashboard") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const linkClasses = (path: string, accentColor: string = "border-product-waypoint") => {
    const active = isActive(path);
    return `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
      active
        ? `bg-surface-2 text-ink border-l-2 ${accentColor} font-semibold`
        : "text-ink-muted hover:bg-surface-2/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-blue"
    }`;
  };

  const navContent = (
    <div className="space-y-4">
      {/* CUSTOMER LINKS */}
      {user.role === UserRole.CUSTOMER && (
        <div className="space-y-1">
          <div className="px-3 pb-1 text-eyebrow font-semibold uppercase tracking-eyebrow text-ink-subtle">
            Customer Portal
          </div>
          <Link href="/dashboard" className={linkClasses("/dashboard", "border-product-waypoint")}>
            <LayoutDashboard className="h-4 w-4 shrink-0 text-product-waypoint" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
          <Link href="/orders/new" className={linkClasses("/orders/new", "border-product-terraform")}>
            <PackagePlus className="h-4 w-4 shrink-0 text-product-terraform" aria-hidden="true" />
            <span>Create Shipment</span>
          </Link>
          <Link href="/orders" className={linkClasses("/orders", "border-product-waypoint")}>
            <Package className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
            <span>My Orders</span>
          </Link>
          <Link href="/notifications" className={linkClasses("/notifications", "border-product-vault")}>
            <Bell className="h-4 w-4 shrink-0 text-product-vault" aria-hidden="true" />
            <span>Notifications</span>
          </Link>
        </div>
      )}

      {/* DELIVERY AGENT LINKS */}
      {user.role === UserRole.DELIVERY_AGENT && (
        <div className="space-y-1">
          <div className="px-3 pb-1 text-eyebrow font-semibold uppercase tracking-eyebrow text-ink-subtle">
            Driver Portal
          </div>
          <Link href="/agent/dashboard" className={linkClasses("/agent/dashboard", "border-product-vault")}>
            <LayoutDashboard className="h-4 w-4 shrink-0 text-product-vault" aria-hidden="true" />
            <span>Driver Dashboard</span>
          </Link>
          <Link href="/agent/orders" className={linkClasses("/agent/orders", "border-product-nomad")}>
            <Truck className="h-4 w-4 shrink-0 text-product-nomad" aria-hidden="true" />
            <span>Assigned Deliveries</span>
          </Link>
        </div>
      )}

      {/* ADMIN LINKS */}
      {user.role === UserRole.ADMIN && (
        <div className="space-y-1">
          <div className="px-3 pb-1 text-eyebrow font-semibold uppercase tracking-eyebrow text-ink-subtle">
            Operations Console
          </div>
          <Link href="/admin/dashboard" className={linkClasses("/admin/dashboard", "border-product-terraform")}>
            <LayoutDashboard className="h-4 w-4 shrink-0 text-product-terraform" aria-hidden="true" />
            <span>Overview Dashboard</span>
          </Link>
          <Link href="/admin/orders" className={linkClasses("/admin/orders", "border-product-consul")}>
            <ClipboardList className="h-4 w-4 shrink-0 text-product-consul" aria-hidden="true" />
            <span>Orders & Dispatch</span>
          </Link>
          <Link href="/admin/agents" className={linkClasses("/admin/agents", "border-product-nomad")}>
            <Users className="h-4 w-4 shrink-0 text-product-nomad" aria-hidden="true" />
            <span>Delivery Fleet</span>
          </Link>
          <Link href="/admin/notifications" className={linkClasses("/admin/notifications", "border-product-vault")}>
            <Bell className="h-4 w-4 shrink-0 text-product-vault" aria-hidden="true" />
            <span>Event Mesh & Retries</span>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        aria-label="Sidebar navigation"
        className="hidden md:flex w-64 border-r border-hairline-soft bg-surface-1 flex-col min-h-[calc(100vh-4rem)] p-4 shrink-0"
      >
        {navContent}
        <div className="mt-auto pt-6 border-t border-hairline-soft px-3">
          <div className="text-[11px] text-ink-subtle font-mono">LastMileX Core v0.1.0</div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Overlay */}
      {isMobileNavOpen && (
        <div
          role="presentation"
          className="md:hidden fixed inset-0 z-50 flex bg-black/70 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation drawer"
            className="w-64 max-w-[80vw] h-full bg-surface-1 border-r border-hairline p-4 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-hairline">
                <span className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink-subtle">Navigation</span>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  aria-label="Close navigation drawer"
                  className="rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {navContent}
            </div>

            <div className="pt-4 border-t border-hairline-soft px-2 text-[11px] text-ink-subtle font-mono">
              LastMileX Core v0.1.0
            </div>
          </div>
        </div>
      )}
    </>
  );
}
