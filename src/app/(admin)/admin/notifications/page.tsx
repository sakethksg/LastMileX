"use client";

import React, { useEffect, useState } from "react";
import { fetchAdminNotifications, retryNotification } from "@/lib/api/notifications";
import { NotificationStatusBadge } from "@/components/ui/StatusBadge";
import { Bell, RotateCcw, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadNotifs = React.useCallback(async () => {
    try {
      setLoading(true);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notification Logs & Retries</h1>
          <p className="text-sm text-gray-500">Monitor event-driven dispatches and retry failed deliveries</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-xs outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="FAILED">FAILED (Retryable)</option>
            <option value="PENDING">PENDING</option>
            <option value="SENT">SENT</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="RETRYING">RETRYING</option>
          </select>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">No notifications found</h3>
          <p className="mt-1 text-sm text-gray-500">No event notifications match the selected status filter.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3.5 px-4">Event Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Recipient User</th>
                  <th className="py-3.5 px-4">Title & Content</th>
                  <th className="py-3.5 px-4">Attempts</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
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
                          onClick={() => handleRetry(notif.id)}
                          disabled={retryingId === notif.id}
                          className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {retryingId === notif.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
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
