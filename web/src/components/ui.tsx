import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, Clock } from "lucide-react";
import type { StudentStatus } from "@/lib/analytics";

export function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export function Logo({ variant = "horizontal", className }: { variant?: "horizontal" | "stacked" | "icon"; className?: string }) {
  const src = {
    horizontal: { file: "/brand/cic-logo-horizontal.png", w: 1200, h: 307 },
    stacked: { file: "/brand/cic-logo-stacked.png", w: 600, h: 593 },
    icon: { file: "/brand/cic-icon.png", w: 591, h: 600 },
  }[variant];
  return <Image src={src.file} alt="Coding in Color" width={src.w} height={src.h} className={className} priority />;
}

const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-2.5 font-bold transition-[color,background-color,transform,box-shadow] duration-100 active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0";
const buttonVariants = {
  primary:
    "bg-cic-dark text-white shadow-slab hover:bg-[#008544] active:shadow-slab-pressed disabled:active:shadow-slab",
  secondary:
    "border-2 border-cic-line bg-white text-cic-dark shadow-slab-gray hover:bg-cic-tint active:shadow-slab-gray-pressed disabled:active:shadow-slab-gray",
  /** For use on dark-green panels. */
  light: "bg-white text-cic-darker shadow-slab hover:bg-cic-tint active:shadow-slab-pressed",
  ghost: "text-cic-dark hover:bg-cic-tint active:translate-y-0",
};

type Variant = keyof typeof buttonVariants;

export function Button({ variant = "primary", className, ...rest }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(buttonBase, buttonVariants[variant], className)} {...rest} />;
}

export function LinkButton({
  variant = "primary",
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(buttonBase, buttonVariants[variant], className)} {...rest} />;
}

export function Card({ className, children, ...rest }: ComponentProps<"section">) {
  return (
    <section className={cx("rounded-[var(--radius-card)] border-2 border-cic-line bg-white p-5 shadow-slab-gray", className)} {...rest}>
      {children}
    </section>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl leading-tight text-cic-dark md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-cic-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cx("h-3 w-full overflow-hidden rounded-full bg-cic-tint ring-1 ring-cic-line ring-inset", className)}
    >
      <div className="h-full origin-left animate-grow rounded-full bg-cic-green transition-[width] duration-500 ease-out" style={{ width: `${v * 100}%` }} />
    </div>
  );
}

const STATUS_STYLE: Record<StudentStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  "on-track": { label: "On track", cls: "bg-cic-tint text-cic-darker", Icon: CheckCircle2 },
  complete: { label: "Complete", cls: "bg-cic-dark text-white", Icon: CheckCircle2 },
  stuck: { label: "Needs help", cls: "bg-cic-danger-bg text-cic-danger", Icon: AlertTriangle },
  "not-started": { label: "Not started", cls: "bg-cic-warn-bg text-cic-warn", Icon: CircleDashed },
};

/** Status is always icon + text, never color alone (WCAG 1.4.1). */
export function StatusBadge({ status }: { status: StudentStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap", s.cls)}>
      <s.Icon aria-hidden className="size-4" />
      {s.label}
    </span>
  );
}

/**
 * Brand loading indicator: the "< >" code-tag brackets from the CIC mark hop
 * in alternation above the label. Glyphs are Arial Black (font-display) and
 * the label is Arial (body font) — the same fonts as everything else.
 * Use `size` for page-level loads and `inline` for buttons/status lines.
 */
export function Loading({
  label = "Loading…",
  size = "md",
  inline = false,
}: {
  label?: string;
  size?: "md" | "sm";
  inline?: boolean;
}) {
  const glyph = size === "sm" ? "text-2xl" : "text-4xl";
  return (
    <div role="status" className={cx("flex text-cic-muted", inline ? "items-center gap-2" : "flex-col items-center gap-1 p-8 text-center")}>
      <span aria-hidden className={cx("font-display leading-none text-cic-dark", inline && "text-lg")}>
        <span className={cx("inline-block animate-bracket-bounce", !inline && glyph)}>{"<"}</span>
        <span className={cx("inline-block animate-bracket-bounce [animation-delay:200ms]", !inline && glyph)}>{">"}</span>
      </span>
      <span className={cx(!inline && "mt-1 font-bold", inline && "text-sm")}>
        {label}
        <span aria-hidden>
          <span className="inline-block animate-dot-bounce">.</span>
          <span className="inline-block animate-dot-bounce [animation-delay:200ms]">.</span>
          <span className="inline-block animate-dot-bounce [animation-delay:400ms]">.</span>
        </span>
      </span>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border-2 border-dashed border-cic-line p-8 text-center">
      <h2 className="text-lg font-bold">{title}</h2>
      {children && <div className="mx-auto mt-2 max-w-md text-cic-muted">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Minutes({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-cic-muted">
      <Clock aria-hidden className="size-4" /> {n} min
    </span>
  );
}

export function KpiCard({ label, value, note, Icon }: { label: string; value: string; note?: string; Icon: typeof Clock }) {
  return (
    <Card className="flex h-full items-start gap-3 p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cic-dark text-white shadow-slab">
        <Icon aria-hidden className="size-6" />
      </span>
      <div>
        <p className="text-sm font-bold text-cic-muted">{label}</p>
        <p className="font-display text-3xl">{value}</p>
        {note && <p className="text-sm text-cic-muted">{note}</p>}
      </div>
    </Card>
  );
}

/**
 * Decorative chevron brackets — the "< >" code-tag motif from the CIC mark,
 * drawn as outlines so it never competes with the real logo.
 */
export function Brackets({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden focusable="false">
      <path d="M78 22 20 80l58 58" fill="none" stroke="currentColor" strokeWidth="22" strokeLinejoin="round" strokeLinecap="round" />
      <path d="m162 22 58 58-58 58" fill="none" stroke="currentColor" strokeWidth="22" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** A dark-green hero panel with white text and the bracket motif. */
export function HeroPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cx("relative overflow-hidden rounded-[24px] bg-cic-dark p-6 text-white shadow-slab md:p-8", className)}>
      <Brackets className="pointer-events-none absolute -right-10 -bottom-8 w-72 text-cic-green opacity-40 md:w-96" />
      <div className="relative">{children}</div>
    </section>
  );
}
