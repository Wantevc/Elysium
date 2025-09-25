"use client";
import React from "react";

/**
 * ELYSIUM wordmark logo met gouden gradient en subtiele glow.
 * Props:
 *  - size: hoogte in px (breedte schaalt automatisch)
 *  - glow: zet subtiele gloed aan/uit
 *  - stacked: true → toont ook een klein "AI Marketing Suite" onderschrift
 */
export default function Logo({
  size = 36,
  glow = true,
  stacked = false,
}: {
  size?: number;
  glow?: boolean;
  stacked?: boolean;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: 1,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 600 120"
        style={{
          height: size,
          width: "auto",
          display: "block",
          filter: glow ? "drop-shadow(0 0 6px rgba(217,191,122,.35))" : "none",
        }}
      >
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4e8be" />
            <stop offset="40%" stopColor="#e6cf91" />
            <stop offset="100%" stopColor="#d9bf7a" />
          </linearGradient>
        </defs>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Segoe UI, system-ui, sans-serif"
          fontWeight="900"
          fontSize="88"
          letterSpacing="8"
          fill="url(#goldGrad)"
        >
          ELYSIUM
        </text>
      </svg>

      {stacked && (
        <div
          style={{
            fontSize: Math.round(size * 0.28),
            color: "#aaa",
            marginTop: 4,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: "Segoe UI, system-ui, sans-serif",
          }}
        >
          AI Marketing Suite
        </div>
      )}
    </div>
  );
}