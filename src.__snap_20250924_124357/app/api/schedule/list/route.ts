// src/app/api/schedule/list/route.ts
import { NextResponse } from "next/server";
import { getTasks } from "../../../../lib/taskStore";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(JSON.stringify({ ok: true, tasks: getTasks() }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
