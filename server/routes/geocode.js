import { Router } from "express";

const router = Router();

// GET /api/geocode/search?q=Pune
// Returns place suggestions for autocomplete, using Photon (komoot.io) —
// free, no API key, built specifically for typeahead/prefix matching
// (unlike Nominatim/Open-Meteo which need more complete names).
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json([]);

  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`,
    );
    if (!response.ok) {
      throw new Error(`Photon returned ${response.status}`);
    }
    const data = await response.json();

    const suggestions = (data.features || []).map((f) => {
      const p = f.properties;
      const label = [p.name, p.state, p.country].filter(Boolean).join(", ");
      return {
        label,
        name: p.name,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
      };
    });

    res.json(suggestions);
  } catch (err) {
    res
      .status(502)
      .json({ error: "Geocode search failed", detail: err.message });
  }
});

export default router;
