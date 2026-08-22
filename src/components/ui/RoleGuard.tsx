"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/types/enums";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg p-6 my-12 text-center bg-white rounded-xl border border-red-200 shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied (403)</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your role (<span className="font-semibold text-gray-800">{user.role}</span>) does not have permission to view this section.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              if (user.role === UserRole.CUSTOMER) router.push("/dashboard");
              else if (user.role === UserRole.DELIVERY_AGENT) router.push("/agent/dashboard");
              else if (user.role === UserRole.ADMIN) router.push("/admin/dashboard");
              else router.push("/");
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Go to Your Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
