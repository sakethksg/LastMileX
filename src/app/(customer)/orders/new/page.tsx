"use client";

import React, { useState } from "react";
import { calculateQuote } from "@/lib/api/quotes";
import { createOrder } from "@/lib/api/orders";
import { PaymentType, RouteType } from "@/types/enums";
import { QuoteBreakdown } from "@/types/domain";
import { useRouter } from "next/navigation";
import {
  Package,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Truck,
} from "lucide-react";

export default function CreateShipmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [pickupAddress, setPickupAddress] = useState("101 Indiranagar 100ft Rd, Bengaluru");
  const [pickupPinCode, setPickupPinCode] = useState("560038");
  const [dropAddress, setDropAddress] = useState("204 Koramangala 80ft Rd, Bengaluru");
  const [dropPinCode, setDropPinCode] = useState("560034");

  const [packageLength, setPackageLength] = useState<number>(20);
  const [packageBreadth, setPackageBreadth] = useState<number>(15);
  const [packageHeight, setPackageHeight] = useState<number>(10);
  const [actualWeight, setActualWeight] = useState<number>(2.0);

  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.PREPAID);
  const [codAmount, setCodAmount] = useState<number>(500);

  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);

  const handleCalculateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingQuote(true);
    setError(null);

    try {
      const result = await calculateQuote({
        pickupAddress,
        pickupPinCode,
        dropAddress,
        dropPinCode,
        packageLength: Number(packageLength),
        packageBreadth: Number(packageBreadth),
        packageHeight: Number(packageHeight),
        actualWeight: Number(actualWeight),
        paymentType,
        codAmount: paymentType === PaymentType.COD ? Number(codAmount) : undefined,
      });

      setQuote(result);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to calculate quote. Please check address PIN codes.");
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleCreateOrder = async () => {
    setLoadingSubmit(true);
    setError(null);

    try {
      const newOrder = await createOrder({
        pickupAddress,
        pickupPinCode,
        dropAddress,
        dropPinCode,
        packageLength: Number(packageLength),
        packageBreadth: Number(packageBreadth),
        packageHeight: Number(packageHeight),
        actualWeight: Number(actualWeight),
        paymentType,
      });

      router.push(`/orders/${newOrder.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create New Shipment</h1>
        <p className="text-sm text-gray-500">Calculate delivery charges and book immediate dispatch</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleCalculateQuote} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Truck className="h-5 w-5 text-blue-600" />
            1. Pickup & Delivery Locations
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Pickup Address
              </label>
              <textarea
                required
                rows={3}
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
              <div>
                <label className="block text-xs font-medium text-gray-600">Pickup PIN Code</label>
                <input
                  type="text"
                  required
                  value={pickupPinCode}
                  onChange={(e) => setPickupPinCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Drop Address
              </label>
              <textarea
                required
                rows={3}
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
              <div>
                <label className="block text-xs font-medium text-gray-600">Drop PIN Code</label>
                <input
                  type="text"
                  required
                  value={dropPinCode}
                  onChange={(e) => setDropPinCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3 pt-2">
            <Package className="h-5 w-5 text-blue-600" />
            2. Package Dimensions & Weight
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">Length (cm)</label>
              <input
                type="number"
                min="1"
                required
                value={packageLength}
                onChange={(e) => setPackageLength(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Breadth (cm)</label>
              <input
                type="number"
                min="1"
                required
                value={packageBreadth}
                onChange={(e) => setPackageBreadth(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Height (cm)</label>
              <input
                type="number"
                min="1"
                required
                value={packageHeight}
                onChange={(e) => setPackageHeight(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Actual Wt (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={actualWeight}
                onChange={(e) => setActualWeight(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-900 outline-hidden"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Payment Type
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-hidden"
              >
                <option value={PaymentType.PREPAID}>Prepaid</option>
                <option value={PaymentType.COD}>Cash on Delivery (COD)</option>
              </select>
            </div>

            {paymentType === PaymentType.COD && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  COD Collectible Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={codAmount}
                  onChange={(e) => setCodAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-hidden"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loadingQuote}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loadingQuote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              {loadingQuote ? "Calculating Rate..." : "Get Instant Quote"}
            </button>
          </div>
        </form>
      )}

      {step === 2 && quote && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Review Pricing Breakdown</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              {quote.rateCardName}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <div className="text-xs font-semibold text-gray-500">Route Classification</div>
              <div className="font-medium text-gray-900 mt-0.5">
                {quote.pickupZone.name} → {quote.dropZone.name} ({quote.routeType})
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500">Weight Charge Factor</div>
              <div className="font-medium text-gray-900 mt-0.5">
                Chargeable: <span className="font-bold">{quote.chargeableWeight} kg</span> (Actual: {quote.actualWeight} kg, Volumetric: {quote.volumetricWeight} kg)
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-b border-gray-100 py-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Base Delivery Charge</span>
              <span>₹{quote.deliveryCharge.toFixed(2)}</span>
            </div>
            {quote.codSurcharge > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>COD Surcharge</span>
                <span>₹{quote.codSurcharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Estimated Charge</span>
              <span className="text-blue-600">₹{quote.totalCharge.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowLeft className="h-4 w-4" /> Edit Details
            </button>

            <button
              type="button"
              disabled={loadingSubmit}
              onClick={handleCreateOrder}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loadingSubmit ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loadingSubmit ? "Confirming Booking..." : "Confirm & Book Shipment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
