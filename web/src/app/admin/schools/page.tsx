"use client";

import { Check, Copy, KeyRound, UserPlus } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Card, Loading, PageTitle } from "@/components/ui";
import { onboard, type OnboardResult } from "@/lib/admin-store";
import { useAdmin } from "@/lib/use-admin";

type Mode = "new" | "existing" | "reviewer";

const input = "mt-1 block min-h-12 w-full rounded-xl border-2 border-cic-line px-3 focus:border-cic-dark";

export default function SchoolsPage() {
  const { data, summaries, error } = useAdmin();
  const [mode, setMode] = useState<Mode>("new");
  const [schoolId, setSchoolId] = useState("");
  const [school, setSchool] = useState({ name: "", city: "", contactName: "", contactEmail: "" });
  const [teacher, setTeacher] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<{ result: OnboardResult; schoolName: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const doneRef = useRef<HTMLDivElement>(null);

  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-cic-danger-bg p-4 text-cic-danger">
        <strong>We couldn&apos;t load schools.</strong> {error}
      </p>
    );
  }
  if (!data) return <Loading label="Loading schools…" />;

  const teachersBySchool = (id: string) => data.teachers.filter((t) => t.schoolId === id);
  const classesBySchool = (id: string) => summaries.filter((s) => s.cls.schoolId === id);
  const hasPerson = teacher.name.trim() || teacher.email.trim();
  const personLabel = mode === "reviewer" ? "Reviewer" : "Teacher";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setProblem(null);
    if (mode === "existing" && !schoolId) return setProblem("Pick a school.");
    if (mode !== "new" && !(teacher.name.trim() && teacher.email.trim())) return setProblem(`Enter the ${personLabel.toLowerCase()}'s name and email.`);
    if (mode === "new" && !school.name.trim()) return setProblem("Enter the school's name.");
    if (hasPerson && !(teacher.name.trim() && teacher.email.trim())) return setProblem("Enter both a name and an email, or leave both empty.");
    setBusy(true);
    try {
      const result = await onboard({
        ...(mode === "existing" ? { schoolId } : mode === "new" ? { school } : {}),
        ...(hasPerson ? { account: { role: mode === "reviewer" ? ("reviewer" as const) : ("teacher" as const), ...teacher } } : {}),
      });
      const name = mode === "existing" ? (data!.schools.find((s) => s.id === schoolId)?.name ?? "the school") : mode === "new" ? school.name.trim() : "";
      setDone({ result, schoolName: name });
      setCopied(false);
      setSchool({ name: "", city: "", contactName: "", contactEmail: "" });
      setTeacher({ name: "", email: "" });
      setTimeout(() => doneRef.current?.focus(), 0);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLogin() {
    if (!done?.result.account) return;
    const origin = window.location.origin;
    try {
      await navigator.clipboard.writeText(
        `Welcome to CIC Learn! Sign in at ${origin}/login\nEmail: ${done.result.account.email}\nTemporary password: ${done.result.account.tempPassword}`,
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <PageTitle title="Partner schools" subtitle="Bring a new school on in a minute. Add the school, then create its teacher's login." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section aria-labelledby="add-heading">
          <Card>
            <h2 id="add-heading" className="mb-4 flex items-center gap-2 text-xl font-bold text-cic-dark">
              <UserPlus aria-hidden className="size-5" /> Add a school, teacher or reviewer
            </h2>

            <form onSubmit={submit} noValidate>
              <fieldset className="mb-4">
                <legend className="font-bold">What are you adding?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      ["new", "A new school"],
                      ["existing", "A teacher at an existing school"],
                      ["reviewer", "An external reviewer"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-2 border-cic-line px-4 font-bold has-[:checked]:border-cic-dark has-[:checked]:bg-cic-tint has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-cic-dark"
                    >
                      <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {mode === "reviewer" ? (
                <p className="mb-4 rounded-xl bg-cic-tint p-3 text-sm">Reviewers get read-only access to the whole curriculum. They don&apos;t need a school and can&apos;t see any student data.</p>
              ) : mode === "existing" ? (
                <div className="mb-4">
                  <label htmlFor="school-pick" className="font-bold">
                    School
                  </label>
                  <select id="school-pick" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className={input}>
                    <option value="">Choose a school…</option>
                    {data.schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.city ? ` · ${s.city}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="school-name" className="font-bold">
                      School name
                    </label>
                    <input id="school-name" required maxLength={80} value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} className={input} placeholder="Maryvale High School" />
                  </div>
                  <div>
                    <label htmlFor="school-city" className="font-bold">
                      City
                    </label>
                    <input id="school-city" maxLength={80} value={school.city} onChange={(e) => setSchool({ ...school, city: e.target.value })} className={input} placeholder="Phoenix" />
                  </div>
                  <div>
                    <label htmlFor="contact-name" className="font-bold">
                      School contact
                    </label>
                    <input id="contact-name" maxLength={80} value={school.contactName} onChange={(e) => setSchool({ ...school, contactName: e.target.value })} className={input} placeholder="Principal or coordinator" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="contact-email" className="font-bold">
                      Contact email <span className="font-normal text-cic-muted">(optional)</span>
                    </label>
                    <input id="contact-email" type="email" maxLength={120} value={school.contactEmail} onChange={(e) => setSchool({ ...school, contactEmail: e.target.value })} className={input} />
                  </div>
                </div>
              )}

              <fieldset className="rounded-2xl bg-cic-tint p-4">
                <legend className="px-1 font-bold text-cic-darker">
                  {personLabel} login {mode === "new" && <span className="font-normal">(optional, can add later)</span>}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="teacher-name" className="font-bold">
                      {personLabel}&apos;s name
                    </label>
                    <input id="teacher-name" maxLength={80} value={teacher.name} onChange={(e) => setTeacher({ ...teacher, name: e.target.value })} className={input} placeholder={mode === "reviewer" ? "Dana Whitfield" : "Ms. Rivera"} />
                  </div>
                  <div>
                    <label htmlFor="teacher-email" className="font-bold">
                      {personLabel}&apos;s email
                    </label>
                    <input id="teacher-email" type="email" maxLength={120} autoComplete="off" value={teacher.email} onChange={(e) => setTeacher({ ...teacher, email: e.target.value })} className={input} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-cic-muted">We create their login with a temporary password and show it to you once. No engineer needed.</p>
              </fieldset>

              {problem && (
                <p role="alert" className="mt-4 rounded-lg bg-cic-danger-bg p-3 font-bold text-cic-danger">
                  {problem}
                </p>
              )}
              <Button type="submit" className="mt-5 w-full text-lg" disabled={busy}>
                {busy ? <Loading inline label="Saving" /> : mode === "new" ? "Add school" : mode === "reviewer" ? "Add reviewer" : "Add teacher"}
              </Button>
            </form>
          </Card>

          {done && (
            <div ref={doneRef} tabIndex={-1} role="status" className="mt-6 rounded-[var(--radius-card)] border-2 border-cic-dark bg-cic-tint p-5">
              <p className="flex items-center gap-2 font-bold text-cic-darker">
                <Check aria-hidden className="size-5" /> {done.result.account
                  ? done.result.account.role === "reviewer"
                    ? "Reviewer added."
                    : `Teacher added to ${done.schoolName}.`
                  : `${done.schoolName} added.`}
              </p>
              {done.result.account && (
                <>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold">
                    <KeyRound aria-hidden className="size-4" /> Share this login now. The password won&apos;t be shown again.
                  </p>
                  <dl className="mt-2 rounded-xl bg-white p-3">
                    <div className="flex flex-wrap gap-2">
                      <dt className="font-bold">Email:</dt>
                      <dd className="font-mono break-all">{done.result.account.email}</dd>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <dt className="font-bold">Temporary password:</dt>
                      <dd className="font-mono">{done.result.account.tempPassword}</dd>
                    </div>
                  </dl>
                  <Button variant="secondary" className="mt-3" onClick={copyLogin}>
                    <Copy aria-hidden className="size-4" /> {copied ? "Copied!" : "Copy login message"}
                  </Button>
                </>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="list-heading">
          <h2 id="list-heading" className="mb-3 text-xl font-bold text-cic-dark">
            {data.schools.length} partner school{data.schools.length === 1 ? "" : "s"}
          </h2>
          <ul className="space-y-3">
            {data.schools.map((s) => {
              const classes = classesBySchool(s.id);
              const teachers = teachersBySchool(s.id);
              return (
                <li key={s.id}>
                  <Card className="p-4">
                    <h3 className="text-lg font-bold">{s.name}</h3>
                    <p className="text-sm text-cic-muted">
                      {[s.city, s.state].filter(Boolean).join(", ")}
                      {s.contactName ? ` · Contact: ${s.contactName}` : ""}
                      {s.contactEmail ? ` (${s.contactEmail})` : ""}
                    </p>
                    <p className="mt-2 text-sm">
                      <strong>{classes.length}</strong> cohort{classes.length === 1 ? "" : "s"} · <strong>{classes.reduce((n, c) => n + c.students, 0)}</strong> students
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-bold">Teachers: </span>
                      {teachers.length ? teachers.map((t) => `${t.name} (${t.email})`).join(", ") : <span className="text-cic-muted">none yet</span>}
                    </p>
                  </Card>
                </li>
              );
            })}
            {data.schools.length === 0 && <li className="text-cic-muted">No schools yet. Add the first one.</li>}
          </ul>

          <h2 className="mt-8 mb-3 text-xl font-bold text-cic-dark">
            {data.reviewers.length} external reviewer{data.reviewers.length === 1 ? "" : "s"}
          </h2>
          <ul className="space-y-2">
            {data.reviewers.map((r) => (
              <li key={r.id}>
                <Card className="p-3">
                  <p className="font-bold">{r.name}</p>
                  <p className="text-sm text-cic-muted">{r.email} · read-only curriculum access</p>
                </Card>
              </li>
            ))}
            {data.reviewers.length === 0 && <li className="text-cic-muted">No reviewers yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
