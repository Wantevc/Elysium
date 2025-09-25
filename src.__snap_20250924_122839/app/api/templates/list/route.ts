export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readTemplates } from "../_store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const platform = url.searchParams.get("platform"); // "fb" | "ig" | "any"
  const type = url.searchParams.get("type");         // "text" | "photo"

  let templates = await readTemplates();
  if (platform && platform !== "any") {
    templates = templates.filter(t => t.platform === platform || t.platform === "any");
  }
  if (type) {
    templates = templates.filter(t => t.type === type);
  }

  return NextResponse.json(
    { ok: true, templates },
    { headers: { "Cache-Control": "no-store" } }
  );
}