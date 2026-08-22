import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  actions,
  badge,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`space-y-2 border-b border-gray-200/80 pb-5 ${className}`}>
      {backHref && (
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && <p className="text-sm text-gray-500 max-w-2xl">{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
