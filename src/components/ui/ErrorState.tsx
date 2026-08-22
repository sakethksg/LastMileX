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
      className={`rounded-2xl border border-red-200 bg-red-50/80 p-6 text-red-900 shadow-xs space-y-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 shrink-0">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-bold text-red-900">{title}</h4>
          <p className="text-xs text-red-700 leading-relaxed">{message}</p>
          {help && <p className="text-[11px] text-red-600 font-medium italic mt-1">{help}</p>}
        </div>
      </div>

      {onRetry && (
        <div className="flex justify-end pt-2 border-t border-red-200/60">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 shadow-xs hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
