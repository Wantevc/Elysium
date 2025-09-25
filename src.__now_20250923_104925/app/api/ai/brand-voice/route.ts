import { NextResponse } from "next/server";

// Zorg dat dit niet gecached wordt en op de server draait
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Body veilig parsen (voorkomt "Unexpected token <" bij HTML errors)
    const raw = await req.text();
    let body: any = {};
    try { body = JSON.parse(raw || "{}"); }
    catch {
      return NextResponse.json({ ok: false, error: "Body was not JSON", bodyRaw: raw }, { status: 400 });
    }

    const { kind, input } = body;
    if (!kind || !input?.product || !input?.themes) {
      return NextResponse.json({ ok: false, error: "Missing fields: kind, input.product, input.themes" }, { status: 400 });
    }

    // Mock data per soort generatie — werkt zonder OpenAI
    if (kind === "templates") {
      return NextResponse.json({
        ok: true,
        data: {
          templates: [
            { title: "Launch Post", body: `Intro over ${input.product}. Emoties: ${input.themes}.` },
            { title: "Value Post",  body: `Waarom ${input.product} uniek is. ${input.extra || ""}` },
            { title: "UGC Prompt",  body: "Vraag om foto/review te delen. Tag ons." },
            { title: "How-to Post", body: `Zo gebruik je ${input.product}.` },
            { title: "Social Proof",body: "Quote van klant + kort verhaal." },
          ],
        },
      });
    }

    if (kind === "caption") {
      return NextResponse.json({
        ok: true,
        data: { caption: `🎯 ${input.product}: ${input.themes}. ${input.extra || ""} ➜ Meer info op onze site.` },
      });
    }

    if (kind === "slogan") {
      return NextResponse.json({
        ok: true,
        data: { slogan: `${input.product}: made to matter.` },
      });
    }

    if (kind === "hashtags") {
      return NextResponse.json({
        ok: true,
        data: { hashtags: ["#brand", "#marketing", "#new", "#quality", "#community"] },
      });
    }

    return NextResponse.json({ ok: false, error: "Unknown kind" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

// Blokkeer GET zodat Next geen HTML 404 teruggeeft
export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST" }, { status: 405 });
}