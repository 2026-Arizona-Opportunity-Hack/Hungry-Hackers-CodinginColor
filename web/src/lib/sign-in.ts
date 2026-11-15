"use client";

import { createClient } from "@supabase/supabase-js";
import { loadServerProgress, setJoinedClass, setSession } from "./repo";
import { asRole, type Role } from "./roles";
import { supabaseBrowserFor } from "./supabase/client";
import { clearDemoSandbox } from "./teacher-store";
import type { Classroom } from "./types";

/** After a learner's login is stored, start their student session so the lesson screens work. */
async function startLearnerSession(): Promise<boolean> {
  const res = await fetch("/api/learner/session", { method: "POST" });
  if (!res.ok) return false;
  const cls = (await res.json()) as Classroom;
  setJoinedClass(cls);
  setSession({ classId: cls.id, studentId: cls.roster[0].id });
  await loadServerProgress();
  return true;
}

export type SignInResult = { ok: true; role: Role } | { ok: false; message: string };

/**
 * Signs in with email and password for ANY role. A throwaway client signs in first (it never
 * refreshes tokens or stores anything), finds the account's role, then the session is kept
 * under THAT role's own login cookie, so a teacher, an admin, a reviewer and a learner can
 * all be signed in side by side in one browser. Learners also get their lesson session.
 */
export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  const probe = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await probe.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.session) return { ok: false, message: "That email and password don't match. Check them and try again." };

  const profile = await probe.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = asRole(profile.data?.role);
  const saved = await supabaseBrowserFor(role).auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  if (saved.error) return { ok: false, message: "We couldn't start your session. Please try again." };
  // Every sign-in starts the trial teacher's sandbox fresh.
  clearDemoSandbox();

  if (role === "learner" && !(await startLearnerSession())) {
    return { ok: false, message: "We couldn't open your lessons. Please try again." };
  }
  return { ok: true, role };
}

/** For learners: also end their login when they leave, so "Leave" really signs them out. */
export function signOutLearner() {
  void supabaseBrowserFor("learner").auth.signOut({ scope: "local" });
}
