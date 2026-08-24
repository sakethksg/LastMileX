"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import {
  fetchAgentOrderById,
  pickupOrder,
  startDelivery,
  outForDelivery,
  completeDelivery,
  failDelivery,
} from "@/lib/api/agents";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { OrderStatus } from "@/types/enums";
import { DeliveryFailureReason } from "@/schemas/delivery-execution.schema";
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Package,
  Navigation,
} from "lucide-react";

export default function AgentOrderExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Failure Modal
  const [isFailing, setIsFailing] = useState(false);
  const [failureReason, setFailureReason] = useState<DeliveryFailureReason>("CUSTOMER_UNAVAILABLE");
  const [failureNotes, setFailureNotes] = useState("");

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAgentOrderById(orderId);
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

  const executeAction = async (actionFn: () => Promise<any>) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      await actionFn();
      await loadOrder();
    } catch (err: any) {
      setError(err.message || "Action failed to execute");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportFailure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      await failDelivery(orderId, failureReason, failureNotes || undefined);
      setIsFailing(false);
      await loadOrder();
    } catch (err: any) {
      setError(err.message || "Failed to record delivery failure");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton message="Loading delivery execution details..." />;
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Route Execution"
          title="Delivery Execution"
          backHref="/agent/orders"
          backLabel="Back to Assigned Deliveries"
        />
        <ErrorState
          title="Could Not Load Order"
          message={error}
          onRetry={loadOrder}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Driver Execution"
        title={order.orderNumber}
        subtitle={`Current Attempt: #${order.currentAttempt || 1} of ${order.maxAttempts || 3}`}
        backHref="/agent/orders"
        backLabel="Back to Assigned Deliveries"
        badge={<OrderStatusBadge status={order.status} />}
      />

      {error && (
        <ErrorState
          title="Action Failed"
          message={error}
          code="ORDER_STATE_CONFLICT"
        />
      )}

      {/* STATE-DRIVEN EXECUTION ACTION BAR */}
      <section aria-label="Delivery actions" className="card-surface-1 !border-product-waypoint/40 space-y-4">
        <div className="flex items-center justify-between border-b border-hairline-soft pb-2">
          <h2 className="text-eyebrow font-semibold uppercase tracking-eyebrow text-product-waypoint">
            Lifecycle Transition Actions
          </h2>
          <span className="text-[11px] font-mono text-ink-subtle">FSM Active</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {order.status === OrderStatus.ASSIGNED && (
            <button
              type="button"
              onClick={() => executeAction(() => pickupOrder(orderId))}
              disabled={actionLoading}
              aria-busy={actionLoading}
              className="btn-product-waypoint"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Package className="h-4 w-4 mr-2" aria-hidden="true" />}
              Confirm Package Pickup
            </button>
          )}

          {order.status === OrderStatus.PICKED_UP && (
            <button
              type="button"
              onClick={() => executeAction(() => startDelivery(orderId))}
              disabled={actionLoading}
              aria-busy={actionLoading}
              className="btn-product-terraform"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Truck className="h-4 w-4 mr-2" aria-hidden="true" />}
              Start Transit / Hub Transfer
            </button>
          )}

          {order.status === OrderStatus.IN_TRANSIT && (
            <button
              type="button"
              onClick={() => executeAction(() => outForDelivery(orderId))}
              disabled={actionLoading}
              aria-busy={actionLoading}
              className="btn-product-vault"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Navigation className="h-4 w-4 mr-2" aria-hidden="true" />}
              Mark Out for Delivery
            </button>
          )}

          {order.status === OrderStatus.OUT_FOR_DELIVERY && (
            <>
              <button
                type="button"
                onClick={() => executeAction(() => completeDelivery(orderId))}
                disabled={actionLoading}
                aria-busy={actionLoading}
                className="btn-product-nomad"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />}
                Complete Delivery
              </button>

              <button
                type="button"
                onClick={() => setIsFailing(true)}
                disabled={actionLoading}
                className="btn-product-consul"
              >
                <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
                Report Delivery Failure
              </button>
            </>
          )}

          {order.status === OrderStatus.DELIVERED && (
            <div className="flex items-center gap-2 text-sm font-semibold text-product-nomad bg-product-nomad/10 border border-product-nomad/30 px-4 py-2 rounded-md">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              Delivery Successfully Completed
            </div>
          )}

          {order.status === OrderStatus.FAILED && (
            <div className="flex items-center gap-2 text-sm font-semibold text-product-consul bg-product-consul/10 border border-product-consul/30 px-4 py-2 rounded-md">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Delivery Attempt Marked as Failed
            </div>
          )}
        </div>
      </section>

      {/* Accessible Failure Modal */}
      <Modal
        isOpen={isFailing}
        onClose={() => setIsFailing(false)}
        title="Record Delivery Failure"
        description="Select the structured failure reason and provide operational notes for auditing."
      >
        <form onSubmit={handleReportFailure} className="space-y-4">
          <div>
            <label htmlFor="agent-failure-reason" className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Failure Reason
            </label>
            <select
              id="agent-failure-reason"
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value as DeliveryFailureReason)}
              className="input-surface mt-1 w-full text-sm"
            >
              <option value="CUSTOMER_UNAVAILABLE">Customer Unavailable</option>
              <option value="ADDRESS_NOT_FOUND">Address Not Found / Incorrect Address</option>
              <option value="CUSTOMER_REFUSED">Customer Refused Delivery</option>
              <option value="ACCESS_RESTRICTED">Access Restricted / Gate Locked</option>
              <option value="PACKAGE_DAMAGED">Package Damaged</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="agent-failure-notes" className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Additional Operational Notes
            </label>
            <textarea
              id="agent-failure-notes"
              rows={3}
              value={failureNotes}
              onChange={(e) => setFailureNotes(e.target.value)}
              placeholder="e.g., Gate locked, recipient unreachable after 3 call attempts..."
              className="input-surface mt-1 w-full text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-hairline-soft">
            <button
              type="button"
              onClick={() => setIsFailing(false)}
              className="btn-secondary !px-4 !py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              aria-busy={actionLoading}
              className="btn-product-consul !px-4 !py-2 text-xs"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" aria-hidden="true" /> : null}
              Confirm Failure
            </button>
          </div>
        </form>
      </Modal>

      {/* Package & Customer Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <section aria-label="Destination details" className="card-surface-1 space-y-4">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <MapPin className="h-5 w-5 text-product-waypoint" aria-hidden="true" />
            Destination & Location
          </h2>

          <div className="space-y-3 text-sm">
            <div className="bg-surface-2 p-3 rounded-md border border-hairline">
              <div className="text-eyebrow font-semibold uppercase text-ink-subtle">Drop Address</div>
              <div className="font-medium text-ink mt-0.5">{order.dropAddress}</div>
              <div className="text-xs text-ink-subtle font-mono mt-0.5">PIN Code: {order.dropPinCode}</div>
            </div>

            <div className="bg-surface-2 p-3 rounded-md border border-hairline">
              <div className="text-eyebrow font-semibold uppercase text-ink-subtle">Pickup Origin</div>
              <div className="font-medium text-ink mt-0.5">{order.pickupAddress}</div>
              <div className="text-xs text-ink-subtle font-mono mt-0.5">PIN Code: {order.pickupPinCode}</div>
            </div>
          </div>
        </section>

        <section aria-label="Package specifications" className="card-surface-1 space-y-4">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Package className="h-5 w-5 text-product-terraform-bright" aria-hidden="true" />
            Package & Payment Specs
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-hairline-soft">
              <span className="text-ink-muted font-sans">Payment Type</span>
              <span className="font-bold text-ink">{order.paymentType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-hairline-soft">
              <span className="text-ink-muted font-sans">Package Weight</span>
              <span className="font-bold text-product-waypoint">{order.actualWeight} kg</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-hairline-soft">
              <span className="text-ink-muted font-sans">Dimensions</span>
              <span className="font-bold text-ink">
                {order.packageLength} x {order.packageBreadth} x {order.packageHeight} cm
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
