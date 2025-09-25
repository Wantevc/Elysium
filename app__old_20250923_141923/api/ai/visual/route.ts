// app/api/ai/visual/route.ts
export const runtime = "nodejs";

type Body = { prompt: string; offer: string };

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const { prompt, offer } = (await req.json()) as Body;
    if (!prompt || !offer) {
      return Response.json({ ok: false, error: "prompt en offer zijn verplicht" }, { status: 400 });
    }

    const fullPrompt =
      `${prompt}. Fotorealistisch, hoge kwaliteit, professioneel belicht.` +
      ` (Overlay-tekst in client: "${offer}")`;

    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: fullPrompt,
        size: "1024x1024",
        n: 1, // GEEN response_format (jij kreeg 400 daarop)
      }),
    });

    const raw = await resp.text();
    if (!resp.ok) {
      console.error("OPENAI_FAIL", resp.status, raw);
      return Response.json({ ok: false, error: `OpenAI ${resp.status}: ${raw}` }, { status: 500 });
    }

    let data: any = {};
    try { data = JSON.parse(raw); } catch { /* no-op */ }

    const b64: string | undefined = data?.data?.[0]?.b64_json;
    if (!b64) {
      return Response.json({ ok: false, error: "Geen data[0].b64_json in OpenAI respons", data }, { status: 500 });
    }

    return Response.json({ ok: true, url: `data:image/png;base64,${b64}` });
  } catch (err: any) {
    console.error("ROUTE_FAIL", err);
    return Response.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

// Handige check in de browser: http://localhost:3000/api/ai/visual
export async function GET() {
  return Response.json({ ok: true, ping: "app-router" });
}