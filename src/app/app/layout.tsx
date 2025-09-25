import "../theme-gold.css";   // ← nood-thema, werkt zonder Tailwind
import React from "react";

export const metadata = { title: "AI Social Manager", description: "Marketing met AI" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <div className="topnav">
          <div className="wrap">
            <span className="brand"><span className="dot"></span><span className="name">AI Social Manager</span></span>
          </div>
        </div>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
