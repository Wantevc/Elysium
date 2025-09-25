"use client";

import { useEffect, useState } from "react";

type Wallet = {
  plan: string | null;
  subCredits: number;
  topupCredits: number;
  total: number;
};

function loadWallet(): Wallet {
  try {
    const plan = localStorage.getItem("wallet.plan") || "";
    const sub = parseInt(localStorage.getItem("wallet.subCredits") || "0", 10) || 0;
    const top = parseInt(localStorage.getItem("wallet.topupCredits") || "0", 10) || 0;
    return { plan: plan || null, subCredits: sub, topupCredits: top, total: sub + top };
  } catch {
    return { plan: null, subCredits: 0, topupCredits: 0, total: 0 };
  }
}

function saveWallet(w: Wallet) {
  try {
    localStorage.setItem("wallet.plan", w.plan ?? "");
    localStorage.setItem("wallet.subCredits", String(w.subCredits));
    localStorage.setItem("wallet.topupCredits", String(w.topupCredits));
    localStorage.setItem("wallet.total", String(w.total));
    window.dispatchEvent(new Event("wallet:update"));
  } catch {}
}

export default function WalletBadge() {
  // Start met een stabiele SSR-waarde (0) en laad echte waarde NA mount
  const [wallet, setWallet] = useState<Wallet>({ plan: null, subCredits: 0, topupCredits: 0, total: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWallet(loadWallet());
  }, []);

  // up-to-date blijven als andere pagina’s credits wijzigen
  useEffect(() => {
    const onUpdate = () => setWallet(loadWallet());
    window.addEventListener("storage", onUpdate);
    window.addEventListener("wallet:update", onUpdate as any);
    const id = setInterval(onUpdate, 2000);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("wallet:update", onUpdate as any);
      clearInterval(id);
    };
  }, []);

  function addPack(credits: number) {
    const next: Wallet = {
      ...loadWallet(),
      topupCredits: (wallet.topupCredits || 0) + credits,
      total: (wallet.total || 0) + credits,
    };
    saveWallet(next);
    setWallet(next);
    alert(`Added +${credits} credits ✅`);
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <span className="text-sm text-gray-600">
        Credits:{" "}
        {/* voorkom hydration warning als de client-waarde afwijkt van de SSR-waarde */}
        <strong suppressHydrationWarning>{mounted ? wallet.total : 0}</strong>
      </span>
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById("wb-menu");
          if (el) el.classList.toggle("hidden");
        }}
        className="text-xs rounded-full border px-2 py-1 hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded="false"
      >
        Add more
      </button>

      <div
        id="wb-menu"
        role="menu"
        className="hidden absolute right-0 top-[140%] z-50 w-44 rounded-xl border bg-white shadow p-2"
      >
        <div className="text-xs text-gray-500 px-2 pb-1">Choose a pack</div>
        <button
          role="menuitem"
          onClick={() => addPack(50)}
          className="w-full text-left text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-100 mb-1"
          title="+50 credits"
        >
          Small pack (+50)
        </button>
        <button
          role="menuitem"
          onClick={() => addPack(120)}
          className="w-full text-left text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-100"
          title="+120 credits"
        >
          Big pack (+120)
        </button>
        <div className="pt-1 px-2">
          <a
            href="/packs"
            className="block text-xs text-gray-500 underline hover:text-gray-700"
            role="menuitem"
          >
            or open Packs →
          </a>
        </div>
      </div>
    </div>
  );
}