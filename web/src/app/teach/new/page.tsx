"use client";

import { ArrowLeft, ArrowRight, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RosterImport } from "@/components/roster-import";
import { Button, Card, LinkButton, Loading, PageTitle, cx } from "@/components/ui";
import type { RosterParseResult } from "@/lib/csv";
import { getCourses } from "@/lib/repo";
import { createClass } from "@/lib/teacher-store";
import type { Classroom } from "@/lib/types";
import { selectClass } from "@/lib/use-teacher";

const STEPS = ["Class details", "Add students", "Pick modules", "Share the code"];

export default function NewClassWizard() {
  const course = getCourses()[0];
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [teacher, setTeacher] = useState("");
  const [roster, setRoster] = useState<RosterParseResult | null>(null);
  const [moduleIds, setModuleIds] = useState(course.modules.map((m) => m.id));
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Classroom | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  async function next() {
    setError(null);
    if (step === 0 && (!name.trim() || !school.trim() || !teacher.trim())) {
      return setError("Please fill in the class name, school and your name.");
    }
    if (step === 1 && !roster?.students.length) {
      return setError("Add at least one student. You can use the sample roster to try it out.");
    }
    if (step === 2) {
      if (moduleIds.length === 0) return setError("Pick at least one module.");
      setSaving(true);
      try {
        const cls = await createClass({
          name: name.trim().slice(0, 60),
          school: school.trim().slice(0, 60),
          teacherName: teacher.trim().slice(0, 40),
          courseId: course.id,
          // Keep the course order even if modules were toggled out of order.
          assignedModuleIds: course.modules.map((m) => m.id).filter((m) => moduleIds.includes(m)),
          roster: roster!.students,
        });
        selectClass(cls.id);
        setCreated(cls);
      } catch (e) {
        setError(`We couldn't save the class: ${e instanceof Error ? e.message : "please try again"}.`);
        return;
      } finally {
        setSaving(false);
      }
    }
    setStep((s) => s + 1);
  }

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join` : "/join";

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Create a class" subtitle={course.title} />

      <ol aria-label="Setup steps" className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <div className={cx("h-2 rounded-full", i < step ? "bg-cic-green" : i === step ? "bg-cic-dark" : "bg-cic-tint ring-1 ring-cic-line ring-inset")} />
            <p className={cx("mt-1 text-xs font-bold sm:text-sm", i === step ? "text-cic-dark" : "text-cic-muted")}>
              {i + 1}. {label}
              <span className="sr-only">{i < step ? " — done" : i === step ? " — current step" : ""}</span>
            </p>
          </li>
        ))}
      </ol>

      <Card>
        <h2 ref={headingRef} tabIndex={-1} className="mb-4 text-xl font-bold text-cic-dark">
          {STEPS[step]}
        </h2>

        {step === 0 && (
          <div className="grid gap-4">
            {[
              { id: "cname", label: "Class name", value: name, set: setName, ph: "Intro to AI — Period 2" },
              { id: "school", label: "School or site", value: school, set: setSchool, ph: "Maryvale High School" },
              { id: "teacher", label: "Your name (shown to students)", value: teacher, set: setTeacher, ph: "Ms. Rivera" },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="font-bold">
                  {f.label}
                </label>
                <input
                  id={f.id}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  maxLength={60}
                  placeholder={f.ph}
                  required
                  className="mt-1 block min-h-11 w-full rounded-xl border-2 border-cic-line px-3"
                />
              </div>
            ))}
          </div>
        )}

        {step === 1 && <RosterImport seedOffset={0} onParsed={setRoster} />}

        {step === 2 && (
          <fieldset>
            <legend className="mb-2 text-cic-muted">Students see these modules in order. You can add more later.</legend>
            <ul className="space-y-2">
              {course.modules.map((m) => (
                <li key={m.id}>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border-2 border-cic-line p-3 has-[:checked]:border-cic-dark has-[:checked]:bg-cic-tint">
                    <input
                      type="checkbox"
                      checked={moduleIds.includes(m.id)}
                      onChange={(e) => setModuleIds((ids) => (e.target.checked ? [...ids, m.id] : ids.filter((x) => x !== m.id)))}
                      className="mt-1 size-5 accent-cic-dark"
                    />
                    <span>
                      <span className="block font-bold">
                        Module {m.number}: {m.title}
                      </span>
                      <span className="text-sm text-cic-muted">
                        {m.activities.length} activities · about {m.activities.reduce((n, a) => n + a.minutes, 0)} min
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        {step === 3 && created && (
          <div role="status">
            <p className="flex items-center gap-2 font-bold text-cic-darker">
              <Check aria-hidden className="size-5" /> {created.name} is ready with {created.roster.length} students.
            </p>
            <div className="mt-4 rounded-xl bg-cic-tint p-5 text-center">
              <p className="text-sm font-bold text-cic-muted">Students go to {joinUrl} and enter</p>
              <p className="font-mono text-5xl font-bold tracking-widest text-cic-darker">{created.code}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`Join our class at ${joinUrl} with code ${created.code}`);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                <Copy aria-hidden className="size-4" /> {copied ? "Copied!" : "Copy join message"}
              </Button>
              <LinkButton href="/teach/roster" variant="secondary">
                Print picture codes
              </LinkButton>
              <LinkButton href="/teach">Go to class overview</LinkButton>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 font-bold text-cic-danger">
            {error}
          </p>
        )}

        {step < 3 && (
          <div className="mt-6 flex justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              <ArrowLeft aria-hidden className="size-4" /> Back
            </Button>
            <Button onClick={next} disabled={saving}>
              {step === 2 && saving ? (
                <Loading inline label="Creating class" />
              ) : (
                <>
                  {step === 2 ? "Create class" : "Next"} <ArrowRight aria-hidden className="size-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
