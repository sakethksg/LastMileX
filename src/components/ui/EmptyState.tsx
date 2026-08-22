import React from "react";
import Link from "next/link";
import { Package } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={`rounded-2xl border border-gray-200 bg-white p-10 sm:p-12 text-center shadow-xs ${className}`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 border border-gray-100">
        {icon || <Package className="h-7 w-7 text-gray-400" aria-hidden="true" />}
      </div>
      <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>

      {actionText && (actionHref || onAction) && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
            >
              {actionText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
