"use client";

import React, { useEffect, useState } from "react";
import { fetchAdminAgents } from "@/lib/api/agents";
import { AgentAvailabilityBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { Users, Search, Loader2 } from "lucide-react";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true);
        const res = await fetchAdminAgents({
          availability: availabilityFilter || undefined,
          search: search || undefined,
        });
        setAgents(res.items || res.agents || (Array.isArray(res) ? res : []));
      } catch (err: any) {
        setError(err.message || "Failed to load agents");
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, [availabilityFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Delivery Agent Fleet</h1>
          <p className="text-sm text-gray-500">Monitor driver availability, active capacities, and shift assignments</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search agent name/phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs outline-hidden"
          />

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-xs outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy</option>
            <option value="OFFLINE">Offline</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p>{error}</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">No agents found</h3>
          <p className="mt-1 text-sm text-gray-500">No delivery agents match your filter criteria.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3.5 px-4">Agent Name</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4">Current Workload</th>
                  <th className="py-3.5 px-4">Vehicle Specs</th>
                  <th className="py-3.5 px-4">Assigned Zone</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div>{agent.user?.name || "Agent"}</div>
                      <div className="text-xs text-gray-400 font-normal">{agent.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <AgentAvailabilityBadge availability={agent.availability} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-gray-800">
                      {agent.activeDeliveryCount || 0} / {agent.maxConcurrentOrders} active
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {agent.vehicleType || "BIKE"} ({agent.vehicleNumber || "KA-01"})
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-700">
                      {agent.currentZone?.name || "All Zones"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/agents/${agent.id}`}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        Edit Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
