"use client";

import { BookOpen, Building2, GraduationCap, LayoutDashboard, LogOut, PencilRuler } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { DEMO_ADMIN_EMAIL } from "@/lib/demo-accounts";
import { supabaseBrowser } from "@/lib/supabase/client";
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
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    void supabaseBrowser()
      .auth.getUser()
      .then((r: { data: { user: { email?: string } | null } }) => setIsDemo(r.data.user?.email?.toLowerCase() === DEMO_ADMIN_EMAIL));
  }, []);

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
      {isDemo && (
        <p role="note" className="mb-4 rounded-xl bg-cic-warn-bg px-4 py-2 text-sm text-cic-warn">
          <strong>Demo admin.</strong> Look around freely and try the editor. Publishing curriculum and adding schools or accounts are turned off for this login.
        </p>
      )}
      {children}
    </AppShell>
  );
}
