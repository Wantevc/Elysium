export type WalletState = { plan: string; sub: number; top: number; total: number };

export function walletRead(): WalletState {
  try {
    const sub = parseInt(localStorage.getItem("wallet.subCredits") || "0", 10) || 0;
    const top = parseInt(localStorage.getItem("wallet.topupCredits") || "0", 10) || 0;
    const plan = localStorage.getItem("wallet.plan") || "";
    return { plan, sub, top, total: sub + top };
  } catch {
    return { plan: "", sub: 0, top: 0, total: 0 };
  }
}

export function walletWrite(next: { plan: string | null; sub: number; top: number }) {
  const total = Math.max(0, (next.sub || 0) + (next.top || 0));
  try {
    localStorage.setItem("wallet.plan", next.plan ?? "");
    localStorage.setItem("wallet.subCredits", String(Math.max(0, next.sub)));
    localStorage.setItem("wallet.topupCredits", String(Math.max(0, next.top)));
    localStorage.setItem("wallet.total", String(total));
    window.dispatchEvent(new Event("wallet:update"));
  } catch {}
}

export function walletSetPlan(plan: string, monthlyCredits: number) {
  const w = walletRead();
  walletWrite({ plan, sub: monthlyCredits, top: w.top });
}

export function walletAddTopup(credits: number) {
  const w = walletRead();
  walletWrite({ plan: w.plan, sub: w.sub, top: w.top + credits });
}

export function walletDeduct(amount: number) {
  const w = walletRead();
  let top = w.top, sub = w.sub, rest = amount;
  const useTop = Math.min(top, rest); top -= useTop; rest -= useTop;
  if (rest > 0) { const useSub = Math.min(sub, rest); sub -= useSub; rest -= useSub; }
  walletWrite({ plan: w.plan, sub, top });
  return { deducted: amount - rest, remaining: walletRead().total };
}
