"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { useNav } from "@/context/nav-context";
import { UserRole } from "@/types/enums";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Bell, Menu, X } from "lucide-react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isMobileNavOpen, toggleMobileNav } = useNav();
  const pathname = usePathname();

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
      case UserRole.DELIVERY_AGENT:
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case UserRole.CUSTOMER:
      default:
        return "bg-surface-2 text-ink-muted border-hairline-soft";
    }
  };

  const navLinks = user
    ? user.role === UserRole.ADMIN
      ? [
          { href: "/admin/dashboard", label: "Overview" },
          { href: "/admin/orders", label: "Orders" },
          { href: "/admin/agents", label: "Fleet" },
        ]
      : user.role === UserRole.DELIVERY_AGENT
        ? [
            { href: "/agent/dashboard", label: "Dashboard" },
            { href: "/agent/orders", label: "Deliveries" },
          ]
        : [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/orders", label: "Orders" },
            { href: "/orders/new", label: "New shipment" },
          ]
    : [
        { href: "/#capabilities", label: "Platform" },
        { href: "/orders/new", label: "Rate calculator" },
      ];

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    if (href === "/dashboard" || href === "/agent/dashboard" || href === "/admin/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-4 z-50 flex w-full justify-center px-4 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 rounded-full border border-hairline/80 bg-surface-1/80 px-3.5 sm:px-4 py-2 backdrop-blur-xl shadow-2xl transition-all duration-300 w-full max-w-4xl"
      >
        {/* Left: Brand Logo & Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <button
              type="button"
              onClick={toggleMobileNav}
              aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileNavOpen}
              className="md:hidden inline-flex items-center justify-center rounded-full p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-blue transition"
            >
              {isMobileNavOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-ink hover:opacity-90 transition focus-visible:outline-2 focus-visible:outline-accent-blue rounded-full px-2 py-1"
          >
            <span className="tracking-tight text-ink font-bold text-sm sm:text-base leading-none">
              LastMileX
            </span>
          </Link>
        </div>

        {/* Center: Nav Items Capsule */}
        <div className="hidden md:flex items-center gap-1 rounded-full bg-surface-2/60 p-1 border border-hairline-soft/60">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-surface-3 text-ink shadow-xs"
                    : "text-ink-muted hover:bg-surface-2/80 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Actions / Auth Capsule */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {user.role === UserRole.CUSTOMER && (
                <Link
                  href="/notifications"
                  aria-label="View notifications"
                  className="relative p-1.5 sm:p-2 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-full transition focus-visible:outline-2 focus-visible:outline-accent-blue"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}

              <div className="hidden sm:flex items-center gap-2 rounded-full bg-surface-2/60 py-1 pl-3 pr-1.5 border border-hairline-soft/60">
                <span className="text-xs font-medium text-ink truncate max-w-[120px]">
                  {user.name || user.email}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(user.role)}`}>
                  {user.role}
                </span>
              </div>

              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out of account"
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink border border-hairline hover:bg-surface-3 transition active:scale-[0.98]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-2 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center font-semibold text-inverse-ink bg-inverse-canvas rounded-full px-3.5 sm:px-4 py-1.5 text-xs transition hover:opacity-90 active:scale-[0.98] shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
