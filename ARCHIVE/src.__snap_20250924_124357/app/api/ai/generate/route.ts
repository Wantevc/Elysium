import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// TODO: vervang door jouw echte OpenAI-calls
async function generateText(prompt: string) {
  return { text: `Auto-gegenereerde copy: ${prompt}` };
}
async function generateImage(prompt: string, size = "1024x1024") {
  return { url: `https://via.placeholder.com/1024?text=${encodeURIComponent(prompt)}` };
}

export async function POST(req: NextRequest) {
  try {
    const { kind, prompt, size } = await req.json();
    if (!kind || !prompt) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });

    const out = kind === "text" ? await generateText(prompt) : await generateImage(prompt, size);
    // ⚠️ Server-side credit aftrek kun je later hier toevoegen
    return NextResponse.json({ ok: true, ...out });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
