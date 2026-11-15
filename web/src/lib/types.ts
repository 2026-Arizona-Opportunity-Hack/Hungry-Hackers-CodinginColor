/**
 * Domain types. These mirror the planned Supabase tables one-to-one so the
 * demo data layer (lib/repo.ts) can be swapped for real queries later.
 *
 * course -> module -> lesson -> activity
 */

export type ConceptTag =
  | "what-is-ai"
  | "ai-in-daily-life"
  | "subfields"
  | "machine-learning"
  | "nlp"
  | "computer-vision"
  | "ethics"
  | "ai-process"
  | "validation";

export const CONCEPT_LABELS: Record<ConceptTag, string> = {
  "what-is-ai": "What AI is",
  "ai-in-daily-life": "AI in daily life",
  subfields: "Subfields of AI",
  "machine-learning": "Machine learning",
  nlp: "Language (NLP)",
  "computer-vision": "Computer vision",
  ethics: "Ethics of AI",
  "ai-process": "Building an AI",
  validation: "Testing a model",
};

export interface Slide {
  title: string;
  bullets: string[];
  /** The deck's "Our Project:" callout. */
  ourProject?: string;
  /** Optional big question used as a section divider. */
  divider?: boolean;
}

export interface ChoiceQuestion {
  id: string;
  prompt: string;
  /** Optional code shown above the choices. */
  code?: string;
  choices: string[];
  answerIndex: number;
  concept: ConceptTag;
  /** Shown after a wrong answer: a nudge, never the answer. */
  hint: string;
  explanation: string;
}

export interface WorksheetField {
  id: string;
  label: string;
  help?: string;
  kind: "short" | "long" | "number";
}

export interface CodeTest {
  /** Python expression evaluated after the student's code. */
  expr: string;
  /** Expected value, compared with == in Python. Written as Python source. */
  expected: string;
  description: string;
}

interface ActivityBase {
  id: string;
  title: string;
  /** Rough minutes, shown to students. */
  minutes: number;
}

export type Activity =
  | (ActivityBase & { kind: "pretest"; questions: ChoiceQuestion[] })
  | (ActivityBase & { kind: "slides"; slides: Slide[]; videoUrl?: string })
  | (ActivityBase & { kind: "check"; questions: ChoiceQuestion[] })
  | (ActivityBase & {
      kind: "worksheet";
      intro: string;
      link?: { href: string; label: string };
      fields: WorksheetField[];
    })
  | (ActivityBase & {
      kind: "code";
      instructions: string[];
      starter: string;
      exampleOutput?: string;
      tests: CodeTest[];
      /** Teacher-approved hint ladder, revealed one at a time. */
      hints: string[];
      concept: ConceptTag;
    })
  | (ActivityBase & { kind: "exit"; prompt: string; concept: ConceptTag })
  | (ActivityBase & { kind: "posttest"; questions: ChoiceQuestion[] });

export type ActivityKind = Activity["kind"];

export const STAGE_LABELS: Record<ActivityKind, string> = {
  pretest: "Warm-up",
  slides: "Learn",
  check: "Check",
  worksheet: "Practice",
  code: "Code",
  exit: "Exit question",
  posttest: "Wrap-up quiz",
};

export interface Module {
  id: string;
  number: number;
  title: string;
  summary: string;
  /** One lesson per module in this course; the model allows more. */
  activities: Activity[];
}

export interface Course {
  id: string;
  title: string;
  level: string;
  description: string;
  modules: Module[];
  resources: { label: string; href: string }[];
}

/** A picture code is three emoji the student taps to prove who they are. */
export type PictureCode = [string, string, string];

export interface RosterStudent {
  id: string;
  firstName: string;
  lastInitial: string;
  pictureCode: PictureCode;
}

export interface ActivityResult {
  activityId: string;
  completedAt: string;
  /** 0..1 for scored activities. */
  score?: number;
  attempts: number;
  secondsOnTask: number;
  /** Free-text / code / field answers. */
  response?: unknown;
}

export interface StudentProgress {
  studentId: string;
  results: Record<string, ActivityResult>;
  lastActiveAt: string | null;
  /** Wrong answers on checks, by activity — used for the "stuck" rule. */
  failedChecks: Record<string, number>;
  streakDays: number;
  /** Activities the student skipped for later. Still count as NOT done. */
  skippedIds: string[];
}

export interface Classroom {
  id: string;
  name: string;
  school: string;
  code: string;
  courseId: string;
  teacherName: string;
  /** Module ids assigned, in order. */
  assignedModuleIds: string[];
  roster: RosterStudent[];
  createdAt: string;
  /** Set for classes stored in Supabase; used by the admin roll-ups. */
  schoolId?: string | null;
  teacherId?: string;
}
