"use client";

import React, { useState } from "react";
import { calculateQuote } from "@/lib/api/quotes";
import { createOrder } from "@/lib/api/orders";
import { PaymentType } from "@/types/enums";
import { QuoteBreakdown } from "@/types/domain";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { useRouter } from "next/navigation";
import {
  Package,
  Calculator,
  CheckCircle2,
  Loader2,
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
    if (loadingQuote) return;
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
      setError(err.message || "Failed to calculate quote. Please verify pickup and delivery PIN codes.");
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleCreateOrder = async () => {
    if (loadingSubmit) return;
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
      setError(err.message || "Failed to book shipment. Please try again.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Rate Engine & Dispatch"
        title="Create New Shipment"
        subtitle="Estimate delivery charges deterministically and book immediate dispatch"
        backHref="/orders"
        backLabel="Back to Shipments"
      />

      {error && (
        <ErrorState
          title="Shipment Error"
          message={error}
          code="VALIDATION_ERROR"
        />
      )}

      {step === 1 && (
        <form onSubmit={handleCalculateQuote} className="card-surface-1 space-y-6">
          <h2 className="text-base font-bold text-ink flex items-center gap-2 border-b border-hairline-soft pb-3">
            <Truck className="h-5 w-5 text-sky-400" aria-hidden="true" />
            1. Pickup & Delivery Locations
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label htmlFor="shipment-pickup-address" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Pickup Address
                </label>
                <textarea
                  id="shipment-pickup-address"
                  required
                  rows={3}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="input-surface mt-1 w-full text-sm"
                />
              </div>

              <div>
                <label htmlFor="shipment-pickup-pincode" className="block text-xs font-medium text-ink-muted">
                  Pickup PIN Code
                </label>
                <input
                  id="shipment-pickup-pincode"
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  value={pickupPinCode}
                  onChange={(e) => setPickupPinCode(e.target.value)}
                  className="input-surface mt-1 w-full text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="shipment-drop-address" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Drop Address
                </label>
                <textarea
                  id="shipment-drop-address"
                  required
                  rows={3}
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  className="input-surface mt-1 w-full text-sm"
                />
              </div>

              <div>
                <label htmlFor="shipment-drop-pincode" className="block text-xs font-medium text-ink-muted">
                  Drop PIN Code
                </label>
                <input
                  id="shipment-drop-pincode"
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  value={dropPinCode}
                  onChange={(e) => setDropPinCode(e.target.value)}
                  className="input-surface mt-1 w-full text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <h2 className="text-base font-bold text-ink flex items-center gap-2 border-b border-hairline-soft pb-3 pt-2">
            <Package className="h-5 w-5 text-indigo-400" aria-hidden="true" />
            2. Package Dimensions & Weight
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="package-length" className="block text-xs font-medium text-ink-muted">Length (cm)</label>
              <input
                id="package-length"
                type="number"
                min="1"
                required
                value={packageLength}
                onChange={(e) => setPackageLength(Number(e.target.value))}
                className="input-surface mt-1 w-full text-sm"
              />
            </div>
            <div>
              <label htmlFor="package-breadth" className="block text-xs font-medium text-ink-muted">Breadth (cm)</label>
              <input
                id="package-breadth"
                type="number"
                min="1"
                required
                value={packageBreadth}
                onChange={(e) => setPackageBreadth(Number(e.target.value))}
                className="input-surface mt-1 w-full text-sm"
              />
            </div>
            <div>
              <label htmlFor="package-height" className="block text-xs font-medium text-ink-muted">Height (cm)</label>
              <input
                id="package-height"
                type="number"
                min="1"
                required
                value={packageHeight}
                onChange={(e) => setPackageHeight(Number(e.target.value))}
                className="input-surface mt-1 w-full text-sm"
              />
            </div>
            <div>
              <label htmlFor="package-weight" className="block text-xs font-medium text-ink-muted">Actual Wt (kg)</label>
              <input
                id="package-weight"
                type="number"
                step="0.1"
                min="0.1"
                required
                value={actualWeight}
                onChange={(e) => setActualWeight(Number(e.target.value))}
                className="input-surface mt-1 w-full text-sm"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="shipment-payment-type" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Payment Type
              </label>
              <select
                id="shipment-payment-type"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="input-surface mt-1 w-full text-sm"
              >
                <option value={PaymentType.PREPAID}>Prepaid</option>
                <option value={PaymentType.COD}>Cash on Delivery (COD)</option>
              </select>
            </div>

            {paymentType === PaymentType.COD && (
              <div>
                <label htmlFor="shipment-cod-amount" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  COD Collectible Amount (₹)
                </label>
                <input
                  id="shipment-cod-amount"
                  type="number"
                  min="1"
                  required
                  value={codAmount}
                  onChange={(e) => setCodAmount(Number(e.target.value))}
                  className="input-surface mt-1 w-full text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-hairline-soft">
            <button
              type="submit"
              disabled={loadingQuote}
              aria-busy={loadingQuote}
              className="btn-primary"
            >
              {loadingQuote ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Calculator className="h-4 w-4 mr-2 text-inverse-ink" aria-hidden="true" />}
              {loadingQuote ? "Calculating Rate..." : "Get Instant Quote"}
            </button>
          </div>
        </form>
      )}

      {step === 2 && quote && (
        <div className="card-surface-1 space-y-6">
          <div className="flex items-center justify-between border-b border-hairline-soft pb-4">
            <h2 className="text-lg font-bold text-ink">Review Pricing Breakdown</h2>
            <span className="rounded-xs bg-indigo-500/10 px-3 py-1 text-xs font-mono font-bold text-indigo-400 border border-indigo-500/20">
              {quote.rateCardName}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm bg-surface-2 p-4 rounded-md border border-hairline">
            <div>
              <div className="text-xs font-semibold text-ink-subtle uppercase">Route Classification</div>
              <div className="font-medium text-ink mt-0.5">
                {quote.pickupZone.name} &rarr; {quote.dropZone.name} ({quote.routeType})
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-subtle uppercase">Weight Charge Factor</div>
              <div className="font-medium text-ink mt-0.5">
                Chargeable: <span className="font-bold text-sky-400">{quote.chargeableWeight} kg</span> (Actual: {quote.actualWeight} kg, Volumetric: {quote.volumetricWeight} kg)
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-b border-hairline-soft py-4 text-sm font-mono">
            <div className="flex justify-between text-ink-muted">
              <span>Base Delivery Charge</span>
              <span>₹{quote.deliveryCharge.toFixed(2)}</span>
            </div>
            {quote.codSurcharge > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>COD Surcharge</span>
                <span>₹{quote.codSurcharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-ink pt-2 border-t border-hairline">
              <span>Total Estimated Charge</span>
              <span className="text-sky-400">₹{quote.totalCharge.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" /> Edit Details
            </button>

            <button
              type="button"
              disabled={loadingSubmit}
              aria-busy={loadingSubmit}
              onClick={handleCreateOrder}
              className="btn-primary"
            >
              {loadingSubmit ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />}
              {loadingSubmit ? "Confirming Booking..." : "Confirm & Book Shipment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
