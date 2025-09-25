"use client";
import React from "react";
import { ChevronRight } from "lucide-react";

export function Card({
  title,
  desc,
  icon,
  children,
}: {
  title: string;
  desc?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-border p-5 sm:p-6 hover:shadow-gold transition-shadow duration-200">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-neutral-900/70 p-2 gold-ring">{icon}</div>
        <div className="min-w-0">
          <div className="text-lg font-semibold">{title}</div>
          {desc && <div className="text-sm text-neutral-400 mt-0.5">{desc}</div>}
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function GoldLink({
  href,
  label,
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:opacity-90"
    >
      {label ?? "Openen"} <ChevronRight size={16} />
    </a>
  );
}
