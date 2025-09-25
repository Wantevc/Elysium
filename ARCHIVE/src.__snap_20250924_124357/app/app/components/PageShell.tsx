"use client";
import React from "react";

export default function PageShell({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {desc ? <p className="text-sm text-neutral-400 mt-1">{desc}</p> : null}
      </header>
      {children}
    </div>
  );
}
