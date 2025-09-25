"use client";
import React, { useEffect, useRef } from "react";

/**
 * AuroraCurtains – Gold variant
 * - Monochroom (goudtinten), geen regenboog
 * - Subtielere glow, trage beweging
 *
 * Props:
 *  - opacity: 0..1        (default 0.25)
 *  - hue: number          (default 45 – goud)
 *  - variance: number     (default 6 – kleine hue-variatie)
 *  - strength: number     (default 0.55 – intensiteit per “golf”)
 *  - speed: number        (default 6000ms – lagere = sneller)
 */
export default function AuroraCurtains({
  opacity = 0.25,
  hue = 45,           // goud
  variance = 6,       // mini variatie rond goud
  strength = 0.55,    // helderheid van de glow
  speed = 6000,       // animatiesnelheid
}: {
  opacity?: number;
  hue?: number;
  variance?: number;
  strength?: number;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current!;
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.filter = "blur(42px) saturate(110%)";
    canvas.style.opacity = String(opacity);
    canvas.style.pointerEvents = "none";
    host.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    function loop(t: number) {
      const { width, height } = host.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.floor(width * dpr)) canvas.width = Math.floor(width * dpr);
      if (canvas.height !== Math.floor(height * dpr)) canvas.height = Math.floor(height * dpr);
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // achtergrond leegmaken (donker houden)
      ctx.clearRect(0, 0, width, height);

      // 5 “gordijnen” in goudtinten
      const layers = 5;
      for (let i = 0; i < layers; i++) {
        const p = ((t / speed) + i * 0.18) % 1;
        const x = Math.sin(p * Math.PI * 2 + i * 0.8) * (width * 0.32) + width * 0.5;
        const y0 = height * (0.18 + i * 0.14);
        const baseHue = hue + (Math.sin((t / (speed * 1.3)) + i) * variance);
        const g = ctx.createRadialGradient(x, y0, 18, x, y0, height * 0.65);

        // goudtinten (licht → transparant)
        // tip: pas lightness aan voor warmer/kouder goud
        g.addColorStop(0.0, `hsla(${baseHue}, 62%, 64%, ${strength})`); // kern licht goud
        g.addColorStop(0.4, `hsla(${baseHue}, 58%, 54%, ${strength * 0.35})`);
        g.addColorStop(1.0, `hsla(${baseHue}, 58%, 50%, 0.0)`);

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }, [opacity, hue, variance, strength, speed]);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        // subtiel mengen met jouw donkere achtergrond
        mixBlendMode: "screen",
      }}
    />
  );
}