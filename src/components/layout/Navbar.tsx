"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { useNav } from "@/context/nav-context";
import { UserRole } from "@/types/enums";
import Link from "next/link";
import { Truck, LogOut, Bell, Menu, X, Shield, User, Compass } from "lucide-react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isMobileNavOpen, toggleMobileNav } = useNav();

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-product-terraform/20 text-product-terraform-bright border-product-terraform/40";
      case UserRole.DELIVERY_AGENT:
        return "bg-product-vault/20 text-product-vault border-product-vault/40";
      case UserRole.CUSTOMER:
      default:
        return "bg-product-waypoint/20 text-product-waypoint border-product-waypoint/40";
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-hairline-soft bg-canvas px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {user && (
          <button
            type="button"
            onClick={toggleMobileNav}
            aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileNavOpen}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-blue transition"
          >
            {isMobileNavOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        )}

        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-ink text-lg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent-blue rounded-md"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-inverse-canvas text-inverse-ink font-bold text-sm tracking-tighter">
            <span className="font-mono text-base">LX</span>
          </div>
          <div className="flex flex-col">
            <span className="tracking-tight text-ink font-bold text-base leading-none">LastMileX</span>
            <span className="text-[10px] text-ink-subtle font-mono uppercase tracking-wider leading-none mt-1">
              Dispatch Infra
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            {user.role === UserRole.CUSTOMER && (
              <Link
                href="/notifications"
                aria-label="View notifications"
                className="relative p-2 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-md transition focus-visible:outline-2 focus-visible:outline-accent-blue"
                title="Notifications"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}

            <div className="flex items-center gap-3 border-l border-hairline pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-ink truncate max-w-[160px]">
                  {user.name || user.email}
                </div>
                <div className="flex justify-end mt-0.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold border ${getRoleBadgeStyle(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out of account"
                className="btn-secondary !px-3 !py-1.5 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="btn-secondary !py-2 !px-3.5 text-xs"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-primary !py-2 !px-3.5 text-xs"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
