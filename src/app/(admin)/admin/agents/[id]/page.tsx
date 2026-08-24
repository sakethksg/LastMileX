"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { fetchAdminAgentById, updateAdminAgentProfile } from "@/lib/api/agents";
import { AgentAvailability } from "@/types/enums";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function AdminEditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const agentId = resolvedParams.id;

  const [agent, setAgent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form
  const [availability, setAvailability] = useState<AgentAvailability>(AgentAvailability.AVAILABLE);
  const [maxConcurrentOrders, setMaxConcurrentOrders] = useState<number>(3);
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const loadAgent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminAgentById(agentId);
      setAgent(data);
      setAvailability(data.availability);
      setMaxConcurrentOrders(data.maxConcurrentOrders || 3);
      setVehicleType(data.vehicleType || "BIKE");
      setVehicleNumber(data.vehicleNumber || "");
    } catch (err: any) {
      setError(err.message || "Failed to load agent profile");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateAdminAgentProfile(agentId, {
        availability,
        maxConcurrentOrders: Number(maxConcurrentOrders),
        vehicleType: vehicleType || null,
        vehicleNumber: vehicleNumber || null,
      });
      setSuccess(true);
      await loadAgent();
    } catch (err: any) {
      setError(err.message || "Failed to update agent profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton message="Loading driver profile and vehicle configurations..." />;
  }

  if (error && !agent) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Fleet Ops"
          title="Edit Driver Profile"
          backHref="/admin/agents"
          backLabel="Back to Agent Fleet"
        />
        <ErrorState
          title="Could Not Load Agent"
          message={error}
          onRetry={loadAgent}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Fleet Configuration"
        title="Edit Driver Profile"
        subtitle={`Managing ${agent?.user?.name || agent?.user?.email} (Current Workload: ${agent?.activeDeliveryCount || 0} active orders)`}
        backHref="/admin/agents"
        backLabel="Back to Agent Fleet"
      />

      {error && (
        <ErrorState
          title="Update Error"
          message={error}
          code="VALIDATION_ERROR"
        />
      )}

      {success && (
        <div role="status" className="flex items-center gap-2.5 rounded-md border border-product-nomad/30 bg-product-nomad/10 p-4 text-sm text-product-nomad">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Agent profile updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-surface-1 space-y-6">
        <div>
          <label htmlFor="agent-edit-availability" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Availability Status
          </label>
          <select
            id="agent-edit-availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value as AgentAvailability)}
            className="input-surface mt-1 w-full text-sm"
          >
            <option value={AgentAvailability.AVAILABLE}>AVAILABLE</option>
            <option value={AgentAvailability.BUSY}>BUSY</option>
            <option value={AgentAvailability.OFFLINE}>OFFLINE</option>
          </select>
        </div>

        <div>
          <label htmlFor="agent-edit-capacity" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Maximum Concurrent Orders (1 - 50)
          </label>
          <input
            id="agent-edit-capacity"
            type="number"
            min="1"
            max="50"
            required
            value={maxConcurrentOrders}
            onChange={(e) => setMaxConcurrentOrders(Number(e.target.value))}
            className="input-surface mt-1 w-full text-sm font-mono"
          />
          <p className="text-[11px] text-ink-subtle mt-1 font-mono">
            Note: Active delivery count is automatically managed by the dispatch state machine.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="agent-edit-vehicle-type" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Vehicle Type
            </label>
            <input
              id="agent-edit-vehicle-type"
              type="text"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder="e.g. BIKE, VAN, TRUCK"
              className="input-surface mt-1 w-full text-sm"
            />
          </div>

          <div>
            <label htmlFor="agent-edit-vehicle-number" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Vehicle Registration Number
            </label>
            <input
              id="agent-edit-vehicle-number"
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. KA-01-AB-1234"
              className="input-surface mt-1 w-full text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline-soft">
          <Link
            href="/admin/agents"
            className="btn-secondary !px-4 !py-2 text-xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="btn-product-terraform !px-5 !py-2 text-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />}
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
