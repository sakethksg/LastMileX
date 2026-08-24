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
        eyebrow="Event Mesh & Notifications"
        title="Notification Logs & Retries"
        subtitle="Monitor event-driven dispatches and retry failed deliveries"
        actions={
          <div>
            <label htmlFor="admin-notification-status-filter" className="sr-only">Filter by Status</label>
            <select
              id="admin-notification-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-surface !py-2 text-xs"
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
        <div role="status" className="rounded-md bg-product-nomad/10 border border-product-nomad/30 p-3 text-xs font-mono font-semibold text-product-nomad flex items-center gap-2">
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
          icon={<Bell className="h-6 w-6 text-ink-muted" aria-hidden="true" />}
          title="No Notifications Found"
          description={
            statusFilter
              ? `No event notifications currently match the "${statusFilter}" status filter.`
              : "No event notifications recorded in the system log."
          }
        />
      ) : (
        <div className="card-surface-1 overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-hairline bg-surface-2 text-caption font-semibold uppercase text-ink-muted">
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
              <tbody className="divide-y divide-hairline-soft">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-surface-2/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-ink">
                      {notif.eventType}
                    </td>
                    <td className="py-3.5 px-4">
                      <NotificationStatusBadge status={notif.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-muted">
                      {notif.user?.name || notif.user?.email || notif.userId?.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-muted max-w-sm">
                      <div className="font-semibold text-ink">{notif.title}</div>
                      <div className="truncate text-ink-subtle">{notif.body}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-ink-muted">
                      {notif.retryCount || 0} / 3
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-ink-subtle">
                      {new Date(notif.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {notif.status === "FAILED" && (
                        <button
                          type="button"
                          onClick={() => handleRetry(notif.id)}
                          disabled={retryingId === notif.id}
                          aria-busy={retryingId === notif.id}
                          className="btn-product-consul !px-2.5 !py-1 text-xs"
                        >
                          {retryingId === notif.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" aria-hidden="true" />
                          ) : (
                            <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
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
