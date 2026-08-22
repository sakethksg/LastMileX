import {
  CandidateAgent,
  filterEligibleAgents,
  scoreCandidateAgent,
  rankCandidateAgents,
  CandidateScoreBreakdown,
} from "./agent-selection";

/**
 * Selects the optimal delivery agent for an order given candidate agents and pickup zone.
 * Returns null if no eligible candidates are available.
 */
export function selectBestAgent(
  agents: CandidateAgent[],
  pickupZoneId: string,
  pickupCoordinates?: { latitude: number; longitude: number } | null,
  referenceTime = new Date()
): CandidateScoreBreakdown | null {
  const eligible = filterEligibleAgents(agents);
  if (eligible.length === 0) {
    return null;
  }

  const scored = eligible.map((agent) =>
    scoreCandidateAgent(agent, pickupZoneId, pickupCoordinates, referenceTime)
  );

  const ranked = rankCandidateAgents(scored);
  return ranked[0] ?? null;
}
