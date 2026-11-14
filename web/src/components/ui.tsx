import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, Clock, Loader2 } from "lucide-react";
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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold transition-[color,background-color,transform] duration-150 active:scale-[0.97] disabled:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60";
const buttonVariants = {
  primary: "bg-cic-dark text-white hover:bg-cic-darker",
  secondary: "border-2 border-cic-dark bg-white text-cic-dark hover:bg-cic-tint",
  ghost: "text-cic-dark hover:bg-cic-tint",
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
    <section className={cx("rounded-[var(--radius-card)] border border-cic-line bg-white p-5", className)} {...rest}>
      {children}
    </section>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-cic-dark md:text-3xl">{title}</h1>
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
      className={cx("h-2.5 w-full overflow-hidden rounded-full bg-cic-tint ring-1 ring-cic-line ring-inset", className)}
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

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 p-8 text-cic-muted">
      <Loader2 aria-hidden className="size-5 animate-spin" />
      {label}
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
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cic-tint text-cic-dark">
        <Icon aria-hidden className="size-5" />
      </span>
      <div>
        <p className="text-sm text-cic-muted">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {note && <p className="text-sm text-cic-muted">{note}</p>}
      </div>
    </Card>
  );
}
