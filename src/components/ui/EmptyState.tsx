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
      className={`rounded-lg border border-hairline bg-surface-1 p-10 sm:p-12 text-center ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-surface-2 text-ink-muted border border-hairline-soft">
        {icon || <Package className="h-6 w-6 text-ink-muted" aria-hidden="true" />}
      </div>
      <h3 className="mt-4 text-card-title font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">{description}</p>

      {actionText && (actionHref || onAction) && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="btn-primary"
            >
              {actionText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="btn-primary"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
