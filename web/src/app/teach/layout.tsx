"use client";

import { BarChart3, BookOpen, ChevronDown, FlaskConical, LayoutDashboard, LogOut, PlusCircle, School, Sparkles, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Button, LinkButton, Loading } from "@/components/ui";
import { useCurriculumReady } from "@/lib/repo";
import { isDemoTeacher, signOutTeacher } from "@/lib/teacher-store";
import { selectClass, useTeacherClass } from "@/lib/use-teacher";

const NAV: NavItem[] = [
  { href: "/teach", label: "Overview", Icon: LayoutDashboard, prefix: false },
  { href: "/teach/insights", label: "Insights", Icon: BarChart3 },
  { href: "/teach/roster", label: "Roster", Icon: Users },
  { href: "/teach/assistant", label: "Assistant", Icon: Sparkles },
  { href: "/teach/new", label: "New class", Icon: PlusCircle },
  { href: "/curriculum", label: "Curriculum", Icon: BookOpen },
];

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { ctx, error } = useTeacherClass();
  const ready = useCurriculumReady();
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    isDemoTeacher().then(setDemo, () => setDemo(false));
  }, []);
  if ((ctx === undefined && !error) || !ready) return <Loading label="Loading your classes…" />;
  // The class picker isn't relevant while making a new class.
  const showSwitcher = ctx && path !== "/teach/new";

  async function signOut() {
    await signOutTeacher();
    router.replace("/");
    router.refresh();
  }

  return (
    <AppShell
      // The AI assistant is for real teacher accounts only, not the shared demo login.
      nav={demo ? NAV.filter((n) => n.href !== "/teach/assistant") : NAV}
      roleLabel="Teacher"
      topRight={
        <>
          {ctx && <span className="hidden text-sm font-bold md:inline">{ctx.cls.teacherName}</span>}
          <Button variant="ghost" onClick={signOut}>
            <LogOut aria-hidden className="size-4" /> Sign out
          </Button>
        </>
      }
    >
      {demo && (
        <p role="note" className="mb-4 flex items-start gap-2 rounded-2xl bg-cic-tint p-3 text-sm text-cic-darker print:hidden">
          <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Demo account.</strong> Try anything: new classes and students stay on this device only and reset when
            you sign out.
          </span>
        </p>
      )}
      {showSwitcher && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border-2 border-cic-line bg-white p-3 shadow-slab-gray print:hidden">
          <div className="min-w-0 flex-1">
            <label htmlFor="class-switcher" className="flex items-center gap-1.5 text-sm font-bold text-cic-muted">
              <School aria-hidden className="size-4" /> {ctx.classes.length > 1 ? "Change class" : "Your class"}
            </label>
            <div className="relative mt-1">
              <select
                id="class-switcher"
                value={ctx.cls.id}
                onChange={(e) => selectClass(e.target.value)}
                disabled={ctx.classes.length < 2}
                className="min-h-11 w-full cursor-pointer appearance-none truncate rounded-xl border-2 border-cic-dark bg-cic-tint py-2 pr-10 pl-3 font-bold text-cic-darker disabled:cursor-default disabled:border-cic-line disabled:bg-white"
              >
                {ctx.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.school} · code {c.code}
                  </option>
                ))}
              </select>
              {ctx.classes.length > 1 && (
                <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-cic-dark" />
              )}
            </div>
          </div>
          <LinkButton href="/teach/new" variant="secondary">
            <PlusCircle aria-hidden className="size-4" /> New class
          </LinkButton>
        </div>
      )}
      {children}
    </AppShell>
  );
}
