"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarChart3, Flame, Home, LogOut, Map, Star } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Loading } from "@/components/ui";
import { clearSession, useCurriculumReady } from "@/lib/repo";
import { useStudent } from "@/lib/use-student";

const NAV: NavItem[] = [
  { href: "/learn", label: "Home", Icon: Home, prefix: false },
  { href: "/learn/course", label: "Course", Icon: Map },
  { href: "/learn/results", label: "My progress", Icon: BarChart3 },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const ctx = useStudent();
  const router = useRouter();
  const ready = useCurriculumReady();

  useEffect(() => {
    if (ctx === null) router.replace("/join");
  }, [ctx, router]);

  if (!ctx || !ready) return <Loading label={ctx === null ? "Taking you to sign in…" : "Loading your lessons…"} />;

  return (
    <AppShell
      nav={NAV}
      roleLabel="Student"
      topRight={
        <>
          <span className="hidden items-center gap-1 text-sm font-bold sm:inline-flex">
            <Flame aria-hidden className="size-5 text-cic-warn" />
            <span className="sr-only">Streak:</span> {ctx.progress.streakDays} day{ctx.progress.streakDays === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold">
            <Star aria-hidden className="size-5 text-cic-dark" />
            <span className="sr-only">Experience points:</span> {ctx.xp} XP
          </span>
          <span className="hidden font-bold md:inline">
            {ctx.student.firstName} {ctx.student.lastInitial}.
          </span>
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.push("/");
            }}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-cic-dark hover:bg-cic-tint"
          >
            <LogOut aria-hidden className="size-4" /> Leave
          </button>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
