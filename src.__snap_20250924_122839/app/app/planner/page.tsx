"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/** =========================================================
 *  Minimal UI helpers (geen extra libs)
 *  =======================================================*/
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border bg-white shadow-sm", className)}>{children}</div>;
}
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid"|"outline"|"ghost" }) {
  const { className, variant="solid", ...rest } = props;
  const base = "inline-flex items-center justify-center rounded-lg text-sm px-3 py-2 transition";
  const styles = variant==="solid" ? "bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
    : variant==="outline" ? "border hover:bg-neutral-50 disabled:opacity-50"
    : "hover:bg-neutral-100 disabled:opacity-50";
  return <button {...rest} className={cx(base, styles, className)} />;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300", props.className)} />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx("w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300", props.className)} />;
}
function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-3">
      <div className="text-lg font-semibold">{title}</div>
      {desc ? <div className="text-sm text-neutral-500">{desc}</div> : null}
    </div>
  );
}
function Badge({ children, tone="neutral" }: { children: React.ReactNode; tone?: "neutral"|"green"|"red"|"amber" }) {
  const m = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
  } as const;
  return <span className={cx("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", m[tone])}>{children}</span>;
}

/** =========================================================
 *  Helpers
 *  =======================================================*/
type Platform = "fb" | "ig";
type TaskType = "text" | "photo";
type TaskStatus = "queued" | "scheduled" | "posted" | "failed";

