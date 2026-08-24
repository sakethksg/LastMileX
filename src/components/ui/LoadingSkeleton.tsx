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
        className={`w-full space-y-3 p-4 bg-surface-1 rounded-lg border border-hairline animate-pulse ${className}`}
      >
        <div className="h-5 bg-surface-2 rounded-xs w-1/4" />
        <div className="h-4 bg-surface-2/60 rounded-xs w-full" />
        <div className="h-4 bg-surface-2/60 rounded-xs w-full" />
        <div className="h-4 bg-surface-2/60 rounded-xs w-3/4" />
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
        className={`rounded-lg border border-hairline bg-surface-1 p-6 animate-pulse space-y-4 ${className}`}
      >
        <div className="h-5 bg-surface-2 rounded-xs w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-surface-2/60 rounded-xs w-full" />
          <div className="h-4 bg-surface-2/60 rounded-xs w-5/6" />
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
      className={`flex flex-col items-center justify-center py-16 gap-3 text-ink-muted ${className}`}
    >
      <Loader2 className="h-7 w-7 animate-spin text-product-waypoint" aria-hidden="true" />
      <p className="text-sm font-medium text-ink-muted">{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );
}
