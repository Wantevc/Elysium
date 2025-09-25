// src/app/api/schedule/run/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/** ===== Helpers ===== */
const BASE =
  process.env.CRON_SELF_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

function j(url: string) {
  return url.startsWith("http") ? url : BASE.replace(/\/+$/, "") + (url.startsWith("/") ? url : "/" + url);
}

async function getJSON<T = any>(url: string): Promise<T> {
  const res = await fetch(j(url), { headers: { "Cache-Control": "no-store" } });
  const txt = await res.text();
  let body: any;
  try { body = JSON.parse(txt); } catch { body = txt; }
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${typeof body === "string" ? body.slice(0,200) : JSON.stringify(body).slice(0,200)}`);
  return body as T;
}

async function postJSON<T = any>(url: string, data: any): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(j(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
  const txt = await res.text();
  let body: any;
  try { body = JSON.parse(txt); } catch { body = txt; }
  return { ok: res.ok, status: res.status, body };
}

/** ===== Types (losjes) ===== */
type Task = {
  id: string;
  status: "scheduled" | "queued" | "posted" | "failed";
  scheduledAt: string;
  platform: "fb" | "ig";
  type: "text" | "photo" | "photo+text";
  pageId?: string;
  message?: string;   // FB text
  caption?: string;   // soms tekst onder foto
  imageUrl?: string;  // voor foto-posts (nu overslaan)
};

/** ===== Kern: 1 taak verwerken ===== */
async function processOne(task: Task) {
  const details: any = { id: task.id, platform: task.platform, type: task.type, action: "skip" as "skip" | "posted" | "failed", note: "" };

  // Alleen due (dubbelcheck: scheduler filtert dit ook al)
  const due = +new Date(task.scheduledAt) <= Date.now() + 1000;
  if (!due) { details.note = "not due"; return details; }

  // Minimale ondersteuning: FB tekst
  if (task.platform === "fb") {
    const text = (task.message || task.caption || "").trim();
    if (task.type === "text" && text && task.pageId) {
      // POST /api/meta/post_text { pageId, message }
      const r = await postJSON("/api/meta/post_text", { pageId: task.pageId, message: text });
      if (r.ok && r.body?.ok) {
        details.action = "posted";
        details.note = "fb text posted";
        details.permalink = r.body?.permalink;
        // Markeren als 'posted' als endpoint bestaat, anders proberen delete, anders negeren.
        const mark = await postJSON("/api/schedule/mark", { id: task.id, status: "posted", result: r.body });
        if (!mark.ok || mark.status === 404) {
          // fallback: delete
          await fetch(j(`/api/schedule/delete?id=${encodeURIComponent(task.id)}`), { method: "POST" }).catch(()=>{});
        }
        return details;
      } else {
        details.action = "failed";
        details.note = `fb text failed: ${r.status} ${(r.body?.error || "").toString().slice(0,120)}`;
        // markeer als failed als mogelijk
        await postJSON("/api/schedule/mark", { id: task.id, status: "failed", result: r.body }).catch(()=>{});
        return details;
      }
    }

    // FB met foto? (nu nog niet ondersteund omdat endpoint onbekend is)
    if (task.type !== "text") {
      details.note = "fb photo/combination not yet supported by cron";
      return details;
    }

    if (!text) { details.note = "missing text"; return details; }
    if (!task.pageId) { details.note = "missing pageId"; return details; }
  }

  // Instagram nu niet automatisch posten (alleen gepland): ontbrekende endpoint
  if (task.platform === "ig") {
    details.note = "ig not handled by cron yet";
    return details;
  }

  details.note = "unknown platform/type";
  return details;
}

/** ===== Handler ===== */
export async function POST() {
  const startedAt = new Date().toISOString();

  // 1) Haal takenlijst op
  let list: any;
  try {
    list = await getJSON<{ tasks: Task[] }>("/api/schedule/list");
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "list_failed", message: String(e?.message || e) }, { status: 200 });
  }
  const tasks: Task[] = Array.isArray(list?.tasks) ? list.tasks : [];

  // 2) Filter due
  const due = tasks.filter(t =>
    (t.status === "scheduled" || t.status === "queued") &&
    +new Date(t.scheduledAt) <= Date.now() + 1000
  );

  // 3) Verwerk sequentieel (rustig aan, minder kans op rate limits)
  const results: any[] = [];
  for (const t of due) {
    try {
      const r = await processOne(t);
      results.push(r);
    } catch (e: any) {
      results.push({ id: t.id, action: "failed", note: String(e?.message || e) });
      await postJSON("/api/schedule/mark", { id: t.id, status: "failed", result: { error: String(e?.message || e) } }).catch(()=>{});
    }
  }

  // 4) Samenvatting
  const summary = {
    ok: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    counts: {
      total: tasks.length,
      due: due.length,
      posted: results.filter(r => r.action === "posted").length,
      failed: results.filter(r => r.action === "failed").length,
      skipped: results.filter(r => r.action === "skip").length,
    },
    results,
  };

  return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
}

export async function GET() { return POST(); }