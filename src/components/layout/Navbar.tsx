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
        return "bg-white/5 text-zinc-400 border-white/10";
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
        { href: "/#capabilities", label: "Features" },
        { href: "/orders/new", label: "Calculator" },
        { href: "/#capabilities", label: "About" },
      ];

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    if (href === "/dashboard" || href === "/agent/dashboard" || href === "/admin/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-4 sm:top-5 z-50 flex w-full justify-center px-4 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto flex items-center justify-between w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0B0B0E]/75 px-5 sm:px-6 py-3 backdrop-blur-xl shadow-2xl shadow-black/60 transition-all duration-300"
      >
        {/* Left: Brand Logo & Mobile Trigger */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              type="button"
              onClick={toggleMobileNav}
              aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileNavOpen}
              className="md:hidden inline-flex items-center justify-center rounded-xl p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
            >
              {isMobileNavOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}

          <Link
            href="/"
            className="flex items-center gap-2.5 text-white hover:opacity-90 transition rounded-xl py-0.5"
          >
            {/* Minimalist Logo Icon */}
            <div className="flex items-center justify-center w-6 h-6 text-white">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="2.5" />
                <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(30 12 12)" />
                <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-30 12 12)" />
              </svg>
            </div>
            <span className="font-semibold text-base tracking-tight text-white leading-none">
              LastMileX
            </span>
          </Link>
        </div>

        {/* Right: Nav Items & Action Button */}
        <div className="flex items-center gap-5 sm:gap-7">
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Action / Auth Buttons */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {user.role === UserRole.CUSTOMER && (
                <Link
                  href="/notifications"
                  aria-label="View notifications"
                  className="relative p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}

              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white/5 py-1 pl-3 pr-1.5 border border-white/10">
                <span className="text-xs font-medium text-white truncate max-w-[120px]">
                  {user.name || user.email}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getRoleBadgeStyle(user.role)}`}>
                  {user.role}
                </span>
              </div>

              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out of account"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white border border-white/10 hover:bg-white/15 transition active:scale-[0.98]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/register"
                className="text-sm font-medium text-zinc-400 hover:text-white transition"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center font-semibold text-black bg-white rounded-xl px-4 sm:px-5 py-1.5 text-sm transition hover:bg-zinc-200 active:scale-[0.98] shadow-sm"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
