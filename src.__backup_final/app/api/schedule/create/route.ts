import { NextRequest, NextResponse } from "next/server";
import { addTask, Task } from "@/lib/taskStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const required = ["platform", "type", "pageId", "scheduledAt"];
    for (const k of required) if (!b?.[k]) return NextResponse.json({ ok: false, error: `Missing ${k}` }, { status: 400 });

    const id = crypto.randomUUID();
    const t: Task = {
      id,
      platform: b.platform,
      type: b.type,
      pageId: b.pageId,
      scheduledAt: b.scheduledAt,
      status: (b.status || "scheduled") as any,
      message: b.message || "",
      caption: b.caption || b.message || "",
      imageUrl: b.imageUrl || "",
      pageToken: b.pageToken || "",
      createdAt: new Date().toISOString(),
      result: null,
      error: null,
    };

    addTask(t);
    return NextResponse.json({ ok: true, task: t }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}