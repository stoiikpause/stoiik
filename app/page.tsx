"use client";

import { useState } from "react";

export default function Home() {
  const [letter, setLetter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateLetter() {
    setLoading(true);
    setLetter(null);

    const res = await fetch("/api/letter", {
      method: "POST",
    });

    const data = await res.json();
    setLetter(data.letter);
    setLoading(false);
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 720 }}>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>Stoik Pause</h1>

      <p style={{ fontSize: 18, lineHeight: 1.5 }}>
        A web-based meditation guide that writes personalized Stoic letters
        based on your life and what you’re facing today.
      </p>

      <button
        onClick={generateLetter}
        disabled={loading}
        style={{
          marginTop: 24,
          padding: "12px 20px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        {loading ? "Writing..." : "Generate Stoic Letter"}
      </button>

      {letter && (
        <div
          style={{
            marginTop: 32,
            padding: 20,
            background: "#f5f5f5",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
          }}
        >
          {letter}
        </div>
      )}
    </main>
  );
}
