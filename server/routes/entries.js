import { Router } from "express";
import { listEntries, addEntry, removeEntry } from "../data/store.js";

const router = Router();

const TITLES = ["Mr", "Mrs", "Ms", "Shri", "Smt."];
const QUESTIONS = [
  "General Predictions",
  "Marriage Prospects / Yoga",
  "Career Opportunities",
  "Foreign Travels",
  "Others",
];

function todayStr() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function validate(body) {
  const errors = {};
  if (!body.name || !body.name.trim()) errors.name = "Name is required";
  if (body.name && body.name.length > 20) errors.name = "Max 20 characters";
  if (!body.dob || !/^\d{2}-\d{2}-\d{4}$/.test(body.dob))
    errors.dob = "Date of birth must be dd-mm-yyyy";
  if (!body.birthTime || !body.birthTime.trim())
    errors.birthTime = "Birth time is required";
  if (!body.birthPlace || !body.birthPlace.trim())
    errors.birthPlace = "Birth place is required";
  if (body.title && !TITLES.includes(body.title))
    errors.title = "Invalid title";
  if (body.question && !QUESTIONS.includes(body.question))
    errors.question = "Invalid question option";
  return errors;
}

// GET /api/entries
router.get("/", (req, res) => {
  res.json(listEntries());
});

// POST /api/entries
router.post("/", (req, res) => {
  const errors = validate(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  const entry = addEntry({
    date: todayStr(),
    title: req.body.title || "Mr",
    name: req.body.name.trim(),
    dob: req.body.dob,
    birthTime: req.body.birthTime,
    birthPlace: req.body.birthPlace.trim(),
    question: req.body.question || QUESTIONS[0],
  });
  res.status(201).json(entry);
});

// DELETE /api/entries/:srNo
router.delete("/:srNo", (req, res) => {
  const ok = removeEntry(Number(req.params.srNo));
  if (!ok) return res.status(404).json({ error: "Entry not found" });
  res.json(listEntries());
});

export default router;
