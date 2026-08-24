"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import {
  fetchAdminOrderById,
  assignOrderToAgent,
  autoAssignOrder,
  rescheduleAdminOrder,
} from "@/lib/api/orders";
import { fetchAdminAgents } from "@/lib/api/agents";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { OrderStatus } from "@/types/enums";
import {
  UserCheck,
  Zap,
  RotateCcw,
  Loader2,
  MapPin,
  Package,
  User,
  Clock,
} from "lucide-react";

export default function AdminOrderInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<any | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual assign modal
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  // Reschedule modal
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const loadOrderAndAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [orderData, agentsData] = await Promise.all([
        fetchAdminOrderById(orderId),
        fetchAdminAgents({ availability: "AVAILABLE" }).catch(() => ({ items: [] })),
      ]);
      setOrder(orderData);
      setAgents(agentsData.items || agentsData.agents || (Array.isArray(agentsData) ? agentsData : []));
    } catch (err: any) {
      setError(err.message || "Failed to load order inspection");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderAndAgents();
  }, [loadOrderAndAgents]);

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      await assignOrderToAgent(orderId, selectedAgentId);
      setIsAssigning(false);
      await loadOrderAndAgents();
    } catch (err: any) {
      setError(err.message || "Manual assignment failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      await autoAssignOrder(orderId);
      await loadOrderAndAgents();
    } catch (err: any) {
      setError(err.message || "Auto-assignment failed. No eligible available agents in zone.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      await rescheduleAdminOrder(orderId, rescheduleDate || undefined);
      setIsRescheduling(false);
      await loadOrderAndAgents();
    } catch (err: any) {
      setError(err.message || "Reschedule failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton message="Loading order inspection and driver availability..." />;
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Dispatch Ops"
          title="Order Inspection"
          backHref="/admin/orders"
          backLabel="Back to Orders"
        />
        <ErrorState
          title="Could Not Load Order"
          message={error}
          onRetry={loadOrderAndAgents}
        />
      </div>
    );
  }

  const isAssignable =
    order.status === OrderStatus.CONFIRMED ||
    order.status === OrderStatus.RESCHEDULED ||
    order.status === OrderStatus.ASSIGNED;

  const activeAssignment = order.assignments?.find((a: any) => a.status === "ACTIVE");
  const assignedAgent = activeAssignment?.agent?.user || order.assignedAgent;
  const pricing = order.pricingSnapshot;
  const trackingEvents = order.trackingEvents || [];
  const attempts = order.attempts || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Operations Inspection"
        title={order.orderNumber}
        subtitle={`Customer: ${order.customer?.name || order.customer?.email} | Attempt #${order.currentAttempt || 1}`}
        backHref="/admin/orders"
        backLabel="Back to Orders"
        badge={<OrderStatusBadge status={order.status} />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {isAssignable && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAssigning(true)}
                  disabled={actionLoading}
                  className="btn-secondary text-xs !py-2"
                >
                  <UserCheck className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Manual Assign
                </button>
                <button
                  type="button"
                  onClick={handleAutoAssign}
                  disabled={actionLoading}
                  aria-busy={actionLoading}
                  className="btn-primary text-xs !py-2"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden="true" /> : <Zap className="h-4 w-4 mr-1.5" aria-hidden="true" />}
                  Auto-Assign Driver
                </button>
              </>
            )}

            {order.status === OrderStatus.FAILED && order.currentAttempt < (order.maxAttempts || 3) && (
              <button
                type="button"
                onClick={() => setIsRescheduling(true)}
                className="btn-secondary !border-amber-500/50 !text-amber-400 text-xs !py-2"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Reschedule Order
              </button>
            )}
          </div>
        }
      />

      {error && (
        <ErrorState
          title="Dispatch Action Failed"
          message={error}
          code="ORDER_STATE_CONFLICT"
        />
      )}

      {/* Accessible Manual Assignment Modal */}
      <Modal
        isOpen={isAssigning}
        onClose={() => setIsAssigning(false)}
        title="Manual Driver Assignment"
        description="Select an available delivery agent to assign this shipment to."
      >
        <form onSubmit={handleManualAssign} className="space-y-4">
          <div>
            <label htmlFor="admin-select-agent" className="block text-xs font-semibold uppercase text-ink-muted">
              Available Driver
            </label>
            <select
              id="admin-select-agent"
              required
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="input-surface mt-1 w-full text-sm"
            >
              <option value="">-- Choose an Available Agent --</option>
              {agents.map((agent: any) => (
                <option key={agent.id} value={agent.userId || agent.user?.id}>
                  {agent.user?.name || agent.user?.email} ({agent.vehicleType || "BIKE"} - {agent.activeDeliveryCount || 0}/{agent.maxConcurrentOrders} active)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-hairline-soft">
            <button
              type="button"
              onClick={() => setIsAssigning(false)}
              className="btn-secondary !px-4 !py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !selectedAgentId}
              aria-busy={actionLoading}
              className="btn-primary !px-4 !py-2 text-xs"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" aria-hidden="true" /> : null}
              Assign Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Accessible Reschedule Modal */}
      <Modal
        isOpen={isRescheduling}
        onClose={() => setIsRescheduling(false)}
        title="Admin Reschedule Order"
        description={`Reschedule this failed order for attempt #${order.currentAttempt + 1} of ${order.maxAttempts || 3}.`}
      >
        <form onSubmit={handleReschedule} className="space-y-4">
          <div>
            <label htmlFor="admin-reschedule-date" className="block text-xs font-semibold uppercase text-ink-muted">
              Scheduled Date (Optional)
            </label>
            <input
              id="admin-reschedule-date"
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
              disabled={actionLoading}
              aria-busy={actionLoading}
              className="btn-primary !px-4 !py-2 text-xs"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" aria-hidden="true" /> : null}
              Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Info Grids */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section aria-label="Routing and assignment" className="card-surface-1 space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <MapPin className="h-5 w-5 text-sky-400" aria-hidden="true" />
              Routing & Driver Assignment
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

            {assignedAgent ? (
              <div className="mt-4 flex items-center gap-3 border-t border-hairline-soft pt-4 bg-surface-2 p-3 rounded-md border border-hairline">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-3 text-indigo-400 font-bold">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-eyebrow font-semibold uppercase text-indigo-400">Currently Assigned Driver</div>
                  <div className="font-bold text-ink text-sm">{assignedAgent.name || assignedAgent.email}</div>
                  {assignedAgent.phone && <div className="text-xs font-mono text-ink-muted">{assignedAgent.phone}</div>}
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-400 bg-surface-2 p-3 rounded-md border border-amber-500/20 font-mono">
                No active driver assigned yet. Use Manual Assign or Auto-Assign above.
              </div>
            )}
          </section>

          {/* Tracking Timeline */}
          <section aria-label="Tracking state audit" className="card-surface-1 space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" aria-hidden="true" />
              State Machine Audit Trail
            </h2>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline">
              {trackingEvents.map((event: any) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-surface-1 bg-indigo-400 shadow-xs" aria-hidden="true" />
                  <div className="text-xs font-mono font-bold text-ink">
                    {event.newStatus.replace(/_/g, " ")}
                  </div>
                  {event.note && <div className="text-xs text-ink-muted mt-0.5">{event.note}</div>}
                  <div className="text-[11px] font-mono text-ink-subtle mt-0.5">
                    {new Date(event.createdAt).toLocaleString()} | Actor: {event.actorRole}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Pricing Snapshot */}
        <div className="space-y-6">
          <section aria-label="Pricing snapshot" className="card-surface-1 space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-400" aria-hidden="true" />
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
                  <span className="font-semibold text-sky-400">{Number(pricing.chargeableWeight)} kg</span>
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
                  <span className="text-sky-400">₹{Number(pricing.totalCharge).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-subtle font-mono">Pricing snapshot unavailable.</p>
            )}
          </section>

          {/* Attempts */}
          {attempts.length > 0 && (
            <section aria-label="Delivery attempt history" className="card-surface-1 space-y-3">
              <h2 className="text-sm font-bold text-ink">Attempt Records ({attempts.length}/{order.maxAttempts || 3})</h2>
              <div className="space-y-2">
                {attempts.map((att: any) => (
                  <div key={att.id} className="rounded-md border border-hairline bg-surface-2 p-2.5 text-xs font-mono space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-ink">Attempt #{att.attemptNumber}</span>
                      <span className={att.status === "DELIVERED" ? "text-emerald-400" : att.status === "FAILED" ? "text-rose-400" : "text-amber-400"}>
                        {att.status}
                      </span>
                    </div>
                    {att.failureReason && (
                      <div className="text-rose-400 text-[11px]">
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
