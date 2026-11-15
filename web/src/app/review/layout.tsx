"use client";

import { BookOpen, Eye, LayoutDashboard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { useCourses } from "@/lib/repo";
import { signOutTeacher } from "@/lib/teacher-store";

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const firstModule = useCourses()[0]?.modules[0]?.id ?? "m1";
  const nav: NavItem[] = [
    { href: "/review", label: "Overview", Icon: LayoutDashboard, prefix: false },
    { href: `/review/module/${firstModule}`, label: "Answer keys", Icon: BookOpen },
    { href: "/curriculum", label: "Public catalog", Icon: Eye },
  ];

  async function signOut() {
    await signOutTeacher();
    router.replace("/");
    router.refresh();
  }

  return (
    <AppShell
      nav={nav}
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
