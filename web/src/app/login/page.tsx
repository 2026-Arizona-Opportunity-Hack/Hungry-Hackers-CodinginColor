"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Info, LogIn } from "lucide-react";
import { Brackets, Button, Logo } from "@/components/ui";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/demo-accounts";
import { asRole, homeFor, ROLE_LABELS, safeNextPath, type Role } from "@/lib/roles";
import { supabaseBrowser } from "@/lib/supabase/client";

// Public on purpose: a teacher who only sees the sample class, and a reviewer
// who only sees the curriculum, and a CIC admin with full powers for the demo.
// Created by `npm run seed:demo`. Rotate or remove these before real use.
const TRIALS = [
  { id: "teacher", label: "Teacher", note: "Explore a sample class of 24 students.", email: "demo.teacher@example.com", password: "CICdemo-2026!" },
  { id: "admin", label: "CIC Admin", note: "Full access: every school and cohort, grant numbers, the curriculum editor with publishing, and adding schools and accounts.", email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD },
  { id: "reviewer", label: "External reviewer", note: "Read the whole curriculum, answer keys included.", email: "demo.reviewer@example.com", password: "CICreview-2026!" },
];

const VARIANTS = {
  teacher: { title: "Sign in", blurb: "For teachers, CIC staff and curriculum reviewers.", trials: ["teacher", "admin", "reviewer"] },
  admin: {
    title: "CIC Admin sign in",
    blurb: "See every class and school, pull grant numbers, add partner schools and publish curriculum.",
    trials: ["admin"],
  },
  reviewer: { title: "Reviewer sign in", blurb: "Read-only access to the full curriculum, answer keys included.", trials: ["reviewer"] },
};

export default function LoginPage() {
  const router = useRouter();
  const [variant, setVariant] = useState<keyof typeof VARIANTS>("teacher");
  const [wrongRole, setWrongRole] = useState<Role | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wrong = params.get("wrong");
    setWrongRole(wrong === "teacher" || wrong === "admin" || wrong === "reviewer" ? wrong : null);
    const next = params.get("next") ?? "";
    setVariant(next.startsWith("/admin") ? "admin" : next.startsWith("/review") ? "reviewer" : "teacher");
  }, []);
  const v = VARIANTS[variant];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function signIn(e: React.FormEvent, creds = { email, password }) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithPassword({
      email: creds.email.trim(),
      password: creds.password,
    });
    if (error) {
      setBusy(false);
      setError("That email and password don't match. Check them and try again.");
      return;
    }
    // Send each role to its own area (teacher, CIC admin or reviewer).
    const db = supabaseBrowser();
    const {
      data: { user },
    } = await db.auth.getUser();
    const profile = user ? await db.from("profiles").select("role").eq("id", user.id).maybeSingle() : null;
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(safeNextPath(next, asRole(profile?.data?.role)));
    router.refresh();
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-cic-dark">
      <Brackets className="pointer-events-none absolute -top-16 -left-24 w-[28rem] text-cic-green opacity-30" />
      <Brackets className="pointer-events-none absolute -right-24 -bottom-16 w-[32rem] text-cic-darker" />
      <main id="main" tabIndex={-1} className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_0_var(--color-cic-darker)] md:p-8">
          <Logo variant="stacked" className="mx-auto h-auto w-28" />
          <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-center font-display text-3xl text-cic-dark">
            {v.title}
          </h1>
          <p className="mt-1 text-center text-cic-muted">{v.blurb}</p>

          {wrongRole && (
            <div role="alert" className="mt-5 rounded-xl bg-cic-warn-bg p-3 text-sm text-cic-warn">
              <p className="font-bold">You&apos;re signed in as a {ROLE_LABELS[wrongRole]}, and that page is for a different role.</p>
              <p className="mt-1">
                This browser holds one login at a time, so signing in as someone else in another tab or window replaces it. Sign in below with the right account, or{" "}
                <Link href={homeFor(wrongRole)} className="font-bold underline">
                  continue as {ROLE_LABELS[wrongRole]}
                </Link>
                . To use two accounts side by side, use a private window for the second one.
              </p>
            </div>
          )}

          <form onSubmit={signIn} className="mt-6" noValidate>
            <label htmlFor="email" className="block font-bold">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              required
              className="mt-1 block min-h-12 w-full rounded-xl border-2 border-cic-line px-3 focus:border-cic-dark"
            />
            <label htmlFor="password" className="mt-4 block font-bold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              required
              className="mt-1 block min-h-12 w-full rounded-xl border-2 border-cic-line px-3 focus:border-cic-dark"
            />
            {error && (
              <p id="login-error" role="alert" className="mt-3 rounded-lg bg-cic-danger-bg p-3 text-cic-danger">
                {error}
              </p>
            )}
            <Button type="submit" className="mt-6 w-full text-lg" disabled={busy || !email || !password}>
              <LogIn aria-hidden className="size-5" /> {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {v.trials.length > 0 ? (
          <section aria-labelledby="trial" className="mt-6 rounded-2xl bg-cic-tint p-4">
            <h2 id="trial" className="flex items-center gap-2 font-bold text-cic-darker">
              <Info aria-hidden className="size-5" /> Just looking around?
            </h2>
            <p className="mt-1 text-sm">Use a trial account. Students don&apos;t sign in; they join from the home page with a class code.</p>
            <ul className="mt-3 space-y-3">
              {TRIALS.filter((t) => v.trials.includes(t.id)).map((t) => (
                <li key={t.id} className="rounded-xl bg-white p-3">
                  <p className="font-bold">{t.label}</p>
                  <p className="text-sm text-cic-muted">{t.note}</p>
                  <dl className="mt-1 text-sm">
                    <div className="flex gap-2">
                      <dt className="font-bold">Email:</dt>
                      <dd className="font-mono break-all">{t.email}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-bold">Password:</dt>
                      <dd className="font-mono">{t.password}</dd>
                    </div>
                  </dl>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-2 w-full"
                    disabled={busy}
                    onClick={(e) => signIn(e, { email: t.email, password: t.password })}
                  >
                    Sign in as {t.label.toLowerCase()}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
          ) : (
            <p className="mt-6 rounded-2xl bg-cic-tint p-4 text-sm">
              Admin accounts are created by the CIC team. Use the email and password you were given.
            </p>
          )}

          <Link href="/" className="mt-4 inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline">
            <ArrowLeft aria-hidden className="size-4" /> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
