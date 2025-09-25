import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, size = "1024x1024", style = "natural" } = await req.json();
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY ontbreekt" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ ok: false, error: "prompt is verplicht" }, { status: 400 });
    }

    // Belangrijk: GEEN response_format meesturen (sommige modellen/versies kennen dit niet)
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",      // eventueel "dall-e-3" als jouw key dat vereist
        prompt,
        size,
        n: 1,
        // quality: "high",        // optioneel, indien ondersteund
        // style,                  // sommige tenants negeren dit veld; onschadelijk
      }),
    });

    const text = await r.text();
    let j: any;
    try { j = JSON.parse(text); } catch { 
      return NextResponse.json({ ok:false, error:`Image API parse failed: ${text.slice(0,200)}`}, { status: r.status || 500 });
    }
    if (!r.ok) {
      const msg = j?.error?.message || `image api failed (${r.status})`;
      return NextResponse.json({ ok: false, error: msg }, { status: r.status });
    }

    // 1) Base64 direct?
    const b64 = j?.data?.[0]?.b64_json as string | undefined;
    if (b64) {
      return NextResponse.json({ ok: true, url: `data:image/png;base64,${b64}` });
    }

    // 2) Of enkel een URL → download server-side en converteer naar dataURL
    const url = j?.data?.[0]?.url as string | undefined;
    if (url) {
      const imgResp = await fetch(url);
      if (!imgResp.ok) return NextResponse.json({ ok:false, error:"Kon image-URL niet fetchen" }, { status: 502 });
      const buf = Buffer.from(await imgResp.arrayBuffer());
      const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
      return NextResponse.json({ ok: true, url: dataUrl });
    }

    return NextResponse.json({ ok: false, error: "Geen image data ontvangen" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}