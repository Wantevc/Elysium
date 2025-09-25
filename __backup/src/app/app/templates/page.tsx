"use client";
import React, { useEffect, useMemo, useState } from "react";

type Template = {
  id: string;
  name: string;
  platform: "fb" | "ig" | "any";
  type: "text" | "photo";
  message?: string;
  caption?: string;
  imageUrl?: string;
  hashtags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...init });
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await r.text();
    throw new Error(`Non-JSON response (${r.status}): ${text.slice(0, 200)}`);
  }
  const j = await r.json();
  if (!r.ok) throw j;
  return j as T;
}

export default function TemplatesPage() {
  const [list, setList] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<Template | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);

  async function load() {
    setErr(null);
    try {
      const j = await jfetch<{ ok: boolean; templates: Template[] }>("/api/templates/list");
      setList(j.templates);
      if (!selectedId && j.templates[0]) {
        setSelectedId(j.templates[0].id);
        setForm(j.templates[0]);
      }
    } catch (e: any) {
      setErr(e?.error || e?.message || "Kon templates niet laden");
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = list.find(x => x.id === selectedId) || null;
    setForm(t);
  }, [selectedId, list]);

  function update<K extends keyof Template>(key: K, val: Template[K]) {
    if (!form) return;
    setForm({ ...form, [key]: val });
  }

  function hashtagsToText(arr?: string[]) {
    return (arr || []).join(" ");
  }
  function textToHashtags(s: string) {
    return s.split(/\s+/).map(x => x.trim()).filter(Boolean);
  }

  async function save() {
    if (!form) return;
    setErr(null); setInfo(null);
    try {
      const body: Template = {
        ...form,
        hashtags: textToHashtags(hashtagsToText(form.hashtags)),
      };
      const j = await jfetch<{ ok: boolean; template: Template }>("/api/templates/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setInfo({ ok: true, id: j.template.id });
      await load();
      setSelectedId(j.template.id);
    } catch (e: any) {
      setErr(e?.error || e?.message || "Opslaan mislukt");
    }
  }

  async function del(id: string) {
    if (!confirm("Verwijderen?")) return;
    setErr(null); setInfo(null);
    try {
      await jfetch("/api/templates/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
      if (selectedId === id) {
        setSelectedId(list[0]?.id || "");
      }
    } catch (e: any) {
      setErr(e?.error || e?.message || "Verwijderen mislukt");
    }
  }

  function addNew() {
    const t: Template = {
      id: "",
      name: "Nieuwe template",
      platform: "any",
      type: "text",
      message: "",
      caption: "",
      imageUrl: "",
      hashtags: [],
    };
    setForm(t);
    setSelectedId("");
  }

  const isPhoto = form?.type === "photo";
  const isText = form?.type === "text";

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gray-50">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar lijst */}
        <aside className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Templates</h2>
            <button onClick={addNew} className="px-3 py-2 rounded-xl shadow bg-white hover:bg-gray-100 text-sm">+ Nieuw</button>
          </div>
          <div className="space-y-1 max-h-[70vh] overflow-auto">
            {list.map(t => (
              <div key={t.id} className={`p-2 rounded-lg border cursor-pointer ${selectedId === t.id ? "bg-gray-100" : "bg-white"}`}
                   onClick={() => setSelectedId(t.id)}>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-gray-500">
                  {(t.platform !== "any" ? t.platform.toUpperCase() : "ANY")} · {t.type}
                </div>
              </div>
            ))}
            {!list.length && <div className="text-sm text-gray-500">Geen templates gevonden.</div>}
          </div>
        </aside>

        {/* Editor */}
        <main className="bg-white rounded-2xl shadow p-4 space-y-4">
          <h1 className="text-xl font-semibold">Template editor</h1>

          {err && <div className="rounded-lg border bg-red-50 border-red-200 text-red-800 p-3 text-sm">{err}</div>}
          {info && <div className="rounded-lg border bg-green-50 border-green-200 text-green-800 p-3 text-sm">Opgeslagen ✓</div>}

          {!form && <div className="text-sm text-gray-600">Selecteer links een template of klik “Nieuw”.</div>}

          {form && (
            <div className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-sm md:col-span-2">Naam
                  <input className="w-full mt-1 p-2 rounded-xl border" value={form.name} onChange={e => update("name", e.target.value)} />
                </label>
                <label className="text-sm">Platform
                  <select className="w-full mt-1 p-2 rounded-xl border" value={form.platform} onChange={e => update("platform", e.target.value as any)}>
                    <option value="any">Any</option>
                    <option value="fb">FB</option>
                    <option value="ig">IG</option>
                  </select>
                </label>
              </div>

              <label className="text-sm">Type
                <select className="w-full mt-1 p-2 rounded-xl border" value={form.type} onChange={e => update("type", e.target.value as any)}>
                  <option value="text">Text</option>
                  <option value="photo">Photo</option>
                </select>
              </label>

              {isText && (
                <label className="text-sm">Message (FB)
                  <textarea className="w-full mt-1 p-2 rounded-xl border min-h-[100px]" value={form.message || ""} onChange={e => update("message", e.target.value)} placeholder="Bijv. 'Tip Tuesday: {tip} ...' " />
                </label>
              )}

              {isPhoto && (
                <>
                  <label className="text-sm">Caption (IG)
                    <textarea className="w-full mt-1 p-2 rounded-xl border min-h-[100px]" value={form.caption || ""} onChange={e => update("caption", e.target.value)} placeholder="Bijv. 'Nieuwe week, nieuwe doelen… {cta}' " />
                  </label>
                  <label className="text-sm">Image URL (optioneel, publiek .jpg/.png)
                    <input className="w-full mt-1 p-2 rounded-xl border" value={form.imageUrl || ""} onChange={e => update("imageUrl", e.target.value)} placeholder="https://..." />
                  </label>
                </>
              )}

              <label className="text-sm">Hashtags (spatie-gescheiden)
                <input className="w-full mt-1 p-2 rounded-xl border" value={hashtagsToText(form.hashtags)} onChange={e => update("hashtags", textToHashtags(e.target.value))} placeholder="#growth #marketing #news" />
              </label>

              <div className="flex items-center gap-3">
                <button onClick={save} className="px-3 py-2 rounded-2xl shadow bg-gray-900 text-white">Opslaan</button>
                {form.id && (
                  <button onClick={() => del(form.id!)} className="px-3 py-2 rounded-2xl shadow bg-white hover:bg-gray-100">Verwijderen</button>
                )}
              </div>

              {(form.createdAt || form.updatedAt) && (
                <div className="text-xs text-gray-500">
                  {form.createdAt && <>Aangemaakt: {new Date(form.createdAt).toLocaleString()} · </>}
                  {form.updatedAt && <>Laatst bewerkt: {new Date(form.updatedAt).toLocaleString()}</>}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}