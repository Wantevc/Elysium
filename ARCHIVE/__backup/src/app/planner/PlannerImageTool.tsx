"use client";

// src/app/planner/PlannerImageTool.tsx
import React from "react";

export default function PlannerImageTool() {
  const [prompt, setPrompt] = React.useState("");
  const [size, setSize] = React.useState("1024x1024");
  const [img, setImg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    // laat huidige image staan tijdens load? -> zet setImg(null) weg als je dat wil
    try {
      const r = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "photo", prompt, size }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        throw new Error(data?.error || `HTTP ${r.status}`);
      }
      setImg(data.url);
    } catch (e: any) {
      setError(e.message || "Er ging iets mis.");
    } finally {
      setLoading(false);
    }
  }

  function onClear() {
    setImg(null);
    setError(null);
  }

  return (
    <div className="space-y-3">
      {/* invoer */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Afbeelding prompt</label>
        <textarea
          className="w-full rounded-lg border p-2"
          rows={3}
          placeholder="Beschrijf de afbeelding…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Size</label>
          <select
            className="rounded-lg border p-2"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            <option>1024x1024</option>
            <option>1024x1536</option>
            <option>1536x1024</option>
            <option>auto</option>
          </select>

          <button
            onClick={onGenerate}
            disabled={loading || !prompt.trim()}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <span
                  aria-hidden
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
                />
                Genereren…
              </>
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>

      {/* preview met spinner overlay */}
      <div className="relative overflow-hidden rounded-xl border min-h-[200px]">
        {/* als er al een image is, tonen */}
        {img && <img src={img} alt="Generated" className="block w-full" />}

        {/* spinner overlay terwijl hij bezig is */}
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2">
              <span
                aria-hidden
                className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-black/60 border-t-transparent"
              />
              <span className="text-sm">Bezig met genereren…</span>
            </div>
          </div>
        )}

        {/* rechtsboven een kruisje om het resultaat te wissen */}
        {img && !loading && (
          <button
            onClick={onClear}
            aria-label="Verwijder afbeelding"
            className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-white"
            title="Verwijder"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* foutmelding */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}