"use client";

import { BookOpen, LayoutDashboard, PlusCircle, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Loading } from "@/components/ui";
import { selectClass, useTeacherClass } from "@/lib/use-teacher";

const NAV: NavItem[] = [
  { href: "/teach", label: "Overview", Icon: LayoutDashboard, prefix: false },
  { href: "/teach/roster", label: "Roster", Icon: Users },
  { href: "/teach/new", label: "New class", Icon: PlusCircle },
  { href: "/curriculum", label: "Curriculum", Icon: BookOpen },
];

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  const ctx = useTeacherClass();
  if (!ctx) return <Loading label="Loading your classes…" />;

  return (
    <AppShell
      nav={NAV}
      roleLabel="Teacher"
      topRight={
        <>
          <label htmlFor="class-switcher" className="sr-only">
            Current class
          </label>
          <select
            id="class-switcher"
            value={ctx.cls.id}
            onChange={(e) => selectClass(e.target.value)}
            className="min-h-11 max-w-[11rem] rounded-xl border-2 border-cic-line bg-white px-2 text-sm font-bold sm:max-w-xs"
          >
            {ctx.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.school}
              </option>
            ))}
          </select>
          <span className="hidden text-sm font-bold md:inline">{ctx.cls.teacherName}</span>
        </>
      }
    >
      <p className="mb-4 rounded-xl bg-cic-warn-bg px-4 py-2 text-sm text-cic-warn">
        Demo mode: teacher sign-in arrives with the backend. Data shown is the sample Maryvale cohort plus anything you create in this browser.
      </p>
      {children}
    </AppShell>
  );
}
