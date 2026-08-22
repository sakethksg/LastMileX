"use client";

import React, { useEffect, useState, use } from "react";
import { fetchAdminAgentById, updateAdminAgentProfile } from "@/lib/api/agents";
import { AgentAvailability } from "@/types/enums";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function AdminEditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const agentId = resolvedParams.id;
  const router = useRouter();

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

  useEffect(() => {
    async function loadAgent() {
      try {
        setLoading(true);
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
    }
    loadAgent();
  }, [agentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: any) {
      setError(err.message || "Failed to update agent profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="space-y-4">
        <Link href="/admin/agents" className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600">
          <ArrowLeft className="h-4 w-4" /> Back to Agent Fleet
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/agents" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Agent Fleet
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Driver Profile</h1>
        <p className="text-sm text-gray-500">
          Managing {agent?.user?.name || agent?.user?.email} (Current Workload: {agent?.activeDeliveryCount || 0} active orders)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Agent profile updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
            Availability Status
          </label>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as AgentAvailability)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-hidden"
          >
            <option value={AgentAvailability.AVAILABLE}>AVAILABLE</option>
            <option value={AgentAvailability.BUSY}>BUSY</option>
            <option value={AgentAvailability.OFFLINE}>OFFLINE</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
            Maximum Concurrent Orders (1 - 50)
          </label>
          <input
            type="number"
            min="1"
            max="50"
            required
            value={maxConcurrentOrders}
            onChange={(e) => setMaxConcurrentOrders(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-hidden"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Note: Active delivery count is automatically managed by the dispatch state machine.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Vehicle Type
            </label>
            <input
              type="text"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder="e.g. BIKE, VAN, TRUCK"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Vehicle Registration Number
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. KA-01-AB-1234"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/admin/agents"
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
