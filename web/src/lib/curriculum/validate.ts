import { CONCEPT_LABELS, type Activity, type ChoiceQuestion, type ConceptTag, type Course, type Module, type Slide, type WorksheetField } from "../types";

/**
 * Validates and cleans curriculum content before it is saved or published.
 * Used by the editor (to show problems early) and by the admin API route (the
 * real gate). It never trusts its input: every field is re-read, trimmed and
 * length-capped, and only known shapes come out.
 */

export interface ValidationResult {
  course: Course;
  /** Problems that block saving a draft (malformed content). */
  errors: string[];
  /** Extra problems that block publishing (an incomplete module). */
  publishErrors: string[];
}

/** JSON with sorted keys, so two copies of the same content compare equal whatever their key order. */
export function canon(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
  if (isRec(v)) {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canon(v[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}

const CONCEPTS = new Set(Object.keys(CONCEPT_LABELS));
const KINDS = ["pretest", "slides", "check", "worksheet", "code", "exit", "posttest"] as const;
const ID = /^[A-Za-z0-9_-]{1,40}$/;

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** hard = malformed or unsafe, blocks saving a draft. soft = just unfinished, blocks publishing only. */
interface E {
  hard: string[];
  soft: string[];
}

function str(v: unknown, max: number, where: string, errors: E, opts: { required?: boolean } = {}): string {
  if (typeof v !== "string") {
    if (opts.required) errors.soft.push(`${where}: this is required.`);
    return "";
  }
  const t = v.trim();
  if (opts.required && t.length === 0) errors.soft.push(`${where}: this is required.`);
  if (t.length > max) {
    errors.hard.push(`${where}: too long (${max} characters max).`);
    return t.slice(0, max);
  }
  return t;
}

/** Links must be https. This blocks javascript: and data: links. */
function url(v: unknown, where: string, errors: E): string | undefined {
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) return undefined;
  const raw = str(v, 500, where, errors);
  try {
    if (new URL(raw).protocol === "https:") return raw;
  } catch {
    /* fall through */
  }
  errors.hard.push(`${where}: must be a full https:// link.`);
  return undefined;
}

function int(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
}

function question(raw: unknown, where: string, errors: E): ChoiceQuestion | null {
  if (!isRec(raw)) {
    errors.hard.push(`${where}: not a question.`);
    return null;
  }
  const id = typeof raw.id === "string" && ID.test(raw.id) ? raw.id : "";
  if (!id) errors.hard.push(`${where}: missing id.`);
  const choices = arr(raw.choices).map((c, i) => str(c, 200, `${where}, choice ${i + 1}`, errors, { required: true }));
  if (choices.length < 2 || choices.length > 6) errors.soft.push(`${where}: needs 2 to 6 answer choices.`);
  const answerIndex = int(raw.answerIndex, 0, 99, -1);
  if (answerIndex < 0 || answerIndex >= choices.length) errors.soft.push(`${where}: pick which choice is correct.`);
  const concept = typeof raw.concept === "string" && CONCEPTS.has(raw.concept) ? (raw.concept as ConceptTag) : null;
  if (!concept) errors.hard.push(`${where}: pick a concept.`);
  const code = str(raw.code, 1000, `${where}, code`, errors);
  return {
    id,
    prompt: str(raw.prompt, 300, `${where}, question`, errors, { required: true }),
    ...(code ? { code } : {}),
    choices,
    answerIndex,
    concept: concept ?? "what-is-ai",
    hint: str(raw.hint, 400, `${where}, hint`, errors, { required: true }),
    explanation: str(raw.explanation, 400, `${where}, explanation`, errors, { required: true }),
  };
}

function questions(raw: unknown, where: string, errors: E): ChoiceQuestion[] {
  const list = arr(raw);
  if (list.length > 12) errors.hard.push(`${where}: 12 questions max.`);
  const out = list.map((q, i) => question(q, `${where}, question ${i + 1}`, errors)).filter((q): q is ChoiceQuestion => q !== null);
  const ids = new Set<string>();
  for (const q of out) {
    if (ids.has(q.id)) errors.hard.push(`${where}: two questions share an id.`);
    ids.add(q.id);
  }
  return out;
}

function activity(raw: unknown, where: string, errors: E, trustedCode: Map<string, string>): Activity | null {
  if (!isRec(raw)) {
    errors.hard.push(`${where}: not an activity.`);
    return null;
  }
  const kind = raw.kind;
  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    errors.hard.push(`${where}: unknown type.`);
    return null;
  }
  const id = typeof raw.id === "string" && ID.test(raw.id) ? raw.id : "";
  if (!id) errors.hard.push(`${where}: missing id.`);
  const base = {
    id,
    title: str(raw.title, 100, `${where}, title`, errors, { required: true }),
    minutes: int(raw.minutes, 1, 120, 5),
  };
  switch (kind) {
    case "pretest":
    case "posttest":
    case "check": {
      const qs = questions(raw.questions, where, errors);
      if (qs.length === 0) errors.soft.push(`${where}: add at least one question.`);
      return { ...base, kind, questions: qs } as Activity;
    }
    case "slides": {
      const slides = arr(raw.slides).map((s, i): Slide | null => {
        if (!isRec(s)) return null;
        const w = `${where}, slide ${i + 1}`;
        const bullets = arr(s.bullets).map((b) => str(b, 300, `${w}, bullet`, errors)).filter(Boolean);
        if (bullets.length > 10) errors.hard.push(`${w}: 10 bullets max.`);
        const ourProject = str(s.ourProject, 400, `${w}, our project`, errors);
        return { title: str(s.title, 100, `${w}, title`, errors, { required: true }), bullets, ...(ourProject ? { ourProject } : {}), ...(s.divider === true ? { divider: true } : {}) };
      });
      const clean = slides.filter((s): s is Slide => s !== null);
      if (clean.length > 30) errors.hard.push(`${where}: 30 slides max.`);
      const videoUrl = url(raw.videoUrl, `${where}, video link`, errors);
      return { ...base, kind: "slides", slides: clean, ...(videoUrl ? { videoUrl } : {}) };
    }
    case "worksheet": {
      const fields = arr(raw.fields).map((f, i): WorksheetField | null => {
        if (!isRec(f)) return null;
        const w = `${where}, prompt ${i + 1}`;
        const fid = typeof f.id === "string" && ID.test(f.id) ? f.id : "";
        if (!fid) errors.hard.push(`${w}: missing id.`);
        const help = str(f.help, 200, `${w}, help`, errors);
        const k = f.kind === "long" || f.kind === "number" ? f.kind : "short";
        return { id: fid, label: str(f.label, 120, `${w}, label`, errors, { required: true }), ...(help ? { help } : {}), kind: k };
      });
      const clean = fields.filter((f): f is WorksheetField => f !== null);
      if (clean.length > 12) errors.hard.push(`${where}: 12 prompts max.`);
      let link: { href: string; label: string } | undefined;
      if (isRec(raw.link)) {
        const href = url(raw.link.href, `${where}, link`, errors);
        const label = str(raw.link.label, 80, `${where}, link text`, errors);
        if (href) link = { href, label: label || "Open link" };
      }
      return { ...base, kind: "worksheet", intro: str(raw.intro, 600, `${where}, instructions`, errors, { required: true }), ...(link ? { link } : {}), fields: clean };
    }
    case "exit": {
      const concept = typeof raw.concept === "string" && CONCEPTS.has(raw.concept) ? (raw.concept as ConceptTag) : null;
      if (!concept) errors.hard.push(`${where}: pick a concept.`);
      return { ...base, kind: "exit", prompt: str(raw.prompt, 400, `${where}, question`, errors, { required: true }), concept: concept ?? "what-is-ai" };
    }
    case "code": {
      // Python exercises run code in students' browsers, so they are not editable here:
      // a code activity is only accepted if it is exactly an existing one.
      const known = trustedCode.get(id);
      if (!known || known !== canon(raw)) {
        errors.hard.push(`${where}: Python exercises can't be edited here. Ask the dev team to change them.`);
        return null;
      }
      return raw as unknown as Activity;
    }
  }
  return null;
}

/** Parses `content` into a clean Course. `meta` (title, resources…) always comes from the stored course. */
export function validateCourse(content: unknown, meta: Course, existing: Course[]): ValidationResult {
  const errors: E = { hard: [], soft: [] };
  const publishErrors: string[] = [];

  // Existing Python activities, by id, in a canonical string form.
  const trustedCode = new Map<string, string>();
  for (const c of existing) {
    for (const m of c.modules) for (const a of m.activities) if (a.kind === "code") trustedCode.set(a.id, canon(a));
  }

  const rawModules = isRec(content) ? arr(content.modules) : [];
  if (rawModules.length === 0) errors.hard.push("The course needs at least one module.");
  if (rawModules.length > 30) errors.hard.push("30 modules max.");

  const activityIds = new Set<string>();
  const moduleIds = new Set<string>();
  const modules: Module[] = [];

  rawModules.forEach((rm, mi) => {
    const where = `Module ${mi + 1}`;
    if (!isRec(rm)) {
      errors.hard.push(`${where}: not a module.`);
      return;
    }
    const id = typeof rm.id === "string" && ID.test(rm.id) ? rm.id : "";
    if (!id) errors.hard.push(`${where}: missing id.`);
    if (moduleIds.has(id)) errors.hard.push(`${where}: duplicate module id.`);
    moduleIds.add(id);

    const rawActs = arr(rm.activities);
    if (rawActs.length === 0) errors.hard.push(`${where}: add at least one activity.`);
    if (rawActs.length > 40) errors.hard.push(`${where}: 40 activities max.`);
    const acts = rawActs
      .map((a, ai) => activity(a, `${where}, step ${ai + 1}`, errors, trustedCode))
      .filter((a): a is Activity => a !== null);
    for (const a of acts) {
      if (activityIds.has(a.id)) errors.hard.push(`${where}: two steps share an id (${a.id}).`);
      activityIds.add(a.id);
    }

    const title = str(rm.title, 80, `${where}, title`, errors, { required: true });
    modules.push({ id, number: mi + 1, title, summary: str(rm.summary, 300, `${where}, summary`, errors), activities: acts });

    // Completeness rules, enforced only on publish: learning gain needs both quizzes.
    const has = (k: string) => acts.some((a) => a.kind === k);
    const label = title || where;
    if (!has("pretest")) publishErrors.push(`"${label}" needs a warm-up quiz (so learning gain can be measured).`);
    if (!has("posttest")) publishErrors.push(`"${label}" needs a wrap-up quiz (so learning gain can be measured).`);
    if (!has("slides")) publishErrors.push(`"${label}" needs slides or a video.`);
    if (!has("check")) publishErrors.push(`"${label}" needs a quick check question.`);
    if (!has("worksheet") && !has("code")) publishErrors.push(`"${label}" needs a worksheet or an exercise.`);
    if (!has("exit")) publishErrors.push(`"${label}" needs an exit question.`);
    for (const a of acts) {
      if (a.kind === "slides" && a.slides.length === 0 && !a.videoUrl) publishErrors.push(`"${label}": the slides step needs a slide or a video link.`);
      if (a.kind === "worksheet" && a.fields.length === 0) publishErrors.push(`"${label}": the worksheet needs at least one prompt.`);
    }
  });

  return { course: { ...meta, modules }, errors: errors.hard, publishErrors: [...errors.soft, ...publishErrors] };
}
