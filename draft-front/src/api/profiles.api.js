import { API_BASE_URL } from "./http";

async function apiJson(path, options) {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(`${options?.method ?? "GET"} ${path} failed: ${res.status}`);
  return res.json();
}

export const profilesApi = {
  listProfiles: () => apiJson("/profiles"),
  listEntries: ({ profileName, role }) =>
    apiJson(`/profiles/entries?profileName=${encodeURIComponent(profileName)}&role=${role}`),
  createEntry: (payload) =>
    apiJson("/profiles/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateEntry: (id, payload) =>
    apiJson(`/profiles/entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteEntry: (id) =>
    apiJson(`/profiles/entries/${id}`, { method: "DELETE" }),
};
