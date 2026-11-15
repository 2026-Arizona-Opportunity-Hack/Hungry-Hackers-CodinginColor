"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { cx } from "@/components/ui";

/**
 * Floating "+N XP" toast. Purely visual (aria-hidden): the new total is
 * announced by the surrounding `role="status"` XP line instead, so screen
 * readers hear one update, not two.
 */
export function XpPopup({ amount, bumpKey }: { amount: number; bumpKey: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bumpKey === 0 || amount <= 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, [bumpKey, amount]);

  if (!visible) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-1 left-1/2 z-10 flex -translate-x-1/2 -translate-y-full animate-rise items-center gap-1 rounded-full bg-cic-dark px-3 py-1 text-sm font-black whitespace-nowrap text-white shadow-slab"
    >
      <Star aria-hidden className="size-4" /> +{amount} XP
    </span>
  );
}

/** Small helper for inline "+N XP" text in breakdowns. */
export function XpTag({ amount, className }: { amount: number; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 rounded-full bg-cic-tint px-2 py-0.5 text-xs font-black text-cic-darker",
        className,
      )}
    >
      +{amount} XP
    </span>
  );
}
