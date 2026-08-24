import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  backHref,
  backLabel = "Back",
  actions,
  badge,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`space-y-2 border-b border-hairline-soft pb-5 ${className}`}>
      {backHref && (
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition focus-visible:outline-2 focus-visible:outline-accent-blue rounded-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {eyebrow && (
            <div className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink-subtle">
              {eyebrow}
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl font-sans">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
