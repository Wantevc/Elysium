export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const TARGET_PATH = "/api/schedule/run"; // ← ZET HIER JOUW ÉCHTE PAD

async function forward(method: "GET" | "POST") {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL(TARGET_PATH, base);
  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify({ source: "bridge" }) : undefined,
  });
  const body = await res.text();
  return NextResponse.json(
    { ok: res.ok, status: res.status, target: TARGET_PATH, body },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET()  { return forward("GET"); }
export async function POST() { return forward("POST"); }
