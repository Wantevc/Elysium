"use client";

import React, { useEffect, useState } from "react";
import { Card, SectionTitle, TOKENS, GoldCTA } from "./ui";

type Props = {
  children: React.ReactNode;
};

export default function DiamondOnly({ children }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [plan, setPlan] = useState<string>("");

  useEffect(() => {
    setHydrated(true);
    try {
      const p = localStorage.getItem("wallet.plan") || "";
      setPlan(p);
      const onWallet = () => setPlan(localStorage.getItem("wallet.plan") || "");
      window.addEventListener("wallet:update", onWallet);
      return () => window.removeEventListener("wallet:update", onWallet);
    } catch {
      // ignore
    }
  }, []);

  if (!hydrated) {
    return (
      <Card>
        <div className={TOKENS.SUBTLE}>Loading…</div>
      </Card>
    );
  }

  if (plan?.toLowerCase() !== "diamond") {
    return (
      <Card>
        <SectionTitle
          title="Diamond feature"
          desc="Deze pagina is exclusief voor Diamond leden."
        />
        <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
          <div className="text-amber-200 font-medium">Unlock Diamond ✨</div>
          <div className={`${TOKENS.SUBTLE} mt-1`}>
            Krijg team seats (3 extra gebruikers) en een AI Sales/Marketing Coach.
          </div>
          <div className="mt-3">
            <GoldCTA onClick={() => alert("Ga naar billing/upgrade flow")}>
              Upgrade to Diamond
            </GoldCTA>
          </div>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
