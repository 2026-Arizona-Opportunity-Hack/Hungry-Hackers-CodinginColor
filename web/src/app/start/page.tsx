"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Compass, Infinity as InfinityIcon, Sparkles, UserPlus } from "lucide-react";
import { Brackets, Button, Loading, Logo } from "@/components/ui";
import { signInWithPassword } from "@/lib/sign-in";

const input = "mt-1 block min-h-12 w-full rounded-xl border-2 border-cic-line px-3 focus:border-cic-dark";

/** Self-learner sign-up: no class needed. We create the account, sign them in and open their lessons. */
export default function StartPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Enter your name.");
    if (password.length < 8) return setError("Choose a password with at least 8 characters.");
    setBusy(true);
    try {
      const res = await fetch("/api/learner/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Something went wrong. Please try again.");
        return;
      }
      const result = await signInWithPassword(email, password);
      if (!result.ok) {
        setError(`Your account was created, but ${result.message.charAt(0).toLowerCase()}${result.message.slice(1)} Try signing in.`);
        return;
      }
      router.replace("/learn/course");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-cic-dark">
      <Brackets className="pointer-events-none absolute -top-16 -left-24 w-[28rem] text-cic-green opacity-30" />
      <Brackets className="pointer-events-none absolute -right-24 -bottom-16 w-[32rem] text-cic-darker" />
      <main id="main" tabIndex={-1} className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_0_var(--color-cic-darker)] md:p-8">
          <Logo variant="stacked" className="mx-auto h-auto w-28" />
          <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-center font-display text-3xl text-cic-dark">
            Learn on your own
          </h1>
          <p className="mt-1 text-center text-cic-muted">Make a free account and learn at your own pace. No class needed.</p>

          <ul className="mt-5 space-y-2 rounded-2xl bg-cic-tint p-4 text-sm">
            <li className="flex items-center gap-2">
              <Compass aria-hidden className="size-5 shrink-0 text-cic-dark" /> Pick any module, in any order
            </li>
            <li className="flex items-center gap-2">
              <Sparkles aria-hidden className="size-5 shrink-0 text-cic-dark" /> New modules appear for you automatically
            </li>
            <li className="flex items-center gap-2">
              <InfinityIcon aria-hidden className="size-5 shrink-0 text-cic-dark" /> Your progress is saved to your account
            </li>
          </ul>

          <form onSubmit={submit} className="mt-6" noValidate>
            <label htmlFor="name" className="block font-bold">
              Your name
            </label>
            <input id="name" autoComplete="name" maxLength={80} required value={name} onChange={(e) => setName(e.target.value)} className={input} />
            <label htmlFor="email" className="mt-4 block font-bold">
              Email
            </label>
            <input id="email" type="email" autoComplete="email" maxLength={120} required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            <label htmlFor="password" className="mt-4 block font-bold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="pw-help"
              className={input}
            />
            <p id="pw-help" className="mt-1 text-sm text-cic-muted">
              At least 8 characters.
            </p>
            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-cic-danger-bg p-3 text-cic-danger">
                {error}
              </p>
            )}
            <Button type="submit" className="mt-6 w-full text-lg" disabled={busy || !name || !email || !password}>
              {busy ? <Loading inline label="Creating your account" /> : <><UserPlus aria-hidden className="size-5" /> Create my account</>}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login?next=/learn" className="font-bold text-cic-dark underline">
              Sign in
            </Link>
          </p>
          <Link href="/" className="mt-3 inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline">
            <ArrowLeft aria-hidden className="size-4" /> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
