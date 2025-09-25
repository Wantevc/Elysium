export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const BASE =
  process.env.CRON_SELF_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

// We houden 1 duidelijk target aan (correct met leading slash)
const TARGET = "/api/schedule/run";

// Veilige join: vervangt backslashes en zorgt voor exact één slash
function joinUrl(base: string, path: string) {
  const p = path.replace(/\\/g, "/");
  const b = base.replace(/\/+$/, "");
  return b + (p.startsWith("/") ? p : "/" + p);
}

async function trigger() {
  const url = joinUrl(BASE, TARGET);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "cron" }),
  });
  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { body = text; }
  return { ok: res.ok, status: res.status, url, target: TARGET, body };
}

export async function GET()  { const r = await trigger(); return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } }); }
export async function POST() { const r = await trigger(); return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } }); }