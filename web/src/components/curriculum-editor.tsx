"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui";
import { blankQuestion, uid } from "@/lib/curriculum/admin-client";
import { CONCEPT_LABELS, type Activity, type ChoiceQuestion, type ConceptTag, type Slide, type WorksheetField } from "@/lib/types";

/** Form pieces for the curriculum editor. Each takes a value and reports a new one. */

const box = "mt-1 block w-full rounded-xl border-2 border-cic-line px-3 py-2 focus:border-cic-dark";

export function TextField({
  label,
  value,
  onChange,
  max,
  long,
  help,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  long?: boolean;
  help?: string;
  placeholder?: string;
  type?: "text" | "url" | "number";
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      {help && (
        <p id={`${id}-h`} className="text-sm text-cic-muted">
          {help}
        </p>
      )}
      {long ? (
        <textarea id={id} aria-describedby={help ? `${id}-h` : undefined} rows={3} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={box} />
      ) : (
        <input id={id} aria-describedby={help ? `${id}-h` : undefined} type={type} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${box} min-h-11`} />
      )}
    </div>
  );
}

function ConceptSelect({ value, onChange }: { value: ConceptTag; onChange: (v: ConceptTag) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="font-bold">
        Concept this checks
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as ConceptTag)} className={`${box} min-h-11`}>
        {(Object.keys(CONCEPT_LABELS) as ConceptTag[]).map((c) => (
          <option key={c} value={c}>
            {CONCEPT_LABELS[c]}
          </option>
        ))}
      </select>
    </div>
  );
}

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function ListButtons({ i, length, onMove, onRemove, label }: { i: number; length: number; onMove: (d: -1 | 1) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex gap-1">
      <Button type="button" variant="ghost" aria-label={`Move ${label} up`} disabled={i === 0} onClick={() => onMove(-1)}>
        <ArrowUp aria-hidden className="size-4" />
      </Button>
      <Button type="button" variant="ghost" aria-label={`Move ${label} down`} disabled={i === length - 1} onClick={() => onMove(1)}>
        <ArrowDown aria-hidden className="size-4" />
      </Button>
      <Button type="button" variant="ghost" aria-label={`Delete ${label}`} onClick={onRemove}>
        <Trash2 aria-hidden className="size-4 text-cic-danger" />
      </Button>
    </div>
  );
}

// ---------- questions (warm-up, quick check, wrap-up) ----------

function QuestionEditor({ q, n, onChange, feedback }: { q: ChoiceQuestion; n: number; onChange: (q: ChoiceQuestion) => void; feedback: boolean }) {
  const group = useId();
  const setChoice = (i: number, text: string) => onChange({ ...q, choices: q.choices.map((c, k) => (k === i ? text : c)) });
  return (
    <div className="space-y-3">
      <TextField label={`Question ${n}`} value={q.prompt} onChange={(prompt) => onChange({ ...q, prompt })} max={300} long />
      <fieldset>
        <legend className="font-bold">Answer choices (select the correct one)</legend>
        <ul className="mt-1 space-y-2">
          {q.choices.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <input type="radio" name={group} checked={q.answerIndex === i} onChange={() => onChange({ ...q, answerIndex: i })} aria-label={`Choice ${i + 1} is correct`} className="size-5 shrink-0 accent-cic-dark" />
              <label className="sr-only" htmlFor={`${group}-${i}`}>
                Choice {i + 1}
              </label>
              <input id={`${group}-${i}`} value={c} maxLength={200} onChange={(e) => setChoice(i, e.target.value)} className={`${box} mt-0 min-h-11 flex-1`} placeholder={`Choice ${i + 1}`} />
              <Button
                type="button"
                variant="ghost"
                aria-label={`Remove choice ${i + 1}`}
                disabled={q.choices.length <= 2}
                onClick={() => onChange({ ...q, choices: q.choices.filter((_, k) => k !== i), answerIndex: q.answerIndex === i ? 0 : q.answerIndex > i ? q.answerIndex - 1 : q.answerIndex })}
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
        {q.choices.length < 6 && (
          <Button type="button" variant="ghost" className="mt-1" onClick={() => onChange({ ...q, choices: [...q.choices, ""] })}>
            <Plus aria-hidden className="size-4" /> Add a choice
          </Button>
        )}
      </fieldset>
      <ConceptSelect value={q.concept} onChange={(concept) => onChange({ ...q, concept })} />
      {feedback ? (
        <>
          <TextField label="Hint after a wrong answer" help="A nudge, never the answer. Shown when a student answers wrong, before they retry." value={q.hint} onChange={(hint) => onChange({ ...q, hint })} max={400} long />
          <TextField label="Explanation" help="Shown after the right answer, or if a student is still stuck after a few tries." value={q.explanation} onChange={(explanation) => onChange({ ...q, explanation })} max={400} long />
        </>
      ) : (
        <p className="rounded-lg bg-cic-tint p-3 text-sm">Warm-up questions give students no hints or feedback, so there&apos;s nothing else to fill in.</p>
      )}
    </div>
  );
}

export function QuestionsEditor({
  questions,
  onChange,
  locked,
  feedback = true,
  max = 12,
}: {
  questions: ChoiceQuestion[];
  onChange: (q: ChoiceQuestion[]) => void;
  locked?: boolean;
  /** false for the warm-up quiz: no hint or explanation is ever shown to students. */
  feedback?: boolean;
  max?: number;
}) {
  return (
    <div className="space-y-4">
      {locked && (
        <p className="rounded-lg bg-cic-warn-bg p-3 text-sm text-cic-warn">
          Students may already have answered this quiz. Adding questions at the end is safe. Reordering or deleting questions can skew past results.
        </p>
      )}
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-2xl border-2 border-cic-line p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-bold text-cic-dark">Question {i + 1}</h4>
            <ListButtons i={i} length={questions.length} label={`question ${i + 1}`} onMove={(d) => onChange(move(questions, i, d))} onRemove={() => onChange(questions.filter((_, k) => k !== i))} />
          </div>
          <QuestionEditor q={q} n={i + 1} feedback={feedback} onChange={(nq) => onChange(questions.map((x, k) => (k === i ? nq : x)))} />
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => onChange([...questions, blankQuestion("q")])} disabled={questions.length >= max}>
        <Plus aria-hidden className="size-4" /> Add a question
      </Button>
    </div>
  );
}

// ---------- slides / video ----------

export function SlidesEditor({ a, onChange }: { a: Extract<Activity, { kind: "slides" }>; onChange: (a: Activity) => void }) {
  const setSlide = (i: number, s: Slide) => onChange({ ...a, slides: a.slides.map((x, k) => (k === i ? s : x)) });
  return (
    <div className="space-y-4">
      <TextField label="Video link (optional)" help="A full https:// link, for example YouTube or Loom." type="url" value={a.videoUrl ?? ""} onChange={(v) => onChange({ ...a, videoUrl: v })} max={500} />
      {a.slides.map((s, i) => (
        <div key={i} className="rounded-2xl border-2 border-cic-line p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-bold text-cic-dark">Slide {i + 1}</h4>
            <ListButtons i={i} length={a.slides.length} label={`slide ${i + 1}`} onMove={(d) => onChange({ ...a, slides: move(a.slides, i, d) })} onRemove={() => onChange({ ...a, slides: a.slides.filter((_, k) => k !== i) })} />
          </div>
          <div className="space-y-3">
            <TextField label="Slide title" value={s.title} onChange={(title) => setSlide(i, { ...s, title })} max={100} />
            <TextField
              label="Bullet points"
              help="One per line."
              long
              value={s.bullets.join("\n")}
              onChange={(v) => setSlide(i, { ...s, bullets: v.split("\n").slice(0, 10) })}
              max={3000}
            />
            <TextField label="“Our project” callout (optional)" value={s.ourProject ?? ""} onChange={(v) => setSlide(i, { ...s, ourProject: v })} max={400} long />
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" disabled={a.slides.length >= 30} onClick={() => onChange({ ...a, slides: [...a.slides, { title: "", bullets: [""] }] })}>
        <Plus aria-hidden className="size-4" /> Add a slide
      </Button>
    </div>
  );
}

// ---------- worksheet ----------

export function WorksheetEditor({ a, onChange }: { a: Extract<Activity, { kind: "worksheet" }>; onChange: (a: Activity) => void }) {
  const setField = (i: number, f: WorksheetField) => onChange({ ...a, fields: a.fields.map((x, k) => (k === i ? f : x)) });
  return (
    <div className="space-y-4">
      <TextField label="Instructions for students" value={a.intro} onChange={(intro) => onChange({ ...a, intro })} max={600} long />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Helpful link (optional)" type="url" help="Full https:// link." value={a.link?.href ?? ""} onChange={(href) => onChange({ ...a, link: { href, label: a.link?.label ?? "" } })} max={500} />
        <TextField label="Link text" value={a.link?.label ?? ""} onChange={(label) => onChange({ ...a, link: { href: a.link?.href ?? "", label } })} max={80} />
      </div>
      {a.fields.map((f, i) => (
        <div key={f.id} className="rounded-2xl border-2 border-cic-line p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-bold text-cic-dark">Prompt {i + 1}</h4>
            <ListButtons i={i} length={a.fields.length} label={`prompt ${i + 1}`} onMove={(d) => onChange({ ...a, fields: move(a.fields, i, d) })} onRemove={() => onChange({ ...a, fields: a.fields.filter((_, k) => k !== i) })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="What students are asked" value={f.label} onChange={(label) => setField(i, { ...f, label })} max={120} />
            <TextField label="Help text (optional)" value={f.help ?? ""} onChange={(help) => setField(i, { ...f, help })} max={200} />
            <div>
              <label htmlFor={`${f.id}-kind`} className="font-bold">
                Answer type
              </label>
              <select id={`${f.id}-kind`} value={f.kind} onChange={(e) => setField(i, { ...f, kind: e.target.value as WorksheetField["kind"] })} className={`${box} min-h-11`}>
                <option value="short">Short answer</option>
                <option value="long">Paragraph</option>
                <option value="number">Number</option>
              </select>
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" disabled={a.fields.length >= 12} onClick={() => onChange({ ...a, fields: [...a.fields, { id: uid("f"), label: "", kind: "short" }] })}>
        <Plus aria-hidden className="size-4" /> Add a prompt
      </Button>
    </div>
  );
}

// ---------- exit question ----------

export function ExitEditor({ a, onChange }: { a: Extract<Activity, { kind: "exit" }>; onChange: (a: Activity) => void }) {
  return (
    <div className="space-y-3">
      <TextField label="Exit question" help="A short written reflection students answer at the end." value={a.prompt} onChange={(prompt) => onChange({ ...a, prompt })} max={400} long />
      <ConceptSelect value={a.concept} onChange={(concept) => onChange({ ...a, concept })} />
    </div>
  );
}
