import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

async function ai(system: string, user: string) {
  const apiKey = process.env.OPENAI_API_KEY!;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [{ role: "system", content: system }, { role: "user", content: user }]
    })
  });
  const j = await r.json();
  const content = j?.choices?.[0]?.message?.content || "";
  return content;
}

export async function POST(req: NextRequest) {
  try {
    const { product, goal, promos, platforms, cadence = "standard", weeks = 4, voiceProfile } = await req.json();
    if (!product || !goal || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ ok:false, error:"Missing product/goal/platforms" }, { status:400 });
    }

    const sys = `
Je bent een senior performance-marketeer. Bouw een 4-weeks campagnelijn die verkoopt, met heldere copy, concrete CTA’s en visuele aanwijzingen. Gebruik AIDA/PAS en varieer hooks.
Schrijf beknopt, concreet, zonder fluff. Output ALLEEN geldige JSON.
JSON schema:
{
  "meta": { "product": string, "goal": "Sales"|"Leads"|"Visits"|"Reach", "platforms": string[], "cadence": "lite"|"standard"|"pro", "weeks": number },
  "weeks": [
    {
      "week": number,
      "theme": string,
      "persona": string,
      "angle": string,
      "posts": [
        { "platform": string, "type": "feed", "title": string, "caption": string, "cta": string, "hashtags": string[], "visualIdea": string, "suggestedTimes": string[] }
      ],
      "stories": [
        { "platform": string, "prompt": string, "cta": string }
      ]
    }
  ]
}
Max 12 feed posts + 8 stories in totaal voor "standard". Gebruik NL.
${voiceProfile ? `Hanteer deze merkstijl: ${JSON.stringify(voiceProfile)}` : ""}
    `.trim();

    const user = `
Product/Service: ${product}
Doel: ${goal}
Promoties/extra's: ${promos || "Geen"}
Platforms: ${platforms.join(", ")}
Cadans: ${cadence} (lite=2 feed +2 stories / standard=3+2 / pro=4+3 per week)
Weken: ${weeks}
    `.trim();

    const content = await ai(sys, user);
    const jsonText = content.replace(/^```json/g, "").replace(/^```/g, "").replace(/```$/g, "");
    const data = JSON.parse(jsonText);

    if (!data?.weeks || !Array.isArray(data.weeks) || data.weeks.length === 0) {
      return NextResponse.json({ ok:false, error:"AI output missing weeks", raw: data }, { status: 500 });
    }

    for (const w of data.weeks) {
      for (const p of (w.posts||[])) {
        p.caption = String(p.caption||"").trim();
        p.cta = String(p.cta||"").trim();
        p.hashtags = Array.from(new Set((p.hashtags||[]).map((t:string)=>t.trim()).filter(Boolean)));
        p.visualIdea = String(p.visualIdea||"").trim();
      }
      for (const s of (w.stories||[])) {
        s.prompt = String(s.prompt||"").trim();
        s.cta = String(s.cta||"").trim();
      }
    }

    return NextResponse.json({ ok:true, plan: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 });
  }
}