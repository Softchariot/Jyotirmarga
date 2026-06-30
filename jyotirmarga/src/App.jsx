import { useEffect, useRef, useState } from "react";
import {
  fetchEntries,
  createEntry,
  deleteEntry,
  fetchChart,
  searchPlaces,
} from "./api.js";

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

const emptyForm = {
  title: "Mr",
  name: "",
  dob: "",
  dobManual: "",
  birthTime: "",
  ampm: "AM",
  birthPlace: "",
  question: QUESTIONS[0],
};

export default function App() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [view, setView] = useState("form");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchEntries()
      .then(setEntries)
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }

  function clientValidate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.name.length > 20) e.name = "Max 20 characters";
    const dobValue = form.dobManual || form.dob;
    if (!dobValue) e.dob = "Date of birth is required";
    else if (!/^\d{2}-\d{2}-\d{4}$/.test(dobValue))
      e.dob = "Use dd-mm-yyyy format";
    if (!form.birthTime) e.birthTime = "Birth time is required";
    if (!form.birthPlace.trim()) e.birthPlace = "Birth place is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!clientValidate()) return;
    const dobValue = form.dobManual || form.dob;
    setSubmitting(true);
    try {
      const entry = await createEntry({
        title: form.title,
        name: form.name.trim(),
        dob: dobValue,
        birthTime: `${form.birthTime} ${form.ampm}`,
        birthPlace: form.birthPlace.trim(),
        question: form.question,
      });
      setEntries((prev) => [...prev, entry]);
      setForm(emptyForm);
      setView("list");
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      else alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function generateChart(entry) {
    try {
      const updated = await fetchChart(entry.srNo, entry);
      setEntries((prev) =>
        prev.map((e) => (e.srNo === updated.srNo ? updated : e)),
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function removeEntry(srNo) {
    try {
      const updated = await deleteEntry(srNo);
      setEntries(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top, #1a2147 0%, #0c0f24 60%, #07091a 100%)",
        fontFamily: "'Spectral', Georgia, serif",
        color: "#f3ead8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Stars />
      <header
        style={{
          padding: "36px 24px 20px",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.35em",
            color: "#d4a657",
            fontFamily: "'Inter', sans-serif",
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          ज्योतिर्मार्ग · Jyotirmarga
        </div>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            margin: 0,
            fontWeight: 600,
            letterSpacing: "0.02em",
            background: "linear-gradient(135deg, #f3ead8 0%, #d4a657 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          The Path of Light
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            color: "#9aa0c4",
            fontSize: 14,
            marginTop: 10,
            maxWidth: 480,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.5,
          }}
        >
          Birth-chart consultation intake. Submit a horoscope request below;
          each entry is numbered in sequence for the day's register.
        </p>

        <div
          style={{
            display: "inline-flex",
            marginTop: 22,
            border: "1px solid #3a3f6b",
            borderRadius: 999,
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
          }}
        >
          <button
            onClick={() => setView("form")}
            style={tabStyle(view === "form")}
          >
            New Request
          </button>
          <button
            onClick={() => setView("list")}
            style={tabStyle(view === "list")}
          >
            Register ({entries.length})
          </button>
        </div>
        {loadError && (
          <div
            style={{
              marginTop: 14,
              color: "#e08a8a",
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Could not reach server: {loadError}. Is the backend running on port
            4000?
          </div>
        )}
      </header>

      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "10px 24px 60px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: "#7e84a8",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Loading...
          </div>
        ) : view === "form" ? (
          <FormPanel
            form={form}
            update={update}
            errors={errors}
            submit={submit}
            submitting={submitting}
            nextSr={entries.length + 1}
          />
        ) : (
          <RegisterPanel
            entries={entries}
            onRemove={removeEntry}
            onGenerateChart={generateChart}
          />
        )}
      </main>
    </div>
  );
}

function tabStyle(active) {
  return {
    padding: "9px 20px",
    background: active ? "#d4a657" : "transparent",
    color: active ? "#1a1224" : "#cfd3ef",
    border: "none",
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
    transition: "all 0.2s ease",
  };
}

function Field({ label, error, children, hint }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#b9a778",
          marginBottom: 7,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div
          style={{
            fontSize: 11,
            color: "#7e84a8",
            fontFamily: "'Inter', sans-serif",
            marginTop: 5,
          }}
        >
          {hint}
        </div>
      )}
      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#e08a8a",
            fontFamily: "'Inter', sans-serif",
            marginTop: 5,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

const inputBase = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #383d68",
  borderRadius: 8,
  padding: "11px 13px",
  color: "#f3ead8",
  fontSize: 15,
  fontFamily: "'Spectral', Georgia, serif",
  outline: "none",
};

function PlaceAutocomplete({ value, onChange, onSelectCoords }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  function handleInput(text) {
    setQuery(text);
    onChange(text);
    onSelectCoords?.(null); // clear cached coords if user edits manually

    clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(text);
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 300); // debounce so we don't hit the API on every keystroke
  }

  function pick(s) {
    setQuery(s.label);
    onChange(s.label);
    onSelectCoords?.({ latitude: s.latitude, longitude: s.longitude });
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. Pune"
        style={inputBase}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#161a3d",
            border: "1px solid #383d68",
            borderRadius: 8,
            zIndex: 10,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => pick(s)}
              style={{
                padding: "9px 13px",
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                borderBottom:
                  i < suggestions.length - 1 ? "1px solid #2c2f57" : "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(212,166,87,0.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormPanel({ form, update, errors, submit, submitting, nextSr }) {
  return (
    <div
      style={{
        background: "rgba(20, 24, 54, 0.55)",
        border: "1px solid #2c2f57",
        borderRadius: 18,
        padding: "30px 28px",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <span style={{ fontSize: 12, color: "#7e84a8" }}>
          Sr. No. <strong style={{ color: "#d4a657" }}>{nextSr}</strong>
        </span>
        <span style={{ fontSize: 12, color: "#7e84a8" }}>
          Date: <strong style={{ color: "#d4a657" }}>{todayStr()}</strong>
        </span>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 110 }}>
          <Field label="Title">
            <select
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              style={{ ...inputBase, cursor: "pointer" }}
            >
              {TITLES.map((t) => (
                <option key={t} value={t} style={{ background: "#1a2147" }}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field
            label="Name"
            error={errors.name}
            hint={`${form.name.length}/20`}
          >
            <input
              value={form.name}
              maxLength={20}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Full name"
              style={inputBase}
            />
          </Field>
        </div>
      </div>

      <Field label="Date of Birth" error={errors.dob} hint="dd-mm-yyyy">
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="date"
            onChange={(e) => {
              const v = e.target.value;
              if (v) {
                const [y, m, d] = v.split("-");
                update("dob", `${d}-${m}-${y}`);
                update("dobManual", "");
              }
            }}
            style={{ ...inputBase, flex: "0 0 140px" }}
          />
          <input
            value={form.dobManual}
            onChange={(e) => update("dobManual", e.target.value)}
            placeholder="dd-mm-yyyy"
            style={inputBase}
          />
        </div>
      </Field>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Birth Time" error={errors.birthTime}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="time"
                value={form.birthTime}
                onChange={(e) => update("birthTime", e.target.value)}
                style={{ ...inputBase, flex: 1 }}
              />
            </div>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field
            label="Birth Place"
            error={errors.birthPlace}
            hint="Start typing — pick from the list"
          >
            <PlaceAutocomplete
              value={form.birthPlace}
              onChange={(v) => update("birthPlace", v)}
              onSelectCoords={(coords) => update("birthPlaceCoords", coords)}
            />
          </Field>
        </div>
      </div>

      <Field label="Question">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {QUESTIONS.map((q) => (
            <label
              key={q}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 13px",
                borderRadius: 8,
                border:
                  form.question === q
                    ? "1px solid #d4a657"
                    : "1px solid #383d68",
                background:
                  form.question === q
                    ? "rgba(212,166,87,0.1)"
                    : "rgba(255,255,255,0.02)",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="radio"
                name="question"
                checked={form.question === q}
                onChange={() => update("question", q)}
                style={{ accentColor: "#d4a657" }}
              />
              {q}
            </label>
          ))}
        </div>
      </Field>

      <button
        onClick={submit}
        disabled={submitting}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "13px",
          borderRadius: 8,
          border: "none",
          background: submitting
            ? "#7a6435"
            : "linear-gradient(135deg, #d4a657 0%, #b8863f 100%)",
          color: "#1a1224",
          fontWeight: 700,
          fontSize: 15,
          fontFamily: "'Inter', sans-serif",
          cursor: submitting ? "default" : "pointer",
          letterSpacing: "0.02em",
        }}
      >
        {submitting ? "Submitting..." : "Submit Request"}
      </button>
    </div>
  );
}

function RegisterPanel({ entries, onRemove, onGenerateChart }) {
  if (entries.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "#7e84a8",
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
        }}
      >
        No requests yet. Submit one from "New Request" to see it listed here.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {entries.map((en) => (
        <div
          key={en.srNo}
          style={{
            background: "rgba(20, 24, 54, 0.55)",
            border: "1px solid #2c2f57",
            borderRadius: 14,
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#7e84a8" }}>
                #{en.srNo} · {en.date}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontFamily: "'Spectral', Georgia, serif",
                  marginTop: 3,
                }}
              >
                {en.title} {en.name}
              </div>
            </div>
            <button
              onClick={() => onRemove(en.srNo)}
              style={{
                background: "transparent",
                border: "1px solid #4a3030",
                color: "#e08a8a",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 16px",
              marginTop: 10,
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              color: "#cfd3ef",
            }}
          >
            <div>DOB: {en.dob}</div>
            <div>Time: {en.birthTime}</div>
            <div>Place: {en.birthPlace}</div>
            <div style={{ color: "#d4a657" }}>{en.question}</div>
          </div>
          <div style={{ marginTop: 12 }}>
            {!en.chart ? (
              <button
                onClick={() => onGenerateChart(en)}
                style={{
                  background: "transparent",
                  border: "1px solid #d4a657",
                  color: "#d4a657",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                }}
              >
                Generate Chart
              </button>
            ) : (
              <pre
                style={{
                  marginTop: 4,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid #2c2f57",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#9aa0c4",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {JSON.stringify(en.chart, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stars() {
  const dots = Array.from({ length: 40 }, (_, i) => ({
    cx: (i * 53) % 100,
    cy: (i * 31) % 100,
    r: (i % 3) * 0.4 + 0.4,
    o: 0.2 + (i % 5) * 0.15,
  }));
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
      preserveAspectRatio="none"
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={`${d.cx}%`}
          cy={`${d.cy}%`}
          r={d.r}
          fill="#f3ead8"
          opacity={d.o}
        />
      ))}
    </svg>
  );
}
