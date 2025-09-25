"use client";

// src/components/ImageGenerator.tsx
import React from "react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = React.useState("cozy autumn flatlay, soft daylight");
  const [size, setSize] = React.useState("1024x1024");
  const [img, setImg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setImg(null);
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
    <div className="max-w-xl mx-auto space-y-4">
      {/* Prompt */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Prompt</label>
        <textarea
          className="w-full rounded-lg border p-2"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Beschrijf de gewenste afbeelding…"
        />
      </div>

      {/* Size + Generate */}
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
          disabled={loading}
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

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <span
            aria-hidden
            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-black/50 border-t-transparent"
          />
          <p className="text-sm">Bezig met genereren… dit kan enkele seconden duren.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Resultaat + kruisje om te  */}
      {img && (
        <div className="relative overflow-hidden rounded-xl border">
          {/* -knop (kruisje) rechtsboven */}
          <button
            onClick={onClear}
            aria-label=" afbeelding"
            className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-white"
            title=""
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <img src={img} alt="Generated" className="block w-full" />
        </div>
      )}
    </div>
  );
}

