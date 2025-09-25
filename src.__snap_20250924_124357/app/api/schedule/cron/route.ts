export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

function ok(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function forbidden(msg = "Forbidden") {
  return ok({ ok: false, error: msg }, 403);
}

function getSecretFrom(req: Request) {
  const url = new URL(req.url);
  const fromHeader = req.headers.get("x-cron") || "";
  const fromQuery = url.searchParams.get("secret") || "";
  return fromHeader || fromQuery;
}

export async function POST(req: Request) {
  const expected = process.env.SCHEDULE_SECRET || "";
  const provided = getSecretFrom(req);
  if (!expected || provided !== expected) {
    return forbidden("Invalid or missing secret");
  }

  // roep de bestaande /api/schedule/run aan (POST)
  const origin = new URL(req.url).origin;
  const r = await fetch(`${origin}/api/schedule/run`, { method: "POST", cache: "no-store" });
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await r.text();
    return ok({ ok: false, step: "proxy", status: r.status, text });
  }
  const json = await r.json().catch(() => ({}));
  return ok({ ok: true, proxied: true, status: r.status, result: json });
}

// optioneel handig om in browser te testen
export async function GET(req: Request) {
  const expected = process.env.SCHEDULE_SECRET || "";
  const provided = getSecretFrom(req);
  if (!expected) return ok({ ok: false, error: "No SCHEDULE_SECRET set" }, 500);
  if (provided !== expected) return forbidden("Invalid or missing secret");
  return ok({ ok: true, ready: true });
}
