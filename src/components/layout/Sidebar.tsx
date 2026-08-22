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

  const linkClasses = (path: string) => {
    const active = isActive(path);
    return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      active
        ? "bg-blue-50 text-blue-700 font-semibold"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-blue-600"
    }`;
  };

  const navContent = (
    <div className="space-y-1">
      {/* CUSTOMER LINKS */}
      {user.role === UserRole.CUSTOMER && (
        <>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Customer Portal
          </div>
          <Link href="/dashboard" className={linkClasses("/dashboard")}>
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
          <Link href="/orders/new" className={linkClasses("/orders/new")}>
            <PackagePlus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Create Shipment</span>
          </Link>
          <Link href="/orders" className={linkClasses("/orders")}>
            <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>My Orders</span>
          </Link>
          <Link href="/notifications" className={linkClasses("/notifications")}>
            <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Notifications</span>
          </Link>
        </>
      )}

      {/* DELIVERY AGENT LINKS */}
      {user.role === UserRole.DELIVERY_AGENT && (
        <>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Agent Portal
          </div>
          <Link href="/agent/dashboard" className={linkClasses("/agent/dashboard")}>
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Agent Dashboard</span>
          </Link>
          <Link href="/agent/orders" className={linkClasses("/agent/orders")}>
            <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Assigned Deliveries</span>
          </Link>
        </>
      )}

      {/* ADMIN LINKS */}
      {user.role === UserRole.ADMIN && (
        <>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Operations Console
          </div>
          <Link href="/admin/dashboard" className={linkClasses("/admin/dashboard")}>
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Overview Dashboard</span>
          </Link>
          <Link href="/admin/orders" className={linkClasses("/admin/orders")}>
            <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Orders & Dispatch</span>
          </Link>
          <Link href="/admin/agents" className={linkClasses("/admin/agents")}>
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Delivery Agents</span>
          </Link>
          <Link href="/admin/notifications" className={linkClasses("/admin/notifications")}>
            <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Notifications & Retry</span>
          </Link>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        aria-label="Sidebar navigation"
        className="hidden md:flex w-64 border-r border-gray-200 bg-white flex-col min-h-[calc(100vh-4rem)] p-4 shrink-0"
      >
        {navContent}
        <div className="mt-auto pt-6 border-t border-gray-100 px-3">
          <div className="text-xs text-gray-400 font-medium">LastMileX Dispatch v0.1.0</div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Overlay */}
      {isMobileNavOpen && (
        <div
          role="presentation"
          className="md:hidden fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation drawer"
            className="w-64 max-w-[80vw] h-full bg-white p-4 shadow-xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-3 border-b border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Navigation</span>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  aria-label="Close navigation drawer"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {navContent}
            </div>

            <div className="pt-4 border-t border-gray-100 px-2 text-xs text-gray-400">
              LastMileX Dispatch v0.1.0
            </div>
          </div>
        </div>
      )}
    </>
  );
}
