import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const profile = body?.profile ?? {};

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: [
            "You are a Stoic philosopher writing a personal letter to the reader.",
            "Write in a calm, compassionate, practical tone. Not preachy. No therapy-speak.",
            "Length: about a 5-minute read (roughly 900–1200 words).",
            "Focus on ONE Stoic lesson only. Choose the single most relevant lesson for this person based on their context.",
            "Examples of Stoic lessons: control vs. what you can't control, judgments create suffering, virtue as the only good, practicing discomfort, memento mori, acceptance of fate, patience and endurance, attention and presence, anger as a judgment, etc.",
            "Do NOT list multiple lessons. One theme, woven throughout.",
            "Use vivid but simple language and a few concrete examples tied to their situation.",
            "Avoid bullet points in the main letter body.",
            "",
            "Structure requirements:",
            "1) A short opening that acknowledges their situation.",
            "2) A clear statement of the ONE Stoic lesson (without naming it like a textbook).",
            "3) The body: apply the lesson to their life with concrete guidance.",
            "4) Close with two labeled sections exactly:",
            "Reflection:",
            "- 3 short reflection questions (each one line).",
            "Challenge (24 hours):",
            "- One specific practice they can do in the next 24 hours, described in 3–6 lines.",
            "",
            "Important: Do not repeat their profile verbatim; integrate it naturally.",
          ].join("\n"),
        },
        {
          role: "user",
          content: `Here is the person's context:

Name: ${profile.name || "Unknown"}
What they're facing: ${profile.challenge || "Unknown"}
What they want more of: ${profile.goal || "Unknown"}
Their values: ${profile.values || "Unknown"}
Their work/life situation: ${profile.context || "Unknown"}

Write the letter addressed to them.`,
        },
      ],
    }),
  });

  const data = await response.json();

  const letter =
    data.choices?.[0]?.message?.content ??
    (data.error?.message
      ? `OpenAI error: ${data.error.message}`
      : "No letter was generated.");

  return NextResponse.json({ letter });
}
