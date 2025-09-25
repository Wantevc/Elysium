export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

function decodeRole(jwt?: string) {
  try {
    if (!jwt) return null;
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    // decode payload zonder externe libs
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    return payload?.role ?? null; // verwacht "service_role"
  } catch {
    return null;
  }
}

export async function GET() {
  const urlSet = !!process.env.SUPABASE_URL;
  const keySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const role = decodeRole(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return NextResponse.json(
    { ok: true, urlSet, keySet, role, bucket: process.env.SUPABASE_BUCKET || "uploads" },
    { headers: { "Cache-Control": "no-store" } }
  );
}