"use client";
import React from "react";

export default function AppTopbar() {
  return (
    <header className="topbar sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gold">★</span>
          <span className="font-semibold tracking-wide">AI Social Manager</span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-neutral-300">
          <a href="/app/home" className="hover:text-gold">Home</a>
          <a href="/app/campaign-builder" className="hover:text-gold">Campaign</a>
          <a href="/app/brand-voice" className="hover:text-gold">Brand Voice</a>
          <a href="/app/offer-visual" className="hover:text-gold">Offer + Visual</a>
          <a href="/app/settings" className="hover:text-gold">Settings</a>
        </nav>
      </div>
    </header>
  );
}