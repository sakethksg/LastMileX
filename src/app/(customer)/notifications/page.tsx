"use client";

import React, { useEffect, useState } from "react";
import { fetchCustomerNotifications } from "@/lib/api/notifications";
import { NotificationStatusBadge } from "@/components/ui/StatusBadge";
import { Bell, Loader2, Calendar } from "lucide-react";

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotifs() {
      try {
        setLoading(true);
        const res = await fetchCustomerNotifications();
        setNotifications(res.items || res.notifications || (Array.isArray(res) ? res : []));
      } catch (err: any) {
        setError(err.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    }
    loadNotifs();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
        <p className="text-sm text-gray-500">Live updates regarding your orders and delivery dispatches</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p>{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-1.5 hover:border-blue-200 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">{notif.title}</span>
                <NotificationStatusBadge status={notif.status} />
              </div>
              <p className="text-xs text-gray-600">{notif.body}</p>
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
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