type Task = {
  id: string;
  platform: Platform;
  type: TaskType;
  pageId: string;
  scheduledAt: string;
  status: TaskStatus;
  message?: string;
  caption?: string;
  imageUrl?: string;
  pageToken?: string;
  result?: any;
  error?: any;
  createdAt?: string;
};

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...init });
  const ct = r.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await r.json() : await r.text();
  if (!r.ok) throw (isJson ? data : new Error(String(data)));
  return (data as unknown) as T;
}
function fmt(input?: string | number | Date) {
  if (!input) return "-";
  const d = new Date(input);
  if (isNaN(+d)) return "-";
  const pad = (n:number)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** =========================================================
 *  PlannerPage — Clean slate
 *  =======================================================*/
export default function PlannerPage() {
  /** ---------- Page linkage (uit localStorage) ---------- */
  const [pageId, setPageId] = useState("");
  const [pageName, setPageName] = useState("");
  useEffect(() => {
    try {
      const id = localStorage.getItem("page.id") || "";
      const name = localStorage.getItem("page.name") || "";
      if (id) setPageId(id);
      if (name) setPageName(name);
    } catch {}
  }, []);
  const havePage = !!pageId;

  /** ---------- Compose state ---------- */
  type Target = "fb" | "ig" | "all";
  type FbVariant = "text" | "photo" | "photo+text";
  const [target, setTarget] = useState<Target>("fb");
  const [fbVariant, setFbVariant] = useState<FbVariant>("text");
  const [message, setMessage] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [when, setWhen] = useState(() => {
    const d = new Date(Date.now()+5*60*1000);
    d.setSeconds(0); d.setMilliseconds(0);
    const pad=(n:number)=>String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  /** ---------- Queue ---------- */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task|null>(null);
  const [autoDispatch, setAutoDispatch] = useState<boolean>(() => {
    try { return localStorage.getItem("planner.autoDispatch")==="1"; } catch { return false; }
  });
  const [showHowTo, setShowHowTo] = useState(true);
  const [filter, setFilter] = useState<""|TaskStatus>("");

  async function loadTasks() {
    try {
      setLoading(true);
      const j = await jfetch<{ ok: boolean; tasks: Task[] }>("/api/schedule/list");
      setTasks(Array.isArray(j.tasks) ? j.tasks : []);
    } catch (e:any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadTasks(); }, []);

  /** ---------- Auto-dispatch (POST) ---------- */
  useEffect(() => {
    let stop = false;
    let id: number|undefined;
    async function tick() {
      try { await fetch("/api/schedule/dispatch-due", { method: "POST", cache: "no-store" }); } catch {}
      await loadTasks();
      if (!stop && autoDispatch) id = window.setTimeout(tick, 15000);
    }
    if (autoDispatch) {
      const first = window.setTimeout(tick, 3000);
      return () => { stop = true; window.clearTimeout(first); if (id) window.clearTimeout(id); };
    }
    return () => { stop = true; if (id) window.clearTimeout(id); };
  }, [autoDispatch]);

  /** ---------- Derived ---------- */
  const needFbText =
    (target==="fb" && fbVariant==="text") ||
    (target==="all" && ["text","photo+text"].includes(fbVariant));
  const needFbPhoto =
    (target==="fb" && (fbVariant==="photo" || fbVariant==="photo+text")) ||
    (target==="all" && ["photo","photo+text"].includes(fbVariant));
  const needIgPhoto = target==="ig" || target==="all";

  const canSchedule = useMemo(() => {
    if (!havePage) return false;
    if (needFbText && !message.trim()) return false;
    if ((needFbPhoto || needIgPhoto) && !imageUrl.trim()) return false;
    return true;
  }, [havePage, needFbText, needFbPhoto, needIgPhoto, message, imageUrl]);

  /** ---------- Actions ---------- */
  async function schedule() {
    setErr(null);
    try {
      if (!canSchedule) { setErr("Vul de verplichte velden in."); return; }
      const token = (typeof window!=="undefined" ? localStorage.getItem("page.token") : null) || "";
      if (!token) { setErr("Geen page.token. Ga naar /app/connect → ‘Get Page token’."); return; }

      const iso = new Date(when.replace(" ","T")).toISOString();

      const toCreate: Array<{platform:Platform; type:TaskType; message?:string; caption?:string; imageUrl?:string}> = [];
      if (target==="fb" || target==="all") {
        if (fbVariant==="text") {
          toCreate.push({ platform:"fb", type:"text", message });
        } else {
          toCreate.push({ platform:"fb", type:"photo", caption: caption || message, imageUrl });
        }
      }
      if (target==="ig" || target==="all") {
        toCreate.push({ platform:"ig", type:"photo", caption, imageUrl });
      }
      if (!toCreate.length) { setErr("Geen geldige combinatie om te plannen."); return; }

      // Maak taken 1 voor 1
      for (const p of toCreate) {
        await jfetch<{ ok: boolean; task: Task; error?: string }>("/api/schedule/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: p.platform,
            type: p.type,
            pageId,
            scheduledAt: iso,
            status: "scheduled",
            message: p.message,
            caption: p.caption,
            imageUrl: p.imageUrl,
            pageToken: token,
          }),
        });
      }
      await loadTasks();
    } catch (e:any) {
      setErr(String(e?.message || e));
    }
  }

  async function runDispatcher() {
    try {
      await fetch("/api/schedule/dispatch-due", { method: "POST", cache: "no-store" });
      await loadTasks();
    } catch (e:any) {
      setErr(String(e?.message || e));
    }
  }

  async function removeTask(id: string) {
    try {
      await jfetch("/api/schedule/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await loadTasks();
    } catch (e:any) {
      setErr(String(e?.message || e));
    }
  }

  function openDetails(t: Task) { setDetailTask(t); setDetailOpen(true); }

  const filtered = useMemo(() => {
    return (tasks || [])
      .filter(t => (filter ? t.status===filter : true))
      .sort((a,b)=> new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [tasks, filter]);

  /** ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planner</h1>
          <p className="text-sm text-neutral-500">Plan posts naar Facebook en Instagram. Simpel, betrouwbaar.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{havePage ? `Page: ${pageName || pageId}` : "No page linked"}</span>
          <a className="text-sm text-neutral-500 hover:underline" href="/api/auth/signout">Sign out</a>
        </div>
      </div>

      {/* How to plan */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <SectionTitle title="How to plan" desc="Korte uitleg voor nieuwe gebruikers." />
            <button
              type="button"
              onClick={() => setShowHowTo(v => !v)}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              {showHowTo ? "Verberg" : "Toon"}
            </button>
          </div>
          {showHowTo && (
            <ol className="list-decimal pl-5 text-sm text-neutral-700 space-y-1">
              <li>Koppel je Page bij <a className="underline" href="/app/connect">Connect</a> → haal <strong>Page token</strong> op.</li>
              <li>Kies platform: Facebook / Instagram / All.</li>
              <li>Voor Facebook: kies <strong>Text</strong> of <strong>Photo</strong> (Photo gebruikt caption).</li>
              <li>Voor Instagram: alleen <strong>Photo</strong> met caption.</li>
              <li>Plak een <strong>Image URL</strong> (voor photo) en/of vul tekst/caption in.</li>
              <li>Kies datum & tijd en klik <strong>Schedule</strong>.</li>
              <li>Gebruik <strong>Run dispatcher</strong> of zet <strong>Auto-dispatch</strong> aan.</li>
              <li>Open <strong>Details</strong> in de Queue om resultaat of fout te zien.</li>
            </ol>
          )}
        </div>
      </Card>

      {/* Compose */}
      <Card>
        <div className="p-5 space-y-6">
          <SectionTitle title="Compose" desc="Stel je post samen en plan in." />

          {/* Page + time */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="text-sm">
                <span className="text-neutral-500">Page:</span>{" "}
                <span className="font-medium">{havePage ? (pageName || "Gekoppeld") : "Niet gekoppeld – ga naar /app/connect"}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Datum & tijd</label>
              <Input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} />
            </div>
          </div>

          {/* Targets */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium mb-1">Platform</div>
              <div className="flex flex-wrap gap-3 text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="target" checked={target==="fb"} onChange={()=>setTarget("fb")} /> Facebook
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="target" checked={target==="ig"} onChange={()=>setTarget("ig")} /> Instagram
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="target" checked={target==="all"} onChange={()=>setTarget("all")} /> All
                </label>
              </div>
            </div>
            {(target==="fb" || target==="all") && (
              <div>
                <div className="text-sm font-medium mb-1">Facebook inhoud</div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="fbv" checked={fbVariant==="text"} onChange={()=>setFbVariant("text")} /> Alleen tekst
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="fbv" checked={fbVariant==="photo"} onChange={()=>setFbVariant("photo")} /> Alleen afbeelding
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="fbv" checked={fbVariant==="photo+text"} onChange={()=>setFbVariant("photo+text")} /> Afbeelding + tekst
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Fields */}
          {((target==="fb" && fbVariant!=="photo") || (target==="all" && ["text","photo+text"].includes(fbVariant))) && (
            <div>
              <div className="mb-1 text-sm font-medium">Bericht (FB)</div>
              <Textarea rows={5} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Je bericht…" />
            </div>
          )}

          {(target==="ig" || target==="all" || (target==="fb" && fbVariant!=="text")) && (
            <div>
              <div className="mb-1 text-sm font-medium">Caption (IG of FB bij photo)</div>
              <Textarea rows={4} value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Je caption…" />
            </div>
          )}

          {(target==="ig" || target==="all" || (target==="fb" && fbVariant!=="text")) && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Image URL</div>
              <Input placeholder="https://…" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
              {!!imageUrl && <img src={imageUrl} alt="preview" className="rounded-xl border max-h-72 object-contain w-full bg-neutral-100" />}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={schedule} disabled={!canSchedule || !havePage}>Schedule</Button>
            <Button variant="outline" onClick={runDispatcher}>Run dispatcher</Button>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={autoDispatch} onChange={(e)=>{ const v=e.target.checked; setAutoDispatch(v); try { localStorage.setItem("planner.autoDispatch", v?"1":"0"); } catch {} }} />
              Auto-dispatch elke ~15s
            </label>
            <Button variant="ghost" onClick={()=>{
              const d=new Date(); d.setMinutes(d.getMinutes()+1); d.setSeconds(0); d.setMilliseconds(0);
              const pad=(n:number)=>String(n).padStart(2,"0");
              setWhen(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
            }}>+1 min</Button>

            {err && <div className="text-sm text-red-600">{err}</div>}
          </div>
        </div>
      </Card>

      {/* Queue */}
      <Card>
        <div className="border-b p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SectionTitle title="Queue" desc="Geplande taken met filters en acties." />
            <div className="flex items-center gap-2">
              <select className="rounded-lg border px-2 py-2 text-sm" value={filter} onChange={e=>setFilter(e.target.value as any)}>
                <option value="">Status: alle</option>
                <option value="scheduled">Scheduled</option>
                <option value="queued">Queued</option>
                <option value="posted">Posted</option>
                <option value="failed">Failed</option>
              </select>
              <Button variant="outline" onClick={loadTasks} disabled={loading}>{loading?"Laden…":"Refresh"}</Button>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-neutral-500">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Platform</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Message</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 && (
                <tr><td colSpan={6} className="py-8 text-center text-neutral-500">Geen taken.</td></tr>
              )}
              {filtered.map((t, i)=>(
                <tr key={`${t.id}-${i}`} className="border-b align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{fmt(t.scheduledAt)}</td>
                  <td className="py-2 pr-3 uppercase">{t.platform}</td>
                  <td className="py-2 pr-3">{t.type}</td>
                  <td className="py-2 pr-3 max-w-[420px]">
                    <div className="line-clamp-3 break-words text-neutral-800">{t.message || t.caption || t.imageUrl || "-"}</div>
                  </td>
                  <td className="py-2 pr-3">
                    {t.status==="posted" && <Badge tone="green">posted</Badge>}
                    {t.status==="failed" && <Badge tone="red">failed</Badge>}
                    {t.status==="scheduled" && <Badge tone="amber">scheduled</Badge>}
                    {t.status==="queued" && <Badge>queued</Badge>}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={()=>{ setDetailTask(t); setDetailOpen(true); }}>Details</Button>
                      <Button variant="outline" onClick={()=>removeTask(t.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details modal */}
      {detailOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetailOpen(false)} />
          <div className="absolute left-1/2 top-10 w-[min(900px,92vw)] -translate-x-1/2 rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div className="text-base font-semibold">Task details{detailTask?.id ? ` – ${detailTask.id}` : ""}</div>
              <button className="rounded-md p-2 hover:bg-neutral-100" onClick={()=>setDetailOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              {!detailTask ? (
                <div className="text-sm text-neutral-500">Geen gegevens.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase text-neutral-500">Meta</div>
                      <div className="rounded-lg border p-3 text-sm">
                        <div><span className="font-medium">Time:</span> {fmt(detailTask.scheduledAt)}</div>
                        <div><span className="font-medium">Platform:</span> {detailTask.platform.toUpperCase()}</div>
                        <div><span className="font-medium">Type:</span> {detailTask.type}</div>
                        <div><span className="font-medium">Status:</span> {detailTask.status}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-neutral-500">Message</div>
                      <div className="rounded-lg border p-3 text-sm whitespace-pre-wrap break-words">
                        {detailTask.message || detailTask.caption || "-"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase text-neutral-500">Result / Error (JSON)</div>
                    <div className="rounded-lg border p-3 text-xs">
                      <pre className="overflow-auto">{JSON.stringify(detailTask.result ?? detailTask.error ?? {}, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}