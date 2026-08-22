"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
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
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();
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
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;
  };

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col min-h-[calc(100vh-4rem)] p-4 shrink-0">
      <div className="space-y-1">
        {/* CUSTOMER LINKS */}
        {user.role === UserRole.CUSTOMER && (
          <>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Customer Portal
            </div>
            <Link href="/dashboard" className={linkClasses("/dashboard")}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/orders/new" className={linkClasses("/orders/new")}>
              <PackagePlus className="h-4 w-4" />
              Create Shipment
            </Link>
            <Link href="/orders" className={linkClasses("/orders")}>
              <Package className="h-4 w-4" />
              My Orders
            </Link>
            <Link href="/notifications" className={linkClasses("/notifications")}>
              <Bell className="h-4 w-4" />
              Notifications
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
              <LayoutDashboard className="h-4 w-4" />
              Agent Dashboard
            </Link>
            <Link href="/agent/orders" className={linkClasses("/agent/orders")}>
              <Truck className="h-4 w-4" />
              Assigned Deliveries
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
              <LayoutDashboard className="h-4 w-4" />
              Overview Dashboard
            </Link>
            <Link href="/admin/orders" className={linkClasses("/admin/orders")}>
              <ClipboardList className="h-4 w-4" />
              Orders & Assignment
            </Link>
            <Link href="/admin/agents" className={linkClasses("/admin/agents")}>
              <Users className="h-4 w-4" />
              Delivery Agents
            </Link>
            <Link href="/admin/notifications" className={linkClasses("/admin/notifications")}>
              <Bell className="h-4 w-4" />
              Notifications & Retry
            </Link>
          </>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100 px-3">
        <div className="text-xs text-gray-400">
          LastMileX Dispatch v0.1.0
        </div>
      </div>
    </aside>
  );
}
