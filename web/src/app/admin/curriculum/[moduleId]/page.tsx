"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Lock, Plus, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ExitEditor, ListButtons, QuestionsEditor, SlidesEditor, TextField, WorksheetEditor } from "@/components/curriculum-editor";
import { Button, Card, EmptyState, LinkButton, Loading, PageTitle } from "@/components/ui";
import { blankActivity, CurriculumError, loadCurriculum, saveDraft, type CurriculumState } from "@/lib/curriculum/admin-client";
import { STAGE_LABELS, type Activity, type ActivityKind, type Module } from "@/lib/types";

const ADDABLE: Exclude<ActivityKind, "code">[] = ["pretest", "slides", "check", "worksheet", "exit", "posttest"];

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default function ModuleEditor() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [s, setS] = useState<CurriculumState | undefined>(undefined);
  const [mod, setMod] = useState<Module | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<{ text: string; list: string[] } | null>(null);
  const [remaining, setRemaining] = useState<string[]>([]);
  const [addKind, setAddKind] = useState<Exclude<ActivityKind, "code">>("check");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadCurriculum().then(
      (d) => {
        setS(d);
        setMod(d.draft.modules.find((m) => m.id === moduleId) ?? null);
        setRemaining(d.publishErrors);
      },
      (e: Error) => setLoadError(e.message),
    );
  }, [moduleId]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const publishedActivityIds = useMemo(() => new Set(s?.published.modules.flatMap((m) => m.activities.map((a) => a.id)) ?? []), [s]);

  if (loadError) {
    return (
      <p role="alert" className="rounded-xl bg-cic-danger-bg p-4 text-cic-danger">
        <strong>We couldn&apos;t load the editor.</strong> {loadError}
      </p>
    );
  }
  if (!s) return <Loading label="Loading the editor…" />;
  if (!mod) {
    return (
      <EmptyState title="Module not found" action={<LinkButton href="/admin/curriculum">Back to the curriculum</LinkButton>}>
        It may have been deleted.
      </EmptyState>
    );
  }

  const edit = (next: Module) => {
    setMod(next);
    setDirty(true);
    setSaved("");
  };
  const setActivity = (i: number, a: Activity) => edit({ ...mod, activities: mod.activities.map((x, k) => (k === i ? a : x)) });

  async function save() {
    if (!s || !mod) return;
    setBusy(true);
    setProblem(null);
    try {
      const modules = s.draft.modules.map((m) => (m.id === mod.id ? mod : m));
      const r = await saveDraft(s.courseId, { ...s.draft, modules });
      setSaved(`Draft saved at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Students won't see it until you publish.`);
      setRemaining(r.publishErrors);
      setDirty(false);
    } catch (e) {
      setProblem({ text: e instanceof Error ? e.message : "Couldn't save.", list: e instanceof CurriculumError ? e.problems : [] });
    } finally {
      setBusy(false);
    }
  }

  const mine = remaining.filter((e) => mod.title && e.includes(`"${mod.title}"`));

  return (
    <div>
      <Link href="/admin/curriculum" className="mb-3 inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline">
        <ArrowLeft aria-hidden className="size-4" /> All modules
      </Link>
      <PageTitle
        title={mod.title || "Untitled module"}
        subtitle="Build the module from top to bottom. Save as you go; students only see it once it's published."
        actions={
          <Button onClick={save} disabled={busy || !dirty}>
            <Save aria-hidden className="size-4" /> {busy ? "Saving…" : "Save draft"}
          </Button>
        }
      />

      <div aria-live="polite">
        {saved && (
          <p className="mb-4 flex items-center gap-2 rounded-xl bg-cic-tint p-3 font-bold text-cic-darker">
            <Check aria-hidden className="size-5" /> {saved}
          </p>
        )}
        {problem && (
          <div role="alert" className="mb-4 rounded-xl bg-cic-danger-bg p-3 text-cic-danger">
            <p className="font-bold">{problem.text}</p>
            {problem.list.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-sm">
                {problem.list.slice(0, 10).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {saved && mine.length > 0 && (
          <div className="mb-4 rounded-xl bg-cic-warn-bg p-3 text-cic-warn">
            <p className="font-bold">Still to finish before this can be published:</p>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {mine.slice(0, 8).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Card className="mb-6">
        <div className="grid gap-4">
          <TextField label="Module title" value={mod.title} onChange={(title) => edit({ ...mod, title })} max={80} />
          <TextField label="Short summary" help="One or two sentences students see on the course page." value={mod.summary} onChange={(summary) => edit({ ...mod, summary })} max={300} long />
        </div>
      </Card>

      <h2 className="mb-3 font-display text-2xl text-cic-dark">Steps, in the order students do them</h2>
      <ol className="space-y-3">
        {mod.activities.map((a, i) => {
          const locked = (a.kind === "pretest" || a.kind === "posttest") && publishedActivityIds.has(a.id);
          return (
            <li key={a.id}>
              <Card className="p-0">
                <details open={i === 0} className="group">
                  <summary className="flex min-h-14 cursor-pointer flex-wrap items-center justify-between gap-2 p-4">
                    <span>
                      <span className="mr-2 text-sm font-bold text-cic-muted">{i + 1}.</span>
                      <span className="mr-2 rounded-full bg-cic-tint px-2 py-0.5 text-xs font-bold text-cic-darker">{STAGE_LABELS[a.kind]}</span>
                      <span className="font-bold">{a.title || "Untitled step"}</span>
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-cic-line p-4">
                    {a.kind === "code" ? (
                      <p className="flex items-start gap-2 rounded-lg bg-cic-tint p-3 text-sm">
                        <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
                        Python exercises run code in students&apos; browsers, so the dev team edits them. You can move this step up or down.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                        <TextField label="Step title" value={a.title} onChange={(title) => setActivity(i, { ...a, title })} max={100} />
                        <TextField label="Minutes" type="number" value={String(a.minutes)} onChange={(v) => setActivity(i, { ...a, minutes: Math.max(1, Math.min(120, Number(v) || 1)) })} max={3} />
                      </div>
                    )}
                    {(a.kind === "pretest" || a.kind === "posttest" || a.kind === "check") && (
                      <QuestionsEditor
                        questions={a.questions}
                        locked={locked}
                        feedback={a.kind !== "pretest"}
                        max={a.kind === "check" ? 1 : 12}
                        onChange={(questions) => setActivity(i, { ...a, questions })}
                      />
                    )}
                    {a.kind === "slides" && <SlidesEditor a={a} onChange={(x) => setActivity(i, x)} />}
                    {a.kind === "worksheet" && <WorksheetEditor a={a} onChange={(x) => setActivity(i, x)} />}
                    {a.kind === "exit" && <ExitEditor a={a} onChange={(x) => setActivity(i, x)} />}
                    <div className="flex justify-end border-t border-cic-line pt-3">
                      <ListButtons
                        i={i}
                        length={mod.activities.length}
                        label={`step ${i + 1}`}
                        onMove={(d) => edit({ ...mod, activities: move(mod.activities, i, d) })}
                        onRemove={() => edit({ ...mod, activities: mod.activities.filter((_, k) => k !== i) })}
                      />
                    </div>
                  </div>
                </details>
              </Card>
            </li>
          );
        })}
      </ol>

      <Card className="mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="add-kind" className="font-bold">
              Add a step
            </label>
            <select id="add-kind" value={addKind} onChange={(e) => setAddKind(e.target.value as Exclude<ActivityKind, "code">)} className="mt-1 block min-h-11 rounded-xl border-2 border-cic-line px-3">
              {ADDABLE.map((k) => (
                <option key={k} value={k}>
                  {STAGE_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <Button variant="secondary" onClick={() => edit({ ...mod, activities: [...mod.activities, blankActivity(addKind)] })}>
            <Plus aria-hidden className="size-4" /> Add step
          </Button>
        </div>
        <p className="mt-2 text-sm text-cic-muted">
          Every module needs a warm-up quiz and a wrap-up quiz (that&apos;s how learning gain is measured), slides or a video, a quick check, a worksheet or exercise, and an exit question.
        </p>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={busy || !dirty}>
          <Save aria-hidden className="size-4" /> {busy ? "Saving…" : "Save draft"}
        </Button>
      </div>
    </div>
  );
}
