"use client";

import React from "react";
import { RoleGuard } from "@/components/ui/RoleGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserRole } from "@/types/enums";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="flex w-full min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 bg-gray-50 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </RoleGuard>
  );
}
