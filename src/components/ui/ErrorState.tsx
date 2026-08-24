import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Error Encountered",
  message,
  code,
  onRetry,
  className = "",
}: ErrorStateProps) {
  // Helpful context for specific HTTP/Business error codes
  const getContextHelp = (errorCode?: string) => {
    switch (errorCode) {
      case "UNAUTHORIZED":
        return "Your session may have expired. Please sign in again.";
      case "FORBIDDEN":
        return "You do not have administrative or role clearance to perform this action.";
      case "NOT_FOUND":
        return "The requested order or resource could not be found.";
      case "ORDER_STATE_CONFLICT":
      case "CONFLICT":
        return "This resource was updated by another concurrent dispatch event. Please refresh.";
      case "VALIDATION_ERROR":
        return "Please review your input data for accuracy and required fields.";
      default:
        return null;
    }
  };

  const help = getContextHelp(code);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-lg border border-rose-500/30 bg-surface-1 p-5 text-ink space-y-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-500/10 text-rose-400 shrink-0 border border-rose-500/20">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-ink">{title}</h4>
          <p className="text-xs text-ink-muted leading-relaxed">{message}</p>
          {help && <p className="text-[11px] text-amber-400 font-mono mt-1">{help}</p>}
        </div>
      </div>

      {onRetry && (
        <div className="flex justify-end pt-2 border-t border-hairline-soft">
          <button
            type="button"
            onClick={onRetry}
            className="btn-secondary !px-3 !py-1 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" aria-hidden="true" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
