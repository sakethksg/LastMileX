import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSkeletonProps {
  message?: string;
  className?: string;
  variant?: "spinner" | "table" | "card";
}

export function LoadingSkeleton({
  message = "Loading dispatch data...",
  className = "",
  variant = "spinner",
}: LoadingSkeletonProps) {
  if (variant === "table") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={message}
        className={`w-full space-y-3 p-4 bg-white rounded-2xl border border-gray-200 animate-pulse ${className}`}
      >
        <div className="h-6 bg-gray-200 rounded-md w-1/4" />
        <div className="h-4 bg-gray-100 rounded-md w-full" />
        <div className="h-4 bg-gray-100 rounded-md w-full" />
        <div className="h-4 bg-gray-100 rounded-md w-3/4" />
        <span className="sr-only">{message}</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={message}
        className={`rounded-2xl border border-gray-200 bg-white p-6 animate-pulse space-y-4 ${className}`}
      >
        <div className="h-5 bg-gray-200 rounded-md w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>
        <span className="sr-only">{message}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={message}
      className={`flex flex-col items-center justify-center py-16 gap-3 text-gray-500 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-600">{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );
}
