import React, { useEffect, useState } from "react";

const BRAND = { primary: "#0f9187", primaryDark: "#0b2d3a", accent: "#f39c12", bg: "#0b2d3a" };

// Replace with your actual question set
const SEED_QUESTIONS = [ /* ... your questions ... */ ];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickTenProgressive(bank) {
  const by = {};
  bank.forEach(q => { (by[q.difficulty] ||= []).push(q); });
  const plan = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5];
  const picked = [];
  for (const d of plan) {
    const pool = by[d] || [];
    if (pool.length) {
      picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    } else {
      const rest = bank.filter(q => !picked.includes(q));
      if (rest.length) picked.push(rest[Math.floor(Math.random() * rest.length)]);
    }
  }
  return picked;
}

function makeBlobs(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `b${i}`,
    x: Math.random() * 70 + 10,
    y: Math.random() * 70 + 10,
    r: Math.random() * 10 + 8,
    alpha: 0.85
  }));
}

function validateBank(arr) {
  if (!Array.isArray(arr)) throw new Error("Bank must be an array");
  arr.forEach((q, i) => {
    if (!q || !q.prompt || !Array.isArray(q.choices) || typeof q.answerIndex !== "number") {
      throw new Error(`Question ${i} malformed`);
    }
  });
}

function runSelfTests() {
  try {
    validateBank(SEED_QUESTIONS);
    const s = pickTenProgressive(SEED_QUESTIONS);
    console.assert(s.length === 10, "Expected 10 questions");
  } catch (e) {
    console.warn("Self‑test:", e);
  }
}

export default function FluitecVarnishCleaner() {
  useEffect(() => { runSelfTests(); }, []);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminText, setAdminText] = useState("");
  const [bank, setBank] = useState(() => SEED_QUESTIONS);
  const [series, setSeries] = useState(() => pickTenProgressive(SEED_QUESTIONS));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [blobs, setBlobs] = useState(() => makeBlobs(100)); // 100 blobs at start for full coverage
  const [choices, setChoices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const q = series[round];

  useEffect(() => {
    if (!q) return;
    setChoices(shuffle(q.choices.map((label, idx) => ({ label, idx }))));
    setFeedback(null);
    setSelectedIdx(null);
  }, [round, series]);

  useEffect(() => {
    const onKey = e => { if (e.key && e.key.toLowerCase() === "a") setAdminOpen(v => !v); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function answer(idx) {
    if (!q || feedback) return;
    const correct = idx === q.answerIndex;
    setSelectedIdx(idx);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setScore(s => s + 1);
      // remove exactly 1/10th of starting blobs each correct answer
      setBlobs(bs => bs.slice(0, bs.length - Math.floor(100 / 10)));
    }
    setTimeout(() => setRound(r => r + 1), 2000);
  }

  function restart() {
    setSeries(pickTenProgressive(bank));
    setBlobs(makeBlobs(100));
    setRound(0);
    setScore(0);
    setFeedback(null);
    setSelectedIdx(null);
  }

  function importJSON() {
    try {
      const arr = JSON.parse(adminText);
      validateBank(arr);
      setBank(arr);
      setSeries(pickTenProgressive(arr));
      setAdminOpen(false);
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  }

  const correctLabel = q ? q.choices[q.answerIndex] : null;

  return (
    <div className="min-h-screen" style={{ background: BRAND.bg }}>
      {/* Rest of JSX remains unchanged; blobs.map(...) will render goo over metal */}
    </div>
  );
}
