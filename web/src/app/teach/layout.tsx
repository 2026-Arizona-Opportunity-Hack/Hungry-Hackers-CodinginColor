"use client";

import { BookOpen, LayoutDashboard, LogOut, PlusCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Button, Loading } from "@/components/ui";
import { signOutTeacher } from "@/lib/teacher-store";
import { selectClass, useTeacherClass } from "@/lib/use-teacher";

const NAV: NavItem[] = [
  { href: "/teach", label: "Overview", Icon: LayoutDashboard, prefix: false },
  { href: "/teach/roster", label: "Roster", Icon: Users },
  { href: "/teach/new", label: "New class", Icon: PlusCircle },
  { href: "/curriculum", label: "Curriculum", Icon: BookOpen },
];

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ctx, error } = useTeacherClass();
  if (ctx === undefined && !error) return <Loading label="Loading your classes…" />;

  async function signOut() {
    await signOutTeacher();
    router.replace("/login");
    router.refresh();
  }

  return (
    <AppShell
      nav={NAV}
      roleLabel="Teacher"
      topRight={
        <>
          {ctx && (
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
          )}
          <Button variant="ghost" onClick={signOut}>
            <LogOut aria-hidden className="size-4" /> Sign out
          </Button>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
