"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

/* fetch helper (JSON + foutafhandeling) */
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

type AuthApi = { loggedIn: boolean; hasToken: boolean };
type FBPage = { id: string; name?: string; access_token?: string; instagram_business_account?: { id: string } | null };
type PagesApi = { ok: boolean; via: string; data: { data: FBPage[] } };
type PostResp = { ok: boolean; postId?: string; permalink?: string; step?: string; error?: string };
type PageTokenResp = { ok: boolean; pageId: string; pageAccessToken: string };

export default function ConnectPage() {
  const { data: session, status } = useSession();

  // algemene state
  const [auth, setAuth] = useState<AuthApi | null>(null);
  const [pages, setPages] = useState<FBPage[] | null>(null);
  const [via, setVia] = useState("");
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  

  // FB tekstpost (mag blijven)
  const [postMsg, setPostMsg] = useState("");
  const [postRes, setPostRes] = useState<PostResp | null>(null);
const [postErr, setPostErr] = useState<any>(null);

  // IG alleen CHECK
  const [igResp, setIgResp] = useState<any>(null);
  const [igErr, setIgErr] = useState<string | null>(null);
const [pageToken, setPageToken] = useState<string>("");

  // UI toggles
  const [showHowTo, setShowHowTo] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // herstel eerdere selectie
  useEffect(() => {
    const saved = localStorage.getItem("selected_page_id");
    if (saved) setSelectedPageId(saved);
  }, []);

  // auth check
  useEffect(() => {
    (async () => {
      try {
        const a = await jfetch<AuthApi>("/api/meta/auth");
        setAuth(a);
      } catch {}
    })();
  }, [status]);

  const loggedIn = !!(auth?.loggedIn && auth?.hasToken);

  async function loadPages() {
    setError(null);
    setLoadingPages(true);
    try {
      const j = await jfetch<PagesApi>("/api/meta/pages");
      const list = j?.data?.data ?? [];
      setPages(list);
      setVia(j?.via ?? "");
      if (!selectedPageId && list[0]) setSelectedPageId(list[0].id);
    } catch (e: any) {
      setError(e?.error || e?.message || "Kon pages niet laden");
      setPages([]);
    } finally {
      setLoadingPages(false);
    }
  }

  /* SAVE: ook page.id + page.name in localStorage voor Planner */
  function saveSelection() {
    if (!selectedPageId || !pages) return;
    const p = pages.find(x => x.id === selectedPageId);
    localStorage.setItem("selected_page_id", selectedPageId);
    localStorage.setItem("page.id", selectedPageId);
    if (p?.name) localStorage.setItem("page.name", p.name);
  }

  /* Advanced (niet nodig voor gebruikers): verborgen achter toggle */
  async function getPageToken() {
  if (!selectedPageId) return;
  try {
    const j = await jfetch<PageTokenResp>(`/api/meta/page_token?page_id=${encodeURIComponent(selectedPageId)}`);
    // ✅ Bewaar token lokaal voor Planner & dispatcher
    localStorage.setItem("page.token", j.pageAccessToken);
    // (we bewaren id & name al elders)
    alert("Page token opgehaald en opgeslagen.");
    console.log("Page token (saved to localStorage 'page.token'):", j.pageAccessToken.slice(0, 8) + "…");
  } catch (e: any) {
    setError(e?.error || e?.message || "Kon page token niet ophalen");
  }
}

  async function submitPost() {
  if (!selectedPageId || !postMsg.trim()) return;
  setPostRes(null);
  setPostErr(null);
  setError(null);
  try {
    const r = await jfetch<PostResp>("/api/meta/post_text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: selectedPageId, message: postMsg.trim() }),
    });
    setPostRes(r);
    if (!r.ok) {
      setError(r.error || `Post failed at ${r.step}`);
      setPostErr(r); // <<< toon volledige server-JSON
    }
  } catch (e: any) {
    setError(e?.error || e?.message || "Posten mislukt");
    setPostErr(e);   // <<< toon ook de throw JSON/tekst
  }
}

  async function checkIg() {
    setIgErr(null);
    setIgResp(null);
    if (!selectedPageId) {
      setIgErr("Geen page geselecteerd. Kies een Page en Save selection.");
      return;
    }
    try {
      const j = await jfetch<any>(`/api/meta/ig_account?page_id=${encodeURIComponent(selectedPageId)}`);
      setIgResp(j);
      if (!j.ok) setIgErr(j.error || `Mislukt bij stap: ${j.step}`);
    } catch (e: any) {
      setIgErr(e?.error || e?.message || "IG-check mislukt");
    }
  }

  const title = useMemo(() => {
    if (status === "loading") return "Aan het laden…";
    if (!loggedIn) return "Koppel je Facebook";
    return "Selecteer je Page(s)";
  }, [status, loggedIn]);

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gray-50">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
          <div className="flex items-center gap-3">
            {status === "authenticated" ? (
              <>
                <span className="text-sm text-gray-600">{session?.user?.name ?? "Ingelogd"}</span>
                <button onClick={() => signOut()} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100 text-sm">
                  Sign out
                </button>
              </>
        ) : (
  <button
    type="button"
    className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100 text-sm"
    onClick={() => {
      signIn("facebook", {
        callbackUrl: "/app/connect",
        authorization: {
          params: {
            scope: "pages_show_list,pages_manage_posts,pages_read_engagement,instagram_content_publish",
            auth_type: "rerequest",
          },
        },
      });
    }}
  >
    Sign in with Facebook
  </button>
)}
          </div>
        </header>

        {/* HOW TO CONNECT (inklapbaar) */}
        <section className="rounded-2xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 flex items-center justify-between">
            <div className="font-medium">HOW TO CONNECT</div>
            <button onClick={() => setShowHowTo(v => !v)} className="text-sm underline">
              {showHowTo ? "Verberg" : "Toon"}
            </button>
          </div>
          {showHowTo && (
            <div className="bg-white p-4 text-sm text-gray-700 space-y-2">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Klik hierboven op <strong>Sign in with Facebook</strong> en voltooi de login.</li>
                <li>Geef toegang tot je <strong>Facebook Page(s)</strong> en (indien nodig) je <strong>Instagram Business</strong>.</li>
                <li>Klik op <strong>Load Pages</strong> hieronder en kies je Page.</li>
                <li>Klik op <strong>Save selection</strong>. (We bewaren Page ID & naam lokaal voor de Planner.)</li>
                <li>Optioneel: test een <strong>Facebook tekstpost</strong> via de sectie “Post test (Facebook)”.</li>
                <li>Voor Instagram staat hier enkel een <strong>Check Instagram</strong> knop om je koppeling te controleren.</li>
              </ol>
              <p className="text-xs text-gray-500">
                Tip: Zorg dat je Instagram-account is omgezet naar <em>Business</em> en gekoppeld aan je Facebook Page.
              </p>
            </div>
          )}
        </section>

        {/* Auth status */}
        <section className="p-4 rounded-2xl bg-white border shadow-sm">
          <div className="text-sm text-gray-700">Auth check: {auth ? JSON.stringify(auth) : "…"}</div>
        </section>

        {/* Pages laden + selecteren */}
      <section className="p-4 rounded-2xl bg-white border shadow-sm space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-medium">Pages</h2>
      {via && <p className="text-xs text-gray-500">via: {via}</p>}
    </div>
    <button
      onClick={loadPages}
      disabled={!loggedIn || loadingPages}
      className="px-3 py-2 rounded-xl bg-gray-900 text-white disabled:opacity-50"
      type="button"
    >
      {loadingPages ? "Laden…" : "Load Pages"}
    </button>
  </div>

  {error && (
    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
      {error}
    </div>
  )}

  {pages && pages.length > 0 && (
    <ul className="grid sm:grid-cols-2 gap-2">
      {pages.map((p) => {
        const selected = selectedPageId === p.id;
        return (
          <li
            key={p.id}
            className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition ${
              selected ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="page"
                value={p.id}
                checked={selected}
                onChange={() => setSelectedPageId(p.id)}
              />
              <div>
                <div className="font-medium">{p.name || `Page ${p.id}`}</div>
                <div className="text-xs text-gray-500">
                  ID: {p.id}
                  {p.instagram_business_account?.id && (<> · IG: {p.instagram_business_account.id}</>)}
                </div>
              </div>
            </label>
          </li>
        );
      })}
    </ul>
  )}

  {pages && pages.length === 0 && (
    <p className="text-sm text-gray-600">Geen Pages gevonden.</p>
  )}

  <div className="flex items-center flex-wrap gap-3">
    <button
      onClick={saveSelection}
      disabled={!selectedPageId}
      className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100 disabled:opacity-50"
      type="button"
    >
      Save selection
    </button>

    {/* Advanced toggle */}
    <button
      onClick={() => setShowAdvanced(v => !v)}
      className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100 text-sm"
      type="button"
    >
      {showAdvanced ? "Hide advanced" : "Show advanced"}
    </button>

    {/* Advanced inhoud in fragment, zodat meerdere elementen mogen */}
    {showAdvanced && (
      <>
        <button
          onClick={getPageToken}
          disabled={!selectedPageId}
          className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
          type="button"
        >
          Get Page token
        </button>

        {/* --- TEMP: toon opgehaalde Page Token --- */}
        {pageToken && (
          <div className="mt-3 p-3 rounded-xl border bg-gray-50">
            <div className="text-sm mb-2">
              <strong>Token length:</strong> {pageToken.length} · <strong>First 12:</strong> {pageToken.slice(0, 12)}…
            </div>
            <label className="block text-xs text-gray-600 mb-1">Page Access Token (read-only)</label>
            <textarea
              readOnly
              value={pageToken}
              className="w-full min-h-[80px] p-2 rounded-lg border bg-white font-mono text-xs"
            />
            <div className="text-xs text-gray-500 mt-1">
              Kopieer dit token voor je PowerShell test. Deel het niet publiek.
            </div>
          </div>
        )}
        {/* --- /TEMP --- */}
      </>
    )}
  </div>
</section>

        {/* FB: tekstpost demo (blijft) */}
        <section className="p-4 rounded-2xl bg-white border shadow-sm space-y-3">
  <h2 className="text-lg font-medium">Post test (Facebook · tekst)</h2>

  <div className="grid gap-2">
    <textarea
      value={postMsg}
      onChange={(e) => setPostMsg(e.target.value)}
      placeholder="Schrijf een korte statusupdate…"
      className="w-full min-h-[90px] p-3 rounded-xl border"
    />
    <button
      onClick={submitPost}
      disabled={!selectedPageId || !postMsg.trim()}
      className="px-3 py-2 rounded-xl bg-gray-900 text-white disabled:opacity-50"
      type="button"
    >
      Post naar Page
    </button>
  </div>

  {postRes && (
    <div
      className={`rounded-xl border p-3 text-sm ${
        postRes.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(postRes, null, 2)}</pre>
      {postRes?.permalink && (
        <a className="underline" href={postRes.permalink} target="_blank" rel="noreferrer">
          Bekijk post
        </a>
      )}
    </div>
  )}

  {postErr && (
    <div className="rounded-xl border p-3 text-sm bg-yellow-50 border-yellow-200 text-yellow-800">
      <div className="font-medium mb-1">Server error (debug)</div>
      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(postErr, null, 2)}</pre>
    </div>
  )}
</section>

        {/* IG: alleen CHECK knop (geen post test) */}
        <section className="p-4 rounded-2xl bg-white border shadow-sm space-y-3">
          <h2 className="text-lg font-medium">Instagram</h2>
          {igErr && <div className="rounded-xl border p-3 text-sm bg-red-50 border-red-200 text-red-800">{igErr}</div>}

          <div className="flex items-center gap-2">
            <button
              onClick={checkIg}
              disabled={!selectedPageId}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Check Instagram
            </button>
          </div>

          {igResp && (
            <pre className="text-xs bg-gray-50 border rounded-xl p-3 overflow-auto">{JSON.stringify(igResp, null, 2)}</pre>
          )}
        </section>

        {/* hint */}
        <section className="p-4 rounded-2xl bg-white border shadow-sm text-xs text-gray-500">
          Tip: Als Pages leeg blijft, controleer in Facebook Login for Business → Configurations of <code>pages_show_list</code> toegestaan is en je de juiste Page hebt geselecteerd tijdens het inloggen.
        </section>
      </div>
    </div>
  );
}