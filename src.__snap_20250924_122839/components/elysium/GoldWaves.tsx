"use client";
import React, { useEffect, useRef } from "react";

/**
 * GoldWaves — premium “liquid gold” waves on black.
 * Perf-friendly Canvas2D (no WebGL). Fades and parallax subtly.
 */
export default function GoldWaves() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // palette
    const bg = "#090909";
    const gold1 = "#f1dfad";
    const gold2 = "#d9bf7a";

    const waves = [
      { amp: 18, len: 1.2, speed: 0.18, y: h * 0.72, alpha: 0.30 },
      { amp: 26, len: 0.85, speed: 0.14, y: h * 0.78, alpha: 0.22 },
      { amp: 36, len: 0.62, speed: 0.10, y: h * 0.84, alpha: 0.16 },
    ];

    let t0 = performance.now();

    const draw = (tNow: number) => {
      const t = (tNow - t0) / 1000;

      // BG
      ctx.clearRect(0, 0, w, h);
      // soft vignette + stars specks
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, Math.max(w, h));
      grad.addColorStop(0, bg);
      grad.addColorStop(1, "#0b0b0c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // tiny sparkles
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 70; i++) {
        const x = (i * 251) % w;
        const y = (i * 503) % h;
        ctx.fillStyle = Math.random() < 0.5 ? gold1 : gold2;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;

      // W A V E S
      waves.forEach((wv, idx) => {
        const path = new Path2D();
        const phase = t * wv.speed * 2 * Math.PI;
        const k = (2 * Math.PI) / (w * wv.len);

        path.moveTo(0, h);
        path.lineTo(0, wv.y);

        const step = Math.max(1, Math.floor(w / 800));
        for (let x = 0; x <= w; x += step) {
          const y = wv.y + Math.sin(x * k + phase) * wv.amp;
          path.lineTo(x, y);
        }
        path.lineTo(w, h);
        path.closePath();

        // gold gradient per layer
        const lg = ctx.createLinearGradient(0, wv.y - 80, 0, h);
        if (idx === 0) {
          lg.addColorStop(0, `${gold1}33`);
          lg.addColorStop(1, `${gold2}18`);
        } else if (idx === 1) {
          lg.addColorStop(0, `${gold2}2b`);
          lg.addColorStop(1, `${gold2}10`);
        } else {
          lg.addColorStop(0, `${gold2}24`);
          lg.addColorStop(1, `${gold2}0a`);
        }

        ctx.save();
        ctx.globalAlpha = wv.alpha;
        ctx.fillStyle = lg;
        ctx.filter = "blur(0.7px)";
        ctx.fill(path);
        ctx.restore();

        // thin highlight line
        ctx.save();
        ctx.strokeStyle = `${gold1}40`;
        ctx.lineWidth = 1;
        ctx.filter = "blur(0.3px)";
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
          const y = wv.y + Math.sin(x * k + phase) * wv.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="el-waves" aria-hidden />;
}