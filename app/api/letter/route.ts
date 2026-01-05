import { NextResponse } from "next/server";

type Profile = {
  name?: string;
  roles?: string;   // e.g. "Father, Husband, Employee — team lead at a small company"
  challenge?: string;
  goal?: string;
  values?: string;
  context?: string;
};

// Keep inputs tidy + safe for prompts
function clean(s: unknown, maxLen = 800): string {
  if (typeof s !== "string") return "";
  return s.trim().replace(/\s+/g, " ").slice(0, maxLen);
}

// Parse a roles string like "Father, Husband, Employee — ..." into up to 5 role labels
function extractRoles(raw: string): string[] {
  if (!raw) return [];
  // Split on commas primarily; also allow semicolons
  const parts = raw
    .split(/[;,]/g)
    .map((p) => p.trim())
    .filter(Boolean);

  // If user wrote "Employee — ...", keep the whole chunk as one role line
  // but still limit total items.
  const roles = parts.slice(0, 5);
  return roles;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const profile: Profile = body?.profile ?? {};

    const name = clean(profile.name, 80) || "Friend";
    const rolesRaw = clean(profile.roles, 400);
    const roles = extractRoles(rolesRaw);
    const challenge = clean(profile.challenge, 700) || "Unknown";
    const goal = clean(profile.goal, 400) || "Unknown";
    const values = clean(profile.values, 400) || "Unknown";
    const context = clean(profile.context, 900) || "Unknown";

    // If roles are empty, we still want a letter that doesn’t feel broken
    const rolesForPrompt =
      roles.length > 0
        ? roles.join(", ")
        : "Worker / professional, person in progress";

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server." },
        { status: 500 }
      );
    }

    const systemPrompt = [
      "You write personal letters in a calm, grounded voice.",
      "Tone: compassionate, steady, practical. Not preachy. No therapy-speak.",
      "",
      "Length: ~5-minute read (roughly 900–1200 words).",
      "Focus on ONE core Stoic lesson that best fits the reader's context.",
      "Do NOT teach multiple lessons. One theme, woven throughout.",
      "",
      "Must include exactly ONE short quote from a Stoic source (Seneca, Epictetus, Marcus Aurelius, Musonius Rufus).",
      "Put the quote on its own line and attribute it simply (e.g., — Seneca).",
      "Do NOT invent precise book/chapter/line citations.",
      "",
      "The reader has multiple life roles. You must address EACH role briefly and specifically, without turning it into a checklist.",
      "Aim for 1–2 sentences per role, woven naturally into the letter.",
      "If one role is 'Employee' or 'Worker', speak with dignity: emphasize professionalism, craftsmanship, reliability, boundaries, and self-respect—never demeaning.",
      "If one role is 'Job seeker' or 'Looking for work', speak with dignity: resilience, process, identity beyond outcomes, and small controllable actions—never shaming.",
      "",
      "Also include 1–2 brief references to helpful ideas/books/authors/philosophies beyond Stoicism ONLY if relevant.",
      "No name-dropping; integrate them naturally in 1–2 sentences each.",
      "You may draw from this pool (choose only what fits):",
      "- Viktor Frankl (meaning & responsibility), James Clear (systems & habits), Cal Newport (attention & depth), Thich Nhat Hanh (presence), Jon Kabat-Zinn (mindfulness), Tara Brach (radical acceptance),",
      "- Carol Dweck (growth mindset), Daniel Kahneman (thinking errors), Annie Duke (decision process), Adam Grant (rethink/learning), Naval Ravikant (calm & leverage),",
      "- James Hollis (purpose & adulthood), Robert Greene (self-mastery), Jocko Willink (ownership & discipline), Brené Brown (courage & vulnerability).",
      "Do not mention more than 2 non-Stoic references total.",
      "",
      "Structure requirements:",
      "1) Short opening acknowledging their situation.",
      "2) State the single guiding principle clearly (not as a labeled 'lesson').",
      "3) Apply it to their context and roles with concrete guidance and examples.",
      "4) End with two labeled sections exactly:",
      "Reflection:",
      "- 3 one-line reflection questions.",
      "Challenge (24 hours):",
      "- One specific practice for the next 24 hours (3–6 lines).",
    ].join("\n");

    const userPrompt = [
      `Write a letter addressed to: ${name}.`,
      "",
      "Context:",
      `Primary roles (max 5): ${rolesForPrompt}`,
      `What they're facing: ${challenge}`,
      `What they want more of: ${goal}`,
      `Their values: ${values}`,
      `Work/life situation: ${context}`,
      "",
      "Remember: one Stoic principle only. Include exactly one Stoic quote. End with Reflection + Challenge (24 hours).",
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "OpenAI request failed",
          status: response.status,
          details: data?.error?.message ?? data,
        },
        { status: 500 }
      );
    }

    const letter: string | undefined = data?.choices?.[0]?.message?.content;

    if (!letter) {
      return NextResponse.json(
        { error: "No letter returned from OpenAI.", raw: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ letter });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
