// Point straight at the backend. Override by setting VITE_API_URL in a
// client/.env file if your server runs somewhere other than localhost:4000.
const BASE = "http://localhost:4000/api";

export async function fetchEntries() {
  const res = await fetch(`${BASE}/entries`);
  console.log("Calling fetch Entries..//");
  if (!res.ok) throw new Error("Failed to load entries");
  return res.json();
}

export async function createEntry(payload) {
  const res = await fetch(`${BASE}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  console.log("Calling create Entries..//");
  const data = await res.json();
  if (!res.ok) {
    const err = new Error("Validation failed");
    err.fieldErrors = data.errors || {};
    throw err;
  }
  return data;
}

export async function deleteEntry(srNo) {
  console.log("Calling delete Entries..//");
  const res = await fetch(`${BASE}/entries/${srNo}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete entry");
  return res.json();
}

export async function fetchChart(srNo, entry) {
  console.log("Calling fetch chart..//");
  const res = await fetch(`${BASE}/astrology/chart/${srNo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dob: entry.dob,
      birthTime: entry.birthTime,
      birthPlace: entry.birthPlace,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate chart");
  return data;
}

export async function searchPlaces(query) {
  const res = await fetch(
    `${BASE}/geocode/search?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  return res.json();
}
