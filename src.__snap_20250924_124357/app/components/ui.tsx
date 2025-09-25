"use client";
import React from "react";

/** Consistente card in Elysium-stijl */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`el-card ${className}`}>{children}</div>;
}

/** Section header */
export function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="el-sectiontitle">
      <h2>{title}</h2>
      {desc ? <p>{desc}</p> : null}
    </div>
  );
}

/** Buttons */
export function GlowButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`el-btn ${className}`}
      aria-disabled={disabled ? "true" : undefined}
    >
      <span>{children}</span>
    </button>
  );
}

export function GoldCTA({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`el-btn el-btn--gold ${className}`}
      aria-disabled={disabled ? "true" : undefined}
    >
      <span>{children}</span>
    </button>
  );
}

/** TOKENS: simpele helper voor “subtle” tekst */
export const TOKENS = {
  SUBTLE: "el-muted",
};
