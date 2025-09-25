"use client";
import React from "react";
import ElysiumLayout from "../../components/elysium/Layout";

export default function PageShell({
  title,
  desc,
  children,
  enable3D,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  enable3D?: boolean; // per pagina 3D aan/uit (default aan)
}) {
  return (
    <ElysiumLayout title={title} subtitle={desc} enable3D={enable3D}>
      {children}
    </ElysiumLayout>
  );
}
