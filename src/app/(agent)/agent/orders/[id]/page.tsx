"use client";

import React, { useEffect, useState, use } from "react";
import {
  fetchAgentOrderById,
  pickupOrder,
  startDelivery,
  outForDelivery,
  completeDelivery,
  failDelivery,
} from "@/lib/api/agents";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { OrderStatus } from "@/types/enums";
import { DeliveryFailureReason } from "@/schemas/delivery-execution.schema";
import Link from "next/link";
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Package,
  Navigation,
  Phone,
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

  const loadOrder = React.useCallback(async () => {
    try {
      setLoading(true);
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
    setActionLoading(true);
    setError(null);
    try {
      await failDelivery(orderId, failureReason, failureNotes || undefined);
      setIsFailing(false);
      await loadOrder();
    } catch (err: any) {
      setError(err.message || "Failed to report delivery failure");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <Link href="/agent/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
          <ArrowLeft className="h-4 w-4" /> Back to Assigned Deliveries
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <Link href="/agent/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Assigned Deliveries
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-gray-900">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Current Attempt: <span className="font-bold">#{order.currentAttempt || 1}</span> of {order.maxAttempts || 3}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STATE-DRIVEN EXECUTION ACTION BAR */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900">
          Delivery Action Bar
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {order.status === OrderStatus.ASSIGNED && (
            <button
              onClick={() => executeAction(() => pickupOrder(orderId))}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Confirm Package Pickup
            </button>
          )}

          {order.status === OrderStatus.PICKED_UP && (
            <button
              onClick={() => executeAction(() => startDelivery(orderId))}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              Start Transit / Hub Transfer
            </button>
          )}

          {order.status === OrderStatus.IN_TRANSIT && (
            <button
              onClick={() => executeAction(() => outForDelivery(orderId))}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              Mark Out for Delivery
            </button>
          )}

          {order.status === OrderStatus.OUT_FOR_DELIVERY && (
            <>
              <button
                onClick={() => executeAction(() => completeDelivery(orderId))}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Complete Delivery
              </button>

              <button
                onClick={() => setIsFailing(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-700 disabled:opacity-50 transition"
              >
                <AlertTriangle className="h-4 w-4" />
                Report Delivery Failure
              </button>
            </>
          )}

          {order.status === OrderStatus.DELIVERED && (
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-100/70 px-4 py-2 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
              Delivery Successfully Completed
            </div>
          )}

          {order.status === OrderStatus.FAILED && (
            <div className="flex items-center gap-2 text-sm font-bold text-red-700 bg-red-100/70 px-4 py-2 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
              Delivery Attempt Marked as Failed
            </div>
          )}
        </div>
      </div>

      {/* Failure Reason Modal */}
      {isFailing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Record Delivery Failure
            </h3>
            <p className="text-xs text-gray-600">
              Select the structured failure reason and provide operational notes.
            </p>

            <form onSubmit={handleReportFailure} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Failure Reason</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value as DeliveryFailureReason)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 outline-hidden"
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
                <label className="block text-xs font-semibold text-gray-700">Additional Operational Notes</label>
                <textarea
                  rows={3}
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  placeholder="e.g., Gate locked, recipient unreachable after 3 call attempts..."
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFailing(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Confirm Failure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package & Customer Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Destination & Customer Contact
          </h2>

          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase">Drop Address</div>
              <div className="font-medium text-gray-900 mt-0.5">{order.dropAddress}</div>
              <div className="text-xs text-gray-500 mt-0.5">PIN Code: {order.dropPinCode}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase">Pickup Origin</div>
              <div className="font-medium text-gray-900 mt-0.5">{order.pickupAddress}</div>
              <div className="text-xs text-gray-500 mt-0.5">PIN Code: {order.pickupPinCode}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Package & Payment Specs
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Payment Type</span>
              <span className="font-bold text-gray-900">{order.paymentType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Package Weight</span>
              <span className="font-bold text-gray-900">{order.actualWeight} kg</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Dimensions</span>
              <span className="font-bold text-gray-900">
                {order.packageLength} x {order.packageBreadth} x {order.packageHeight} cm
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
