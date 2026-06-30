import express from "express";
import cors from "cors";
import entriesRouter from "./routes/entries.js";
import astrologyRouter from "./routes/astrology.js";
import "dotenv/config";
import geocodeRouter from "./routes/geocode.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "jyotirmarga-server" });
});

app.use("/api/entries", entriesRouter);
app.use("/api/astrology", astrologyRouter);
app.use("/api/geocode", geocodeRouter);

app.listen(PORT, () => {
  console.log(`Jyotirmarga server running on http://localhost:${PORT}`);
});
