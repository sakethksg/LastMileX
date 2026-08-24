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
        eyebrow="Fleet Ops"
        title="Delivery Driver Fleet"
        subtitle="Monitor driver availability, active capacities, and vehicle configurations"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label htmlFor="admin-agent-search" className="sr-only">Search driver</label>
              <input
                id="admin-agent-search"
                type="text"
                placeholder="Search driver name/phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-surface !py-2 text-xs"
              />
            </div>

            <div>
              <label htmlFor="admin-agent-availability-filter" className="sr-only">Filter by Availability</label>
              <select
                id="admin-agent-availability-filter"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="input-surface !py-2 text-xs"
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
          icon={<Users className="h-6 w-6 text-ink-muted" aria-hidden="true" />}
          title="No Delivery Agents Found"
          description={
            availabilityFilter || search
              ? "No delivery drivers match your current search or availability filter."
              : "No delivery agents have registered in the platform yet."
          }
        />
      ) : (
        <div className="card-surface-1 overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-hairline bg-surface-2 text-caption font-semibold uppercase text-ink-muted">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Agent Name</th>
                  <th scope="col" className="py-3.5 px-4">Availability</th>
                  <th scope="col" className="py-3.5 px-4">Current Workload</th>
                  <th scope="col" className="py-3.5 px-4">Vehicle Specs</th>
                  <th scope="col" className="py-3.5 px-4">Assigned Zone</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {agents.map((agent) => {
                  const profile = agent.deliveryAgentProfile;
                  const availability = profile?.availability || "OFFLINE";

                  return (
                  <tr key={agent.id} className="hover:bg-surface-2/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-ink">
                      <div>{agent.user?.name || "Agent"}</div>
                      <div className="text-xs text-ink-subtle font-mono font-normal">{agent.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <AgentAvailabilityBadge availability={availability} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-product-nomad">
                      {profile?.activeDeliveryCount || 0} / {profile?.maxConcurrentOrders || 0} active
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-muted font-mono">
                      {profile?.vehicleType || "BIKE"} ({profile?.vehicleNumber || "KA-01"})
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-muted">
                      {profile?.currentZone?.name || "All Zones"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/agents/${agent.id}`}
                        className="btn-secondary !px-2.5 !py-1 text-xs"
                      >
                        Edit Profile
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
