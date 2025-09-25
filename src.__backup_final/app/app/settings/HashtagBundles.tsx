"use client";
import { useEffect, useState } from "react";

type Bundle = { id: string; name: string; tags: string };
const LS_KEY = "hashtags.bundles";

function normalizeTags(input: string): string[] {
  return Array.from(
    new Set(
      (input || "")
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : "#" + t))
        .map((t) => t.replace(/#+/, "#").toLowerCase())
    )
  );
}

export default function HashtagBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [draftName, setDraftName] = useState("");
  const [draftTags, setDraftTags] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setBundles(arr);
      } else {
        const sample: Bundle[] = [
          {
            id: crypto.randomUUID?.() || String(Date.now()),
            name: "algemeen",
            tags: "#socialmedia #marketing #tips #ondernemen #business",
          },
        ];
        setBundles(sample);
        localStorage.setItem(LS_KEY, JSON.stringify(sample));
      }
    } catch {}
  }, []);

  function saveAll(next: Bundle[]) {
    setBundles(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  function addBundle() {
    const name = draftName.trim();
    const tags = normalizeTags(draftTags).join(" ");
    if (!name || !tags) return alert("Geef een naam en minstens 1 hashtag.");
    const item: Bundle = {
      id: crypto.randomUUID?.() || String(Date.now()),
      name,
      tags,
    };
    saveAll([...bundles, item]);
    setDraftName("");
    setDraftTags("");
  }

  function updateBundle(id: string, patch: Partial<Bundle>) {
    const next = bundles.map((b) => (b.id === id ? { ...b, ...patch } : b));
    saveAll(next);
  }

  function removeBundle(id: string) {
    if (!confirm("Verwijderen?")) return;
    saveAll(bundles.filter((b) => b.id !== id));
  }

  return (
    <div className="p-5">
      <div className="mb-3">
        <div className="text-lg font-semibold">Hashtag bundles</div>
        <div className="text-sm text-neutral-500">
          Beheer je sets; gebruik ze in Planner met “Voeg hashtags toe”.
        </div>
      </div>

      <div className="space-y-3">
        {bundles.map((b) => (
          <div
            key={b.id}
            className="rounded-xl border p-3 bg-white dark:bg-[#12161d] dark:border-[#2a3340]"
          >
            <div className="flex items-center gap-2">
              <input
                value={b.name}
                onChange={(e) => updateBundle(b.id, { name: e.target.value })}
                className="px-2 py-1 rounded border bg-white/70 dark:bg-[#0f141b] dark:border-[#2f3947] text-sm"
                placeholder="Naam"
              />
              <button
                onClick={() => removeBundle(b.id)}
                className="ml-auto text-sm px-2 py-1 rounded border"
              >
                Verwijder
              </button>
            </div>
            <textarea
              value={b.tags}
              onChange={(e) =>
                updateBundle(b.id, { tags: normalizeTags(e.target.value).join(" ") })
              }
              className="mt-2 w-full min-h-[70px] rounded border px-2 py-1 text-sm bg-white/70 dark:bg-[#0f141b] dark:border-[#2f3947]"
              placeholder="#voorbeeld #tags #gescheiden #door #spatie"
            />
            <div className="text-xs text-neutral-500 mt-1">
              Tip: spaties of komma’s zijn oké. We zetten automatisch “#” en verwijderen dubbels.
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border p-3 bg-white dark:bg-[#12161d] dark:border-[#2a3340]">
        <div className="font-medium mb-2 text-sm">Nieuwe bundle</div>
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className="mb-2 w-full px-2 py-1 rounded border bg-white/70 dark:bg-[#0f141b] dark:border-[#2f3947] text-sm"
          placeholder="Naam (bv. 'algemeen', 'actie', 'zomer')"
        />
        <textarea
          value={draftTags}
          onChange={(e) => setDraftTags(e.target.value)}
          className="w-full min-h-[70px] rounded border px-2 py-1 text-sm bg-white/70 dark:bg-[#0f141b] dark:border-[#2f3947]"
          placeholder="#tags of woorden met spatie/komma"
        />
        <div className="mt-2">
          <button
            onClick={addBundle}
            className="px-3 py-2 rounded-lg border bg-white hover:bg-neutral-100 text-sm"
          >
            Toevoegen
          </button>
        </div>
      </div>
    </div>
  );
}