import { Router } from "express";
import { attachChart } from "../data/store.js";

const router = Router();

// POST /api/astrology/chart/:srNo
router.post("/chart/:srNo", async (req, res) => {
  console.log("=== /api/astrology/chart hit ===");
  console.log("srNo param:", req.params.srNo);
  console.log("req.body:", req.body);

  const srNo = Number(req.params.srNo);

  try {
    const chart = await generateChart(req.body);
    const updated = attachChart(srNo, chart);
    if (!updated) return res.status(404).json({ error: "Entry not found" });
    res.json(updated);
  } catch (err) {
    console.log("Caught error in /chart route:", err);
    res
      .status(502)
      .json({ error: "Chart provider error", detail: err.message });
  }
});

// Parses "dd-mm-yyyy" -> { year, month, date }
function parseDob(dob) {
  const [dd, mm, yyyy] = dob.split("-").map(Number);
  return { year: yyyy, month: mm, date: dd };
}

// Parses "07:45 AM" / "07:45 PM" -> { hours: 0-23, minutes }
// Parses time. Accepts either:
//  - 24-hour from <input type="time"> e.g. "23:20" (with stray " AM"/" PM" suffix, ignored)
//  - 12-hour e.g. "07:45 AM" / "07:45 PM"
function parseTime(birthTime) {
  const [time, period] = birthTime.trim().split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  // Native <input type="time"> already gives 24-hour values (0-23).
  // Only apply the AM/PM conversion if hours is in 12-hour range (1-12).
  if (period && hours >= 1 && hours <= 12) {
    if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
  }

  return { hours, minutes: minutes || 0 };
}

// Turns "Pune / Haveli" into { latitude, longitude } using Open-Meteo's
// free geocoding API (no API key needed, no restrictive usage policy —
// safe to call from a server).
async function geocodePlace(birthPlace) {
  const cleanedPlace = birthPlace.split("/")[0].trim(); // drop "/ Taluka" suffix, keep main place name
  const query = encodeURIComponent(cleanedPlace);
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`,
  );
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  if (!data.results || !data.results.length) {
    throw new Error(`Could not geocode "${birthPlace}"`);
  }
  const { latitude, longitude } = data.results[0];
  return { latitude, longitude };
}

async function generateChart({ dob, birthTime, birthPlace }) {
  if (!process.env.FREE_ASTROLOGY_API_KEY) {
    throw new Error(
      "FREE_ASTROLOGY_API_KEY is not set. Add it to server/.env and restart the server.",
    );
  }

  const { year, month, date: day } = parseDob(dob);
  const { hours: hour, minutes: minute } = parseTime(birthTime);
  const { latitude: lat, longitude: lng } = await geocodePlace(birthPlace);

  const response = await fetch(
    "https://api.freeastroapi.com/api/v1/natal/calculate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.FREE_ASTROLOGY_API_KEY,
      },
      body: JSON.stringify({
        year,
        month,
        day,
        hour,
        minute,
        city: birthPlace,
        lat,
        lng,
        tz_str: "AUTO",
        house_system: "placidus",
        include_features: ["lilith", "chiron"],
        zodiac_type: "tropical",
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Provider returned ${response.status}: ${text}`);
  }

  const data = await response.json();
  return {
    source: "freeastroapi",
    input: { dob, birthTime, birthPlace, lat, lng },
    chart: data,
    generatedAt: new Date().toISOString(),
  };
}

export default router;
