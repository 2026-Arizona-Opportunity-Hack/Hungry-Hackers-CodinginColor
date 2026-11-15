"use client";

import { BookOpen, Building2, GraduationCap, LayoutDashboard, LogOut, PencilRuler } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { signOutTeacher } from "@/lib/teacher-store";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, prefix: false },
  { href: "/admin/schools", label: "Schools", Icon: Building2 },
  { href: "/admin/curriculum", label: "Curriculum", Icon: PencilRuler },
  { href: "/teach", label: "Classes", Icon: GraduationCap },
  { href: "/review", label: "Live view", Icon: BookOpen },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function signOut() {
    await signOutTeacher();
    router.replace("/login");
    router.refresh();
  }

  return (
    <AppShell
      nav={NAV}
      roleLabel="CIC Admin"
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
