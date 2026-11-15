"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Eye, Pencil, Plus, Rocket, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, Loading, Minutes, PageTitle } from "@/components/ui";
import { blankModule, CurriculumError, discardDraft, loadCurriculum, publishCourse, saveDraft, type CurriculumState } from "@/lib/curriculum/admin-client";
import type { Module } from "@/lib/types";

export default function CurriculumAdmin() {
  const router = useRouter();
  const [s, setS] = useState<CurriculumState | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [assignNew, setAssignNew] = useState(true);

  const reload = useCallback(
    () =>
      loadCurriculum().then(
        (d) => {
          setS(d);
          setLoadError(null);
        },
        (e: Error) => setLoadError(e.message),
      ),
    [],
  );
  useEffect(() => {
    void reload();
  }, [reload]);

  if (loadError) {
    return (
      <p role="alert" className="rounded-xl bg-cic-danger-bg p-4 text-cic-danger">
        <strong>We couldn&apos;t load the curriculum.</strong> {loadError}
      </p>
    );
  }
  if (!s) return <Loading label="Loading the curriculum…" />;

  const publishedIds = new Set(s.published.modules.map((m) => m.id));
  const newOnes = s.draft.modules.filter((m) => !publishedIds.has(m.id));

  async function run(label: string, work: () => Promise<string | void>) {
    setBusy(true);
    setNotice(null);
    try {
      const text = await work();
      await reload();
      if (text) setNotice({ kind: "ok", text });
    } catch (e) {
      setNotice({ kind: "bad", text: e instanceof CurriculumError ? [e.message, ...e.problems].join(" ") : `${label} failed. Please try again.` });
    } finally {
      setBusy(false);
    }
  }

  const persist = (modules: Module[]) => run("Saving", async () => void (await saveDraft(s.courseId, { ...s.draft, modules })));

  return (
    <div>
      <PageTitle
        title="Curriculum"
        subtitle={`${s.draft.title} · version ${s.publishedVersion} is live`}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                const m = blankModule();
                await persist([...s.draft.modules, m]);
                router.push(`/admin/curriculum/${m.id}`);
              }}
            >
              <Plus aria-hidden className="size-4" /> New module
            </Button>
          </>
        }
      />

      <div role="status" className={`mb-4 flex flex-wrap items-center gap-2 rounded-xl p-3 font-bold ${s.dirty ? "bg-cic-warn-bg text-cic-warn" : "bg-cic-tint text-cic-darker"}`}>
        {s.dirty ? <AlertTriangle aria-hidden className="size-5" /> : <CheckCircle2 aria-hidden className="size-5" />}
        {s.dirty ? "You have changes that students can't see yet." : "Everything is published. Students see this version."}
      </div>

      {notice && (
        <p role={notice.kind === "bad" ? "alert" : "status"} className={`mb-4 rounded-xl p-3 font-bold ${notice.kind === "bad" ? "bg-cic-danger-bg text-cic-danger" : "bg-cic-tint text-cic-darker"}`}>
          {notice.text}
        </p>
      )}

      {s.dirty && (
        <Card className="mb-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-cic-dark">
            <Rocket aria-hidden className="size-5" /> Publish your changes
          </h2>
          {s.publishErrors.length > 0 ? (
            <>
              <p className="mt-2 font-bold">Finish these first:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {s.publishErrors.slice(0, 12).map((e) => (
                  <li key={e}>{e}</li>
                ))}
                {s.publishErrors.length > 12 && <li>…and {s.publishErrors.length - 12} more.</li>}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-cic-muted">Everything is complete. Publishing makes this version live for students, teachers and reviewers.</p>
          )}
          {newOnes.length > 0 && (
            <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" checked={assignNew} onChange={(e) => setAssignNew(e.target.checked)} className="size-5 accent-cic-dark" />
              <span>
                Also add the {newOnes.length} new module{newOnes.length === 1 ? "" : "s"} to classes that already exist
              </span>
            </label>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={busy || s.publishErrors.length > 0}
              onClick={() =>
                run("Publishing", async () => {
                  const r = await publishCourse(s.courseId, assignNew);
                  return `Published version ${r.publishedVersion}.${r.classesUpdated ? ` Added to ${r.classesUpdated} existing class${r.classesUpdated === 1 ? "" : "es"}.` : ""}`;
                })
              }
            >
              <Rocket aria-hidden className="size-4" /> Publish now
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => run("Discarding", async () => (await discardDraft(s.courseId), "Changes discarded. The draft matches what students see."))}>
              <Undo2 aria-hidden className="size-4" /> Discard changes
            </Button>
          </div>
        </Card>
      )}

      <ol className="space-y-3">
        {s.draft.modules.map((m, i) => {
          const isNew = !publishedIds.has(m.id);
          const minutes = m.activities.reduce((n, a) => n + a.minutes, 0);
          const swap = (d: -1 | 1) => {
            const next = [...s.draft.modules];
            [next[i], next[i + d]] = [next[i + d], next[i]];
            void persist(next);
          };
          return (
            <li key={m.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-cic-dark">
                      Module {i + 1} {isNew && <span className="ml-1 rounded-full bg-cic-warn-bg px-2 py-0.5 text-xs text-cic-warn">New, not published</span>}
                    </p>
                    <h2 className="text-lg font-bold">{m.title || "Untitled module"}</h2>
                    <p className="text-sm text-cic-muted">
                      {m.activities.length} steps · <Minutes n={minutes} />
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button variant="ghost" aria-label={`Move ${m.title} up`} disabled={busy || i === 0} onClick={() => swap(-1)}>
                      <ArrowUp aria-hidden className="size-4" />
                    </Button>
                    <Button variant="ghost" aria-label={`Move ${m.title} down`} disabled={busy || i === s.draft.modules.length - 1} onClick={() => swap(1)}>
                      <ArrowDown aria-hidden className="size-4" />
                    </Button>
                    <Link href={`/admin/curriculum/${m.id}`} className="inline-flex min-h-11 items-center gap-1 rounded-xl border-2 border-cic-line bg-white px-4 font-bold text-cic-dark shadow-slab-gray hover:bg-cic-tint">
                      <Pencil aria-hidden className="size-4" /> Edit<span className="sr-only"> {m.title}</span>
                    </Link>
                    {confirm === m.id ? (
                      <span className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setConfirm(null);
                            void persist(s.draft.modules.filter((x) => x.id !== m.id));
                          }}
                        >
                          Yes, delete
                        </Button>
                        <Button variant="ghost" onClick={() => setConfirm(null)}>
                          Cancel
                        </Button>
                      </span>
                    ) : (
                      <Button variant="ghost" aria-label={`Delete ${m.title}`} disabled={busy || s.draft.modules.length <= 1} onClick={() => setConfirm(m.id)}>
                        <Trash2 aria-hidden className="size-4 text-cic-danger" />
                      </Button>
                    )}
                  </div>
                </div>
                {confirm === m.id && !isNew && (
                  <p role="alert" className="mt-2 rounded-lg bg-cic-warn-bg p-2 text-sm text-cic-warn">
                    Students may already have worked on this module. Deleting it hides it from them once you publish.
                  </p>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-cic-muted">
        <Eye aria-hidden className="size-4" /> Saved changes stay private until you publish.
        <Link href="/review" className="font-bold text-cic-dark underline">
          See the live curriculum
        </Link>
      </p>
    </div>
  );
}
