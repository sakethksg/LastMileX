import { describe, it, expect } from "vitest";
import { selectBestAgent } from "@/lib/assignment/auto-assignment";
import { CandidateAgent } from "@/lib/assignment/agent-selection";
import { AgentAvailability } from "@/types/enums";

describe("Auto-Assignment Engine", () => {
  const baseAgent: CandidateAgent = {
    id: "profile-1",
    userId: "user-1",
    name: "Agent One",
    email: "agent1@example.com",
    isActive: true,
    availability: AgentAvailability.AVAILABLE,
    currentZoneId: "zone-north",
    maxConcurrentOrders: 5,
    activeDeliveryCount: 1,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };

  it("returns null when candidate list is empty or all agents are unavailable", () => {
    expect(selectBestAgent([], "zone-north")).toBeNull();

    const unavailable = [{ ...baseAgent, availability: AgentAvailability.OFFLINE }];
    expect(selectBestAgent(unavailable, "zone-north")).toBeNull();
  });

  it("selects the agent with the highest deterministic ranking score", () => {
    const agents: CandidateAgent[] = [
      { ...baseAgent, id: "p-1", currentZoneId: "zone-south", activeDeliveryCount: 1 }, // Different zone
      { ...baseAgent, id: "p-2", currentZoneId: "zone-north", activeDeliveryCount: 0 }, // In zone, lowest load
    ];

    const best = selectBestAgent(agents, "zone-north");
    expect(best).not.toBeNull();
    expect(best?.agent.id).toBe("p-2");
  });
});
