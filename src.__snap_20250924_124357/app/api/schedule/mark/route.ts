import { NextResponse } from "next/server";
import { updateTask } from "../_store";

export async function POST(req: Request) {
  try {
    const { id, status, result } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 });
    }
    const t = await updateTask(id, { status, result });
    if (!t) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, task: t });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
