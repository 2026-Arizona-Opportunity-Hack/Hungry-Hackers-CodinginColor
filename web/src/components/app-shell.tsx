"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Logo, cx } from "./ui";

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Match child routes too (default true). */
  prefix?: boolean;
}

/**
 * Desktop: left navigation + top bar. Mobile: top bar + bottom navigation.
 * The logo always sits on white (brand rule: white or dark-green backing only).
 */
export function AppShell({
  nav,
  topRight,
  roleLabel,
  children,
}: {
  nav: NavItem[];
  topRight?: ReactNode;
  roleLabel: string;
  children: ReactNode;
}) {
  const path = usePathname();
  const isActive = (item: NavItem) =>
    item.prefix === false ? path === item.href : path === item.href || path.startsWith(item.href + "/");
  // The most specific match wins so "/learn" doesn't light up on "/learn/course".
  const active = nav.filter(isActive).sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-30 border-b-2 border-cic-dark bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="shrink-0" aria-label="Coding in Color home">
            <Logo className="h-9 w-auto" />
          </Link>
          <span className="hidden rounded-full bg-cic-tint px-3 py-1 text-sm font-bold text-cic-darker sm:inline">
            {roleLabel}
          </span>
          <div className="ml-auto flex items-center gap-3">{topRight}</div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <nav aria-label="Main" className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-56 shrink-0 border-r border-cic-line p-3 md:block">
          <ul className="space-y-1">
            {nav.map((item) => {
              const on = item === active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={on ? "page" : undefined}
                    className={cx(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 font-bold",
                      on ? "bg-cic-dark text-white" : "text-black hover:bg-cic-tint",
                    )}
                  >
                    <item.Icon aria-hidden className="size-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 pt-6 pb-28 md:px-8 md:pb-12">
          {children}
        </main>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-cic-line bg-white md:hidden">
        <ul className="flex">
          {nav.slice(0, 5).map((item) => {
            const on = item === active;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={cx(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-bold",
                    on ? "text-cic-dark" : "text-cic-muted",
                  )}
                >
                  <item.Icon aria-hidden className={cx("size-5", on && "text-cic-dark")} />
                  {item.label}
                  {on && <span aria-hidden className="mt-0.5 h-1 w-6 rounded-full bg-cic-dark" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
