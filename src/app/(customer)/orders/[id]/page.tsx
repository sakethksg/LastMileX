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
  ShieldCheck,
  Workflow,
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
    return <LoadingSkeleton message="Loading shipment telemetry and details..." />;
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Order Telemetry"
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
        eyebrow="Shipment Dispatch Node"
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
              className="btn-secondary !border-amber-200/50 !text-amber-200"
            >
              <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
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
            <label htmlFor="customer-reschedule-date" className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Preferred Retry Date (Optional)
            </label>
            <input
              id="customer-reschedule-date"
              type="date"
              value={rescheduleDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="input-surface mt-1 w-full text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-hairline-soft">
            <button
              type="button"
              onClick={() => setIsRescheduling(false)}
              className="btn-secondary !px-4 !py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rescheduleLoading}
              aria-busy={rescheduleLoading}
              className="btn-primary !px-4 !py-2 text-xs"
            >
              {rescheduleLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" aria-hidden="true" /> : null}
              {rescheduleLoading ? "Rescheduling..." : "Confirm Reschedule"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Grid: Delivery Info & Pricing */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Addresses & Driver */}
        <div className="md:col-span-2 space-y-6">
          <section aria-label="Routing and dispatch" className="card-surface-1 space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <MapPin className="h-5 w-5 text-product-waypoint" aria-hidden="true" />
              Routing Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-surface-2 p-3.5 rounded-md border border-hairline">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">Pickup Location</div>
                <div className="mt-1 text-ink font-medium">{order.pickupAddress}</div>
                <div className="text-xs text-ink-subtle font-mono mt-1">PIN: {order.pickupPinCode}</div>
              </div>

              <div className="bg-surface-2 p-3.5 rounded-md border border-hairline">
                <div className="text-eyebrow font-semibold uppercase text-ink-subtle">Drop Location</div>
                <div className="mt-1 text-ink font-medium">{order.dropAddress}</div>
                <div className="text-xs text-ink-subtle font-mono mt-1">PIN: {order.dropPinCode}</div>
              </div>
            </div>

            {assignedAgent && (
              <div className="mt-4 flex items-center gap-3 border-t border-hairline-soft pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-2 border border-hairline text-product-vault">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-eyebrow font-semibold uppercase text-ink-subtle">Assigned Delivery Driver</div>
                  <div className="font-bold text-ink text-sm">{assignedAgent.name || assignedAgent.email}</div>
                  {assignedAgent.phone && <div className="text-xs font-mono text-ink-muted">{assignedAgent.phone}</div>}
                </div>
              </div>
            )}
          </section>

          {/* Tracking History Timeline */}
          <section aria-label="Tracking history" className="card-surface-1 space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Clock className="h-5 w-5 text-product-waypoint" aria-hidden="true" />
              Tracking Timeline
            </h2>

            {trackingEvents.length === 0 ? (
              <p className="text-xs text-ink-subtle font-mono">No tracking events recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline">
                {trackingEvents.map((event: any) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-surface-1 bg-product-waypoint shadow-xs" aria-hidden="true" />
                    <div className="text-xs font-mono font-bold text-ink">
                      {event.newStatus.replace(/_/g, " ")}
                    </div>
                    {event.note && <div className="text-xs text-ink-muted mt-0.5">{event.note}</div>}
                    <div className="text-[11px] font-mono text-ink-subtle mt-0.5">
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
          <section aria-label="Pricing breakdown" className="card-surface-1 space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Package className="h-5 w-5 text-product-terraform-bright" aria-hidden="true" />
              Pricing Snapshot
            </h2>

            {pricing ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-ink-muted">
                  <span>Rate Card</span>
                  <span className="font-semibold text-ink">{pricing.rateCardName}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Customer Type</span>
                  <span className="font-semibold text-ink">{pricing.customerType}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Chargeable Wt</span>
                  <span className="font-semibold text-product-waypoint">{Number(pricing.chargeableWeight)} kg</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Base Charge</span>
                  <span>₹{Number(pricing.baseCharge).toFixed(2)}</span>
                </div>
                {Number(pricing.codSurchargeAmount) > 0 && (
                  <div className="flex justify-between text-ink-muted">
                    <span>COD Surcharge</span>
                    <span>₹{Number(pricing.codSurchargeAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-hairline pt-2 text-sm font-bold text-ink">
                  <span>Total Charge</span>
                  <span className="text-product-terraform-bright">₹{Number(pricing.totalCharge).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-subtle font-mono">Pricing snapshot unavailable.</p>
            )}
          </section>

          {/* Delivery Attempt History */}
          {attempts.length > 0 && (
            <section aria-label="Delivery attempts" className="card-surface-1 space-y-3">
              <h2 className="text-sm font-bold text-ink">Delivery Attempts ({attempts.length}/{order.maxAttempts || 3})</h2>
              <div className="space-y-2">
                {attempts.map((att: any) => (
                  <div key={att.id} className="rounded-md border border-hairline bg-surface-2 p-2.5 text-xs font-mono space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-ink">Attempt #{att.attemptNumber}</span>
                      <span className={att.status === "DELIVERED" ? "text-product-nomad" : att.status === "FAILED" ? "text-product-consul" : "text-product-vault"}>
                        {att.status}
                      </span>
                    </div>
                    {att.failureReason && (
                      <div className="text-product-consul text-[11px]">
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
