import { API_BASE_URL } from "./http";

/**
 * Exemple d'endpoint backend attendu:
 * POST /draft/recommendations
 * body: { format, ourSide, draftState, target: { type, side, indexInPhase, globalIndex } }
 */
export async function fetchRecommendations(payload) {
  const res = await fetch(`${API_BASE_URL}/draft/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`recommendations failed: ${res.status}`);
  return res.json();
}
