"use client";

import { BookOpen, Eye, LayoutDashboard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { introAiCourse } from "@/lib/curriculum/intro-ai";
import { signOutTeacher } from "@/lib/teacher-store";

const NAV: NavItem[] = [
  { href: "/review", label: "Overview", Icon: LayoutDashboard, prefix: false },
  { href: `/review/module/${introAiCourse.modules[0].id}`, label: "Modules", Icon: BookOpen },
  { href: "/curriculum", label: "Public catalog", Icon: Eye },
];

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function signOut() {
    await signOutTeacher();
    router.replace("/login");
    router.refresh();
  }

  return (
    <AppShell
      nav={NAV}
      roleLabel="Reviewer · read only"
      topRight={
        <Button variant="ghost" onClick={signOut}>
          <LogOut aria-hidden className="size-4" /> Sign out
        </Button>
      }
    >
      {children}
    </AppShell>
  );
}
