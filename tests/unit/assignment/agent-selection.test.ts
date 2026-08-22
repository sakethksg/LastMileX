import { describe, it, expect } from "vitest";
import {
  filterEligibleAgents,
  scoreCandidateAgent,
  rankCandidateAgents,
  calculateHaversineDistanceKm,
  CandidateAgent,
} from "@/lib/assignment/agent-selection";
import { AgentAvailability } from "@/types/enums";

describe("Agent Selection & Scoring", () => {
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

  describe("calculateHaversineDistanceKm", () => {
    it("calculates distance between two known coordinates", () => {
      // New Delhi CP (28.6304, 77.2177) to Indiranagar Bangalore (12.9784, 77.6408) is approx ~1740 km
      const distance = calculateHaversineDistanceKm(28.6304, 77.2177, 12.9784, 77.6408);
      expect(Math.round(distance)).toBeCloseTo(1741, -1);
    });

    it("returns 0 for identical coordinates", () => {
      expect(calculateHaversineDistanceKm(28.6304, 77.2177, 28.6304, 77.2177)).toBe(0);
    });
  });

  describe("filterEligibleAgents", () => {
    it("retains only active, available agents below max capacity", () => {
      const candidates: CandidateAgent[] = [
        baseAgent,
        { ...baseAgent, id: "p-2", isActive: false }, // Inactive user
        { ...baseAgent, id: "p-3", availability: AgentAvailability.OFFLINE }, // Offline
        { ...baseAgent, id: "p-4", availability: AgentAvailability.BUSY }, // Busy
        { ...baseAgent, id: "p-5", activeDeliveryCount: 5, maxConcurrentOrders: 5 }, // At max capacity
      ];

      const eligible = filterEligibleAgents(candidates);
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe("profile-1");
    });
  });

  describe("scoreCandidateAgent", () => {
    it("scores zone match (40 pts), workload (30 pts), proximity (20 pts), and recency (10 pts)", () => {
      const agent: CandidateAgent = {
        ...baseAgent,
        activeDeliveryCount: 0, // 0/5 = 100% workload score = 30 pts
        currentZoneId: "zone-north", // Exact match = 40 pts
        lastKnownLatitude: 28.6304,
        lastKnownLongitude: 77.2177,
        lastDeliveryCompletedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago = 10 pts
      };

      const breakdown = scoreCandidateAgent(
        agent,
        "zone-north",
        { latitude: 28.6304, longitude: 77.2177 }, // 0 km = 20 pts
        new Date()
      );

      expect(breakdown.zoneMatchScore).toBe(40);
      expect(breakdown.workloadScore).toBe(30);
      expect(breakdown.proximityScore).toBe(20);
      expect(breakdown.recencyScore).toBe(10);
      expect(breakdown.totalScore).toBe(100);
    });

    it("gives 0 zone match score when zone does not match pickup zone", () => {
      const agent: CandidateAgent = {
        ...baseAgent,
        currentZoneId: "zone-south",
      };

      const breakdown = scoreCandidateAgent(agent, "zone-north");
      expect(breakdown.zoneMatchScore).toBe(0);
    });
  });

  describe("rankCandidateAgents", () => {
    it("ranks candidates primarily by total score descending", () => {
      const a1 = scoreCandidateAgent({ ...baseAgent, id: "a1", activeDeliveryCount: 4 }, "zone-north");
      const a2 = scoreCandidateAgent({ ...baseAgent, id: "a2", activeDeliveryCount: 0 }, "zone-north");

      const ranked = rankCandidateAgents([a1, a2]);
      expect(ranked[0].agent.id).toBe("a2"); // Higher score due to 0 workload
    });

    it("breaks ties by activeDeliveryCount ASC, then remaining capacity, then ID", () => {
      const a1 = scoreCandidateAgent({ ...baseAgent, id: "a1", activeDeliveryCount: 2, maxConcurrentOrders: 5 }, "zone-north");
      const a2 = scoreCandidateAgent({ ...baseAgent, id: "a2", activeDeliveryCount: 2, maxConcurrentOrders: 5 }, "zone-north");

      const ranked = rankCandidateAgents([a2, a1]);
      expect(ranked[0].agent.id).toBe("a1"); // Alphabetical ID tie-breaker
    });
  });
});
