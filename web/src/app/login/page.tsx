"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Info, LogIn } from "lucide-react";
import { Brackets, Button, Logo } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

// Public on purpose: a plain teacher account that only sees the sample class.
// Created by `npm run seed:demo`.
const DEMO_EMAIL = "demo.teacher@example.com";
const DEMO_PASSWORD = "CICdemo-2026!";

/** Only allow redirects back into /teach so `?next=` can't send people elsewhere. */
function safeNext(): string {
  if (typeof window === "undefined") return "/teach";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/teach") && !next.startsWith("//") ? next : "/teach";
}

export default function LoginPage() {
  const router = useRouter();
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
    router.replace(safeNext());
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
            Teacher sign in
          </h1>
          <p className="mt-1 text-center text-cic-muted">See your classes, rosters and student progress.</p>

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

          <section aria-labelledby="trial" className="mt-6 rounded-2xl bg-cic-tint p-4">
            <h2 id="trial" className="flex items-center gap-2 font-bold text-cic-darker">
              <Info aria-hidden className="size-5" /> Just looking around?
            </h2>
            <p className="mt-1 text-sm">
              Use the trial account to explore a sample class of 24 students.
            </p>
            <dl className="mt-2 text-sm">
              <div className="flex gap-2">
                <dt className="font-bold">Email:</dt>
                <dd className="font-mono">{DEMO_EMAIL}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold">Password:</dt>
                <dd className="font-mono">{DEMO_PASSWORD}</dd>
              </div>
            </dl>
            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full"
              disabled={busy}
              onClick={(e) => signIn(e, { email: DEMO_EMAIL, password: DEMO_PASSWORD })}
            >
              Sign in with the trial account
            </Button>
          </section>

          <Link href="/" className="mt-4 inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline">
            <ArrowLeft aria-hidden className="size-4" /> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
