// @ts-nocheck
'use client';
import React from 'react';

// Simpele thematokens die overal veilig zijn
export const TOKENS = {
  radius: 'rounded-2xl',
  pad: 'px-4 py-2',
  font: 'font-medium',
  glow: 'shadow-[0_0_20px_rgba(255,215,0,0.35)]',
  ring: 'ring-1 ring-yellow-400/40',
};

// Basic GlowButton die gewoon werkt als <button>
export function GlowButton({ children, className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center ' +
    TOKENS.pad + ' ' + TOKENS.radius + ' ' + TOKENS.font + ' ' +
    TOKENS.glow + ' ' + TOKENS.ring;

  return (
    <button className={base + (className ? ' ' + className : '')} {...props}>
      {children}
    </button>
  );
}

export default {};
