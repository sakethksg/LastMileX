"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { fetchCustomerOrderById, rescheduleCustomerOrder } from "@/lib/api/orders";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { OrderStatus } from "@/types/enums";
import {
  Package,
  MapPin,
  Clock,
  User,
  RotateCcw,
  Loader2,
} from "lucide-react";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reschedule modal state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCustomerOrderById(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rescheduleLoading) return;
    setRescheduleLoading(true);
    setRescheduleError(null);

    try {
      await rescheduleCustomerOrder(orderId, rescheduleDate || undefined);
      setIsRescheduling(false);
      await loadOrder();
    } catch (err: any) {
      setRescheduleError(err.message || "Failed to reschedule order.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton message="Loading shipment tracking and details..." />;
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Shipment Details"
          backHref="/orders"
          backLabel="Back to Shipments"
        />
        <ErrorState
          title="Could Not Load Order"
          message={error || "Order details could not be retrieved."}
          onRetry={loadOrder}
        />
      </div>
    );
  }

  const activeAssignment = order.assignments?.find((a: any) => a.status === "ACTIVE");
  const assignedAgent = activeAssignment?.agent?.user || order.assignedAgent;
  const pricing = order.pricingSnapshot;
  const attempts = order.attempts || [];
  const trackingEvents = order.trackingEvents || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title={order.orderNumber}
        subtitle={`Booked on ${new Date(order.createdAt).toLocaleString()}`}
        backHref="/orders"
        backLabel="Back to My Orders"
        badge={<OrderStatusBadge status={order.status} />}
        actions={
          order.status === OrderStatus.FAILED && order.currentAttempt < (order.maxAttempts || 3) ? (
            <button
              type="button"
              onClick={() => setIsRescheduling(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-orange-600 transition"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reschedule Delivery (Attempt {order.currentAttempt}/{order.maxAttempts || 3})
            </button>
          ) : undefined
        }
      />

      {/* Accessible Reschedule Modal */}
      <Modal
        isOpen={isRescheduling}
        onClose={() => setIsRescheduling(false)}
        title="Reschedule Delivery"
        description={`Previous delivery attempt failed. You can reschedule for retry attempt #${order.currentAttempt + 1} of ${order.maxAttempts || 3}.`}
      >
        {rescheduleError && (
          <div className="mb-4">
            <ErrorState
              title="Reschedule Failed"
              message={rescheduleError}
              code="ORDER_STATE_CONFLICT"
              className="p-3"
            />
          </div>
        )}

        <form onSubmit={handleReschedule} className="space-y-4">
          <div>
            <label htmlFor="customer-reschedule-date" className="block text-xs font-semibold text-gray-700">
              Preferred Retry Date (Optional)
            </label>
            <input
              id="customer-reschedule-date"
              type="date"
              value={rescheduleDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsRescheduling(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rescheduleLoading}
              aria-busy={rescheduleLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-orange-600"
            >
              {rescheduleLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
              {rescheduleLoading ? "Rescheduling..." : "Confirm Reschedule"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Grid: Delivery Info & Pricing */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Addresses & Driver */}
        <div className="md:col-span-2 space-y-6">
          <section aria-label="Routing and dispatch" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" aria-hidden="true" />
              Routing Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pickup Location</div>
                <div className="mt-1 text-gray-900 font-medium">{order.pickupAddress}</div>
                <div className="text-xs text-gray-500 mt-1">PIN: {order.pickupPinCode}</div>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Drop Location</div>
                <div className="mt-1 text-gray-900 font-medium">{order.dropAddress}</div>
                <div className="text-xs text-gray-500 mt-1">PIN: {order.dropPinCode}</div>
              </div>
            </div>

            {assignedAgent && (
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Assigned Delivery Agent</div>
                  <div className="font-bold text-gray-900 text-sm">{assignedAgent.name || assignedAgent.email}</div>
                  {assignedAgent.phone && <div className="text-xs text-gray-600">{assignedAgent.phone}</div>}
                </div>
              </div>
            )}
          </section>

          {/* Tracking History Timeline */}
          <section aria-label="Tracking history" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" aria-hidden="true" />
              Tracking Timeline
            </h2>

            {trackingEvents.length === 0 ? (
              <p className="text-xs text-gray-500">No tracking events recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                {trackingEvents.map((event: any) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-xs" aria-hidden="true" />
                    <div className="text-xs font-bold text-gray-900">
                      {event.newStatus.replace(/_/g, " ")}
                    </div>
                    {event.note && <div className="text-xs text-gray-600 mt-0.5">{event.note}</div>}
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Pricing Snapshot */}
        <div className="space-y-6">
          <section aria-label="Pricing breakdown" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" aria-hidden="true" />
              Pricing Snapshot
            </h2>

            {pricing ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Rate Card</span>
                  <span className="font-semibold text-gray-900">{pricing.rateCardName}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Customer Type</span>
                  <span className="font-semibold text-gray-900">{pricing.customerType}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Chargeable Wt</span>
                  <span className="font-semibold text-gray-900">{Number(pricing.chargeableWeight)} kg</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Base Charge</span>
                  <span>₹{Number(pricing.baseCharge).toFixed(2)}</span>
                </div>
                {Number(pricing.codSurchargeAmount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>COD Surcharge</span>
                    <span>₹{Number(pricing.codSurchargeAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900">
                  <span>Total Charge</span>
                  <span className="text-blue-600">₹{Number(pricing.totalCharge).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Pricing snapshot unavailable.</p>
            )}
          </section>

          {/* Delivery Attempt History */}
          {attempts.length > 0 && (
            <section aria-label="Delivery attempts" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Delivery Attempts ({attempts.length}/{order.maxAttempts || 3})</h2>
              <div className="space-y-2">
                {attempts.map((att: any) => (
                  <div key={att.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>Attempt #{att.attemptNumber}</span>
                      <span className={att.status === "DELIVERED" ? "text-emerald-600" : att.status === "FAILED" ? "text-red-600" : "text-amber-600"}>
                        {att.status}
                      </span>
                    </div>
                    {att.failureReason && (
                      <div className="text-red-600 text-[11px]">
                        Reason: {att.failureReason.replace(/_/g, " ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
