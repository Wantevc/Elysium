// src/app/api/ai/visual/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Simple GET so you can hit it in the browser
export async function GET() {
  return NextResponse.json({ ok: true, method: "GET" });
}

// Simple POST so your fetch test works
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, method: "POST", echo: body });
}