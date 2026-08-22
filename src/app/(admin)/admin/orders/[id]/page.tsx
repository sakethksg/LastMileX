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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-3.5 py-2 text-xs font-semibold text-purple-700 shadow-xs hover:bg-purple-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-purple-600"
                >
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                  Manual Assign
                </button>
                <button
                  type="button"
                  onClick={handleAutoAssign}
                  disabled={actionLoading}
                  aria-busy={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-purple-600"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Zap className="h-4 w-4" aria-hidden="true" />}
                  Auto-Assign Agent
                </button>
              </>
            )}

            {order.status === OrderStatus.FAILED && order.currentAttempt < (order.maxAttempts || 3) && (
              <button
                type="button"
                onClick={() => setIsRescheduling(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-orange-600"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
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
            <label htmlFor="admin-select-agent" className="block text-xs font-semibold text-gray-700">
              Available Agent
            </label>
            <select
              id="admin-select-agent"
              required
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="">-- Choose an Available Agent --</option>
              {agents.map((agent: any) => (
                <option key={agent.id} value={agent.userId || agent.user?.id}>
                  {agent.user?.name || agent.user?.email} ({agent.vehicleType || "BIKE"} - {agent.activeDeliveryCount || 0}/{agent.maxConcurrentOrders} active)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAssigning(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-purple-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !selectedAgentId}
              aria-busy={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-purple-600"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
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
            <label htmlFor="admin-reschedule-date" className="block text-xs font-semibold text-gray-700">
              Scheduled Date (Optional)
            </label>
            <input
              id="admin-reschedule-date"
              type="date"
              value={rescheduleDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsRescheduling(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-purple-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              aria-busy={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-orange-600"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
              Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Info Grids */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section aria-label="Routing and assignment" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" aria-hidden="true" />
              Addresses & Active Assignment
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

            {assignedAgent ? (
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-purple-700">Currently Assigned Driver</div>
                  <div className="font-bold text-gray-900 text-sm">{assignedAgent.name || assignedAgent.email}</div>
                  {assignedAgent.phone && <div className="text-xs text-gray-600">{assignedAgent.phone}</div>}
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                No active driver assigned yet. Use Manual Assign or Auto-Assign above.
              </div>
            )}
          </section>

          {/* Tracking Timeline */}
          <section aria-label="Tracking state audit" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" aria-hidden="true" />
              State Machine Audit Trail
            </h2>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
              {trackingEvents.map((event: any) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-purple-600 shadow-xs" aria-hidden="true" />
                  <div className="text-xs font-bold text-gray-900">
                    {event.newStatus.replace(/_/g, " ")}
                  </div>
                  {event.note && <div className="text-xs text-gray-600 mt-0.5">{event.note}</div>}
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(event.createdAt).toLocaleString()} | Actor: {event.actorRole}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Pricing Snapshot */}
        <div className="space-y-6">
          <section aria-label="Pricing snapshot" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" aria-hidden="true" />
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
                  <span>Chargeable Weight</span>
                  <span className="font-semibold text-gray-900">{Number(pricing.chargeableWeight)} kg</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Base Delivery Charge</span>
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
                  <span className="text-purple-600">₹{Number(pricing.totalCharge).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Pricing snapshot unavailable.</p>
            )}
          </section>

          {/* Attempts */}
          {attempts.length > 0 && (
            <section aria-label="Delivery attempt history" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Attempt Records ({attempts.length}/{order.maxAttempts || 3})</h2>
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
