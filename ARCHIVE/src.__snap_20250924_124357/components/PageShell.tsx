"use client";
import React, { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { walletRead } from "../lib/wallet";
import ElysiumLayout from "./elysium/Layout";

export default function PageShell({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Onboarding gate: geen plan = redirect naar /onboarding (behalve op onboarding zelf)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname?.startsWith("/onboarding")) return;
    const w = walletRead();
    if (!w.plan) router.replace("/onboarding");
  }, [router, pathname]);

  return (
    <ElysiumLayout title={title} subtitle={desc}>
      {children}
    </ElysiumLayout>
  );
}
