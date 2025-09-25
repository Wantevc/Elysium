"use client";
import { useState } from "react";
type FbPage = {
id: string;
name: string;
instagram_business_account?: { id: string } | null;
};
export default function PagesLoader() {
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [pages, setPages] = useState<FbPage[] | null>(null);
const [selected, setSelected] = useState<string | null>(null);
const [saved, setSaved] = useState<string | null>(null);
async function loadPages() {
setLoading(true);
 setError(null);
setSaved(null);
try {
const r = await fetch("/api/meta/pages", { cache: "no-store" });
 const json = await r.json();
if (!r.ok) {
throw new Error(json?.error || `HTTP ${r.status}`);
}const items: FbPage[] = json?.data?.data ?? [];
setPages(items);
 } catch (e: any) {
setError(e.message || "Failed to load pages");
  } finally {
setLoading(false);
}
}
function saveSelection() {
 if (!selected || !pages) return;
const p = pages.find((x) => x.id === selected);
 const payload = {
pageId: p?.id ?? selected,
pageName: p?.name ?? "",
igId: p?.instagram_business_account?.id ?? null,
};
 localStorage.setItem("selectedPage", JSON.stringify(payload));
setSaved(`${payload.pageName} (ID: ${payload.pageId})`);
}
return (
 <div className="mt-6 rounded-xl border p-4">
 <h2 className="mb-2 text-lg font-semibold">Connect a Page</h2>
{!pages ? (
<button
onClick={loadPages}
 disabled={loading}
className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-900 hover:text-white transition disabled:opacity-50"
>
{loading ? "Loading..." : "Load Pages"}
</button>
) : pages.length === 0 ? (
<p className="text-sm text-gray-600">No Pages found for this account.</p>
) : (
<div className="space-y-3">
<ul className="space-y-2">
 {pages.map((p) => (
<li key={p.id} className="flex items-center justify-between rounded border p-3">
<label className="flex items-center gap-3">
<input
 type="radio"
name="page"
value={p.id}
checked={selected === p.id}
onChange={() => setSelected(p.id)}
className="h-4 w-4"
/>
<span className="font-medium">{p.name}</span>
</label>
<span className="text-xs text-gray-600">
 IG linked: {p.instagram_business_account?.id ? "Yes" : "No"}
</span>
</li>
))}
</ul>
 <div className="flex items-center gap-3">
<button
onClick={saveSelection}
disabled={!selected}
className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-900 hover:text-white transition disabled:opacity-50"
>
Save selection
</button>
{saved && <span className="text-sm text-gray-700">Saved: {saved}</span>}
{saved && (
<a href="/app/planner" className="ml-auto rounded border px-4 py-2 text-sm">
Continue to Planner
</a>
)}
</div>
</div>
)}
{error && <p className="mt-3 text-sm text-red-600">{error}</p>}
<p className="mt-3 text-xs text-gray-500">
Tip: If you don’t see your Page, make sure your Facebook account has access and you’re logged in with the right profile.
</p>
</div>
);
}

