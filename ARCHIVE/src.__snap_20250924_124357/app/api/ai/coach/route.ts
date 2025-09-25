// src/app/api/ai/coach/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const userText =
      (messages.filter((m: any) => m?.role === "user").at(-1)?.content as string) || "";

    // Als er een OpenAI key is, gebruik die voor echte antwoorden
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PUBLIC;
    if (apiKey) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // snel & goedkoop; verander gerust
          messages: [
            {
              role: "system",
              content:
                "You are an expert Marketing & Sales Coach. Be concise, actionable, and structure replies in numbered steps with short examples when useful.",
            },
            ...messages.map((m: any) => ({
              role: m.role,
              content: String(m.content ?? ""),
            })),
          ],
          temperature: 0.6,
        }),
      });

      const data = await r.json().catch(() => null);
      if (r.ok && data?.choices?.[0]?.message?.content) {
        return NextResponse.json({ ok: true, reply: data.choices[0].message.content });
      }

      // Als OpenAI faalt → graceful fallback hieronder
      console.warn("AI Coach OpenAI error:", data || (await r.text()));
    }

    // Fallback: variatie i.p.v. steeds hetzelfde
    const ideas = [
      (t: string) =>
        `Quick 3-step plan:
1) Define ICP + pain in 1 line.
2) Offer outcome + timeline in 2 lines.
3) Ask a next step with a date.
Context: "${t}"`,
      (t: string) =>
        `Coach checklist:
- Who exactly are we targeting?
- What painful moment are we solving?
- What's the 1-sentence promise?
Draft your outreach using: Hook → Proof → Ask.
Topic: "${t}"`,
      (t: string) =>
        `Make it concrete:
• Pain: state the before.
• Gain: show the after with a metric.
• Next step: propose a 15-min call this week.
Your note: "${t}"`,
    ];
    const pick = ideas[Math.floor(Math.random() * ideas.length)];
    return NextResponse.json({ ok: true, reply: pick(userText) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "coach_error" }, { status: 500 });
  }
}
