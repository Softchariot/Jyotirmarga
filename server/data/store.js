// In-memory store. Resets whenever the server restarts.
// Swap this for a real database (e.g. MongoDB, Postgres) when you're ready.

let entries = [];
let nextSrNo = 1;

export function listEntries() {
  return entries;
}

export function addEntry(data) {
  const entry = {
    srNo: nextSrNo++,
    date: data.date,
    title: data.title,
    name: data.name,
    dob: data.dob,
    birthTime: data.birthTime,
    birthPlace: data.birthPlace,
    question: data.question,
    chart: null, // populated later if /api/astrology/chart is called for this entry
  };
  entries.push(entry);
  return entry;
}

export function removeEntry(srNo) {
  const before = entries.length;
  entries = entries.filter((e) => e.srNo !== srNo);
  // renumber so Sr.No stays sequential
  entries = entries.map((e, i) => ({ ...e, srNo: i + 1 }));
  nextSrNo = entries.length + 1;
  return entries.length !== before;
}

export function attachChart(srNo, chart) {
  const entry = entries.find((e) => e.srNo === srNo);
  if (!entry) return null;
  entry.chart = chart;
  return entry;
}
