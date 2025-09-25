"use client";
import React from "react";

export const TOKENS = {
  SUBTLE: "text-neutral-400",
};

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/50 p-5 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-3">
      <div className="text-lg font-semibold">{title}</div>
      {desc ? <div className={`text-sm ${TOKENS.SUBTLE}`}>{desc}</div> : null}
    </div>
  );
}