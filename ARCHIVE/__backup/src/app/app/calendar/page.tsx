"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  platform: "fb" | "ig";
  type: "text" | "photo";
  pageId: string;
  scheduledAt: string; // ISO
  status: "scheduled" | "posted" | "failed";
  result?: any;
};

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...init });
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const txt = await r.text();
    throw new Error(`Non-JSON (${r.status}): ${txt.slice(0, 200)}`);
  }
  const j = await r.json();
  if (!r.ok) throw j;
  return j as T;
}

// --------- date utils ----------
const LOCALE = "nl-BE";
const TZ = "Europe/Brussels";

// Voor labels (mens-leesbaar)
function fmt(d: Date, opt: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, ...opt }).format(d);
}
// Voor dag-sleutels: altijd YYYY-MM-DD (stabiel, tz=Brussels)
const keyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function dayKey(d: Date) {
  return keyFmt.format(d); // bv. 2025-09-05
}

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, m: number) { return new Date(d.getFullYear(), d.getMonth() + m, 1); }
function sameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

export default function CalendarPage() {
  // Hooks in vaste volgorde
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cur, setCur] = useState<Date>(startOfMonth(new Date()));
  const [selected, setSelected] = useState<Task | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  async function load() {
    setErr(null);
    try {
      const j = await jfetch<{ ok: boolean; tasks: Task[] }>("/api/schedule/list");
      setTasks(j.tasks);
    } catch (e: any) {
      setErr(e?.error || e?.message || "Kon taken niet laden");
    }
  }
  useEffect(() => { load(); }, []);

  const days: Date[] = useMemo(() => {
    const first = startOfMonth(cur);
    const dow = (first.getDay() + 6) % 7; // maandag start
    const start = new Date(first);
    start.setDate(first.getDate() - dow);
    const out: Date[] = [];
    for (let i=0;i<42;i++){ const d = new Date(start); d.setDate(start.getDate()+i); out.push(d); }
    return out;
  }, [cur]);

  // Groepeer taken per dag-key (YYYY-MM-DD, Brussels)
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const k = keyFmt.format(new Date(t.scheduledAt));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    for (const [, arr] of map) arr.sort((a,b)=>new Date(a.scheduledAt).getTime()-new Date(b.scheduledAt).getTime());
    return map;
  }, [tasks]);

  const monthLabel = fmt(cur, { month: "long", year: "numeric" });

  function chipColor(t: Task) {
    const base = t.platform === "fb" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800";
    const state = t.status === "posted" ? "opacity-100" : t.status === "failed" ? "opacity-100 ring-1 ring-red-400" : "opacity-70";
    return `${base} ${state}`;
  }

  // ---- Drag & Drop helpers ----
  function onDragStartTask(e: React.DragEvent, t: Task) {
    e.dataTransfer.setData("text/plain", t.id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOverDay(e: React.DragEvent, k: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverKey(k);
  }
  function onDragLeaveDay(k: string) {
    setDragOverKey(prev => prev === k ? null : prev);
  }
  async function onDropDay(e: React.DragEvent, date: Date) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDragOverKey(null);
    if (!id) return;
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    // Neem originele tijd (uur/minuut) en combineer met nieuwe dag
    const old = new Date(t.scheduledAt);
    const ymd = dayKey(date); // "YYYY-MM-DD"
    const hh = String(old.getHours()).padStart(2,"0");
    const mm = String(old.getMinutes()).padStart(2,"0");
    const localStr = `${ymd}T${hh}:${mm}`;
    const iso = new Date(localStr).toISOString();

    await jfetch("/api/schedule/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, scheduledAt: iso }),
    });
    await load();
  }

  async function removeTask(id: string) {
    await jfetch("/api/schedule/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSelected(null);
    await load();
  }
  async function runDueNow() { await fetch("/api/schedule/run", { method: "POST" }); await load(); }
  async function refreshList() { await load(); }

  if (!mounted) {
    return (
      <div className="min-h-screen p-6 md:p-10 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Kalender</h1>
            <div className="px-3 py-2 rounded-2xl bg-white shadow text-sm font-medium">Laden…</div>
          </header>
          <section className="p-4 rounded-2xl bg-white shadow text-sm text-gray-500">Bezig met initialiseren…</section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Kalender</h1>
          <div className="flex items-center gap-2">
            <button onClick={()=>setCur(addMonths(cur,-1))} className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">← Vorige</button>
            <div className="px-3 py-2 rounded-2xl bg-white shadow text-sm font-medium">
              <span suppressHydrationWarning>{monthLabel}</span>
            </div>
            <button onClick={()=>setCur(addMonths(cur,1))} className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Volgende →</button>
            <button onClick={()=>setCur(startOfMonth(new Date()))} className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Vandaag</button>
            <a href="/app/scheduler" className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Planner</a>
            <a href="/api/schedule/ical" className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Export iCal</a>
            <button onClick={refreshList} className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Refresh</button>
            <button onClick={runDueNow} className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Run due now</button>
          </div>
        </header>

        {err && <div className="rounded-xl border p-3 text-sm bg-red-50 border-red-200 text-red-800">{err}</div>}

        <section className="p-4 rounded-2xl bg-white shadow">
          <div className="grid grid-cols-7 text-xs text-gray-500 mb-2">
            {["Ma","Di","Wo","Do","Vr","Za","Zo"].map((d)=>(
              <div key={d} className="px-2 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-2xl overflow-hidden">
            {days.map((d, i) => {
              const inMonth = d.getMonth()===cur.getMonth();
              const isToday = sameDay(d, new Date());
              const k = dayKey(d);
              const items = byDay.get(k) || [];
              const highlight = dragOverKey === k ? "ring-2 ring-indigo-400" : "";
              return (
                <div
                  key={i}
                  onDragOver={(e)=>onDragOverDay(e, k)}
                  onDragLeave={()=>onDragLeaveDay(k)}
                  onDrop={(e)=>onDropDay(e, d)}
                  className={`min-h-[120px] bg-white p-2 transition ${inMonth?"":"bg-gray-50 text-gray-400"} ${highlight}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${isToday?"font-bold text-gray-900":""}`}>{d.getDate()}</div>
                    {isToday && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">vandaag</span>}
                  </div>
                  <div className="mt-1 space-y-1">
                    {items.map((t)=> {
                      const timeLabel = fmt(new Date(t.scheduledAt), { hour: "2-digit", minute: "2-digit" });
                      return (
                        <button
                          key={t.id}
                          draggable
                          onDragStart={(e)=>onDragStartTask(e, t)}
                          onClick={()=>setSelected(t)}
                          className={`w-full text-left text-[11px] border px-2 py-1 rounded-lg cursor-move ${chipColor(t)}`}
                          title={`${timeLabel} · ${t.platform.toUpperCase()} · ${t.type} · ${t.status}\nSleep naar een andere dag om te verplaatsen`}
                        >
                          <span suppressHydrationWarning>{timeLabel}</span>
                          {" · "}{t.platform.toUpperCase()}
                          {" · "}{t.type}
                          {" · "}{t.status === "scheduled" ? "⏳" : t.status === "posted" ? "✅" : "❌"}
                        </button>
                      );
                    })}
                    {!items.length && <div className="text-[11px] text-gray-300">—</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-300"></span> FB</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-fuchsia-100 border border-fuchsia-300"></span> IG</span>
            <span className="inline-flex items-center gap-1">⏳ scheduled</span>
            <span className="inline-flex items-center gap-1">✅ posted</span>
            <span className="inline-flex items-center gap-1">❌ failed</span>
          </div>
        </section>

        {/* Detail panel */}
        {selected && (
          <section className="p-4 rounded-2xl bg-white shadow space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Taak details</h2>
              <button onClick={()=>setSelected(null)} className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Sluiten</button>
            </div>
            <div className="text-sm text-gray-700">
              <div><span className="font-medium">ID:</span> {selected.id}</div>
              <div><span className="font-medium">Platform:</span> {selected.platform.toUpperCase()} · {selected.type}</div>
              <div><span className="font-medium">Page:</span> {selected.pageId}</div>
              <div><span className="font-medium">Wanneer:</span>{" "}
                <span suppressHydrationWarning>
                  {fmt(new Date(selected.scheduledAt), { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div><span className="font-medium">Status:</span> {selected.status}</div>
            </div>
            {selected.result && (
              <pre className="text-xs bg-gray-50 border rounded-xl p-3 overflow-auto">{JSON.stringify(selected.result, null, 2)}</pre>
            )}
            <div className="flex items-center gap-2">
              <a href="/app/scheduler" className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Naar Planner</a>
              <button onClick={()=>removeTask(selected.id)} className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Verwijderen</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}