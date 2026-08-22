import { AgentAvailability } from "@/types/enums";

export interface CandidateAgent {
  id: string; // DeliveryAgentProfile ID
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  availability: AgentAvailability;
  currentZoneId: string | null;
  maxConcurrentOrders: number;
  activeDeliveryCount: number;
  lastKnownLatitude?: number | null;
  lastKnownLongitude?: number | null;
  lastDeliveryCompletedAt?: Date | null;
  createdAt: Date;
}

export interface CandidateScoreBreakdown {
  agent: CandidateAgent;
  zoneMatchScore: number;
  workloadScore: number;
  proximityScore: number;
  recencyScore: number;
  totalScore: number;
}

export const ASSIGNMENT_WEIGHTS = {
  ZONE_MATCH: 40,
  WORKLOAD: 30,
  PROXIMITY: 20,
  RECENCY: 10,
} as const;

/**
 * Calculates Haversine distance in kilometers between two lat/lng pairs
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Filter agents eligible for assignment:
 * 1. User is active
 * 2. Availability is AVAILABLE
 * 3. activeDeliveryCount < maxConcurrentOrders
 */
export function filterEligibleAgents(agents: CandidateAgent[]): CandidateAgent[] {
  return agents.filter(
    (agent) =>
      agent.isActive &&
      agent.availability === AgentAvailability.AVAILABLE &&
      agent.activeDeliveryCount < agent.maxConcurrentOrders
  );
}

/**
 * Scores a candidate agent based on:
 * - Zone match (40 pts)
 * - Workload ratio (30 pts)
 * - Proximity to pickup (20 pts)
 * - Recent activity (10 pts)
 */
export function scoreCandidateAgent(
  agent: CandidateAgent,
  pickupZoneId: string,
  pickupCoordinates?: { latitude: number; longitude: number } | null,
  referenceTime = new Date()
): CandidateScoreBreakdown {
  // 1. Zone Match Score (0 or 40)
  const zoneMatchScore = agent.currentZoneId === pickupZoneId ? ASSIGNMENT_WEIGHTS.ZONE_MATCH : 0;

  // 2. Workload Score: (1 - (active / max)) * 30
  const maxCapacity = Math.max(1, agent.maxConcurrentOrders);
  const workloadRatio = Math.min(1, Math.max(0, agent.activeDeliveryCount / maxCapacity));
  const workloadScore = Math.round((1 - workloadRatio) * ASSIGNMENT_WEIGHTS.WORKLOAD * 100) / 100;

  // 3. Proximity Score (0 to 20 pts)
  let proximityScore = 10; // Neutral default when no coordinates
  if (
    pickupCoordinates &&
    agent.lastKnownLatitude !== null &&
    agent.lastKnownLatitude !== undefined &&
    agent.lastKnownLongitude !== null &&
    agent.lastKnownLongitude !== undefined
  ) {
    const dist = calculateHaversineDistanceKm(
      agent.lastKnownLatitude,
      agent.lastKnownLongitude,
      pickupCoordinates.latitude,
      pickupCoordinates.longitude
    );
    if (dist <= 5) proximityScore = 20;
    else if (dist <= 10) proximityScore = 15;
    else if (dist <= 20) proximityScore = 10;
    else if (dist <= 50) proximityScore = 5;
    else proximityScore = 0;
  }

  // 4. Recency Score (0, 5, or 10 pts)
  let recencyScore = 0;
  if (agent.lastDeliveryCompletedAt) {
    const hoursSinceDelivery =
      (referenceTime.getTime() - new Date(agent.lastDeliveryCompletedAt).getTime()) /
      (1000 * 60 * 60);
    if (hoursSinceDelivery <= 1) recencyScore = 10;
    else if (hoursSinceDelivery <= 4) recencyScore = 5;
  }

  const totalScore =
    Math.round(
      (zoneMatchScore + workloadScore + proximityScore + recencyScore) * 100
    ) / 100;

  return {
    agent,
    zoneMatchScore,
    workloadScore,
    proximityScore,
    recencyScore,
    totalScore,
  };
}

/**
 * Deterministically ranks candidate agents by:
 * 1. Total score DESC
 * 2. Active delivery count ASC (least loaded)
 * 3. Remaining capacity DESC (most free slots)
 * 4. Agent ID ASC (stable deterministic tie-breaker)
 */
export function rankCandidateAgents(
  scoredCandidates: CandidateScoreBreakdown[]
): CandidateScoreBreakdown[] {
  return [...scoredCandidates].sort((a, b) => {
    // 1. Total Score DESC
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    // 2. Active Delivery Count ASC
    if (a.agent.activeDeliveryCount !== b.agent.activeDeliveryCount) {
      return a.agent.activeDeliveryCount - b.agent.activeDeliveryCount;
    }

    // 3. Remaining Capacity DESC
    const remA = a.agent.maxConcurrentOrders - a.agent.activeDeliveryCount;
    const remB = b.agent.maxConcurrentOrders - b.agent.activeDeliveryCount;
    if (remB !== remA) {
      return remB - remA;
    }

    // 4. Stable deterministic tie-breaker by ID ASC
    return a.agent.id.localeCompare(b.agent.id);
  });
}
