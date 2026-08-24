"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchCustomerNotifications } from "@/lib/api/notifications";
import { NotificationStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Bell } from "lucide-react";

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCustomerNotifications();
      setNotifications(res.items || res.notifications || (Array.isArray(res) ? res : []));
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Event Stream"
        title="Notifications"
        subtitle="Live dispatch updates regarding your orders and delivery statuses"
      />

      {loading ? (
        <LoadingSkeleton message="Loading event stream..." />
      ) : error ? (
        <ErrorState
          title="Could Not Load Notifications"
          message={error}
          onRetry={loadNotifs}
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6 text-ink-muted" aria-hidden="true" />}
          title="All Caught Up"
          description="You have no notifications at this time."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="card-surface-1 !p-4 space-y-1.5 transition hover:border-product-waypoint/40"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-sm text-ink">{notif.title}</span>
                <NotificationStatusBadge status={notif.status} />
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">{notif.body}</p>
              <div className="flex items-center justify-between text-[11px] font-mono text-ink-subtle pt-2 border-t border-hairline-soft">
                <span>Event: {notif.eventType?.replace(/_/g, " ")}</span>
                <span>{new Date(notif.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
