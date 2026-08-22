"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchAdminAgents } from "@/lib/api/agents";
import { AgentAvailabilityBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";
import { Users } from "lucide-react";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
  }, [availabilityFilter, search]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Agent Fleet"
        subtitle="Monitor driver availability, active capacities, and vehicle configurations"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label htmlFor="admin-agent-search" className="sr-only">Search driver</label>
              <input
                id="admin-agent-search"
                type="text"
                placeholder="Search agent name/phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="admin-agent-availability-filter" className="sr-only">Filter by Availability</label>
              <select
                id="admin-agent-availability-filter"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-xs outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="">All Availability</option>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
          </div>
        }
      />

      {loading ? (
        <LoadingSkeleton variant="table" message="Loading driver fleet records..." />
      ) : error ? (
        <ErrorState
          title="Could Not Load Agent Fleet"
          message={error}
          onRetry={loadAgents}
        />
      ) : agents.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7 text-gray-400" aria-hidden="true" />}
          title="No Delivery Agents Found"
          description={
            availabilityFilter || search
              ? "No delivery drivers match your current search or availability filter."
              : "No delivery agents have registered in the platform yet."
          }
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Agent Name</th>
                  <th scope="col" className="py-3.5 px-4">Availability</th>
                  <th scope="col" className="py-3.5 px-4">Current Workload</th>
                  <th scope="col" className="py-3.5 px-4">Vehicle Specs</th>
                  <th scope="col" className="py-3.5 px-4">Assigned Zone</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Action</th>
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
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-purple-600 transition"
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
