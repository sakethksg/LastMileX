"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchAdminNotifications, retryNotification } from "@/lib/api/notifications";
import { NotificationStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Bell, RotateCcw, Loader2, CheckCircle2 } from "lucide-react";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadNotifs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminNotifications({
        status: statusFilter || undefined,
      });
      setNotifications(res.items || res.notifications || (Array.isArray(res) ? res : []));
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  const handleRetry = async (id: string) => {
    if (retryingId) return;
    setRetryingId(id);
    setError(null);
    setActionMessage(null);
    try {
      await retryNotification(id);
      setActionMessage(`Notification #${id.slice(0, 8)} queued for retry.`);
      await loadNotifs();
    } catch (err: any) {
      setError(err.message || "Failed to retry notification");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Logs & Retries"
        subtitle="Monitor event-driven dispatches and retry failed deliveries"
        actions={
          <div>
            <label htmlFor="admin-notification-status-filter" className="sr-only">Filter by Status</label>
            <select
              id="admin-notification-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-xs outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="FAILED">FAILED (Retryable)</option>
              <option value="PENDING">PENDING</option>
              <option value="SENT">SENT</option>
              <option value="RETRYING">RETRYING</option>
            </select>
          </div>
        }
      />

      {actionMessage && (
        <div role="status" className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <ErrorState
          title="Notification Error"
          message={error}
          onRetry={loadNotifs}
        />
      )}

      {loading ? (
        <LoadingSkeleton variant="table" message="Loading notification audit logs..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-7 w-7 text-gray-400" aria-hidden="true" />}
          title="No Notifications Found"
          description={
            statusFilter
              ? `No event notifications currently match the "${statusFilter}" status filter.`
              : "No event notifications recorded in the system log."
          }
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Event Type</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4">Recipient User</th>
                  <th scope="col" className="py-3.5 px-4">Title & Content</th>
                  <th scope="col" className="py-3.5 px-4">Attempts</th>
                  <th scope="col" className="py-3.5 px-4">Timestamp</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-gray-900">
                      {notif.eventType}
                    </td>
                    <td className="py-3.5 px-4">
                      <NotificationStatusBadge status={notif.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-700">
                      {notif.user?.name || notif.user?.email || notif.userId?.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 max-w-sm">
                      <div className="font-semibold text-gray-900">{notif.title}</div>
                      <div className="truncate text-gray-500">{notif.body}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                      {notif.retryCount || 0} / 3
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {notif.status === "FAILED" && (
                        <button
                          type="button"
                          onClick={() => handleRetry(notif.id)}
                          disabled={retryingId === notif.id}
                          aria-busy={retryingId === notif.id}
                          className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-red-600"
                        >
                          {retryingId === notif.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          ) : (
                            <RotateCcw className="h-3 w-3" aria-hidden="true" />
                          )}
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
