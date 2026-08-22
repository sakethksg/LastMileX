"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { useNav } from "@/context/nav-context";
import { UserRole } from "@/types/enums";
import Link from "next/link";
import { Truck, LogOut, Bell, Menu, X } from "lucide-react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isMobileNavOpen, toggleMobileNav } = useNav();

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-purple-100 text-purple-800 border-purple-300";
      case UserRole.DELIVERY_AGENT:
        return "bg-amber-100 text-amber-800 border-amber-300";
      case UserRole.CUSTOMER:
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 shadow-xs">
      <div className="flex items-center gap-3">
        {user && (
          <button
            type="button"
            onClick={toggleMobileNav}
            aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileNavOpen}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
          >
            {isMobileNavOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        )}

        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-gray-900 text-lg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Truck className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="tracking-tight">LastMileX</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {user.role === UserRole.CUSTOMER && (
              <Link
                href="/notifications"
                aria-label="View notifications"
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition focus-visible:outline-2 focus-visible:outline-blue-600"
                title="Notifications"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}

            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{user.name || user.email}</div>
                <div className="flex justify-end mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadgeStyle(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out of account"
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
