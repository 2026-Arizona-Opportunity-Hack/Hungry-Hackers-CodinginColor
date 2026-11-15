import { assignedModules, conceptMastery, courseProgress, moduleDoneCount, moduleGain, studentStatus } from "@/lib/analytics";
import { CONCEPT_LABELS, type Classroom, type Course, type StudentProgress } from "@/lib/types";

/**
 * Builds the class data the AI assistant sees. Privacy rules:
 *  - Students are labelled S1, S2, ... Their names never leave our server; the
 *    labels are swapped back to names only in the answer shown to the teacher.
 *  - Only numbers and statuses are sent. Students' typed answers (worksheets,
 *    exit questions, code) are left out, so nothing a student writes can steer the AI.
 */
export function classSnapshot(cls: Classroom, progress: Record<string, StudentProgress>, course: Course) {
  const modules = assignedModules(course, cls);
  const now = Date.now();
  const names = new Map<string, string>();

  const students = cls.roster.map((s, i) => {
    const label = `S${i + 1}`;
    names.set(label, `${s.firstName} ${s.lastInitial}.`);
    const p = progress[s.id];
    const status = studentStatus(p, modules, now);
    const results = p ? Object.values(p.results) : [];
    return {
      student: label,
      status: status.status,
      statusReason: status.reason,
      courseProgressPct: Math.round(courseProgress(p, modules) * 100),
      daysSinceActive: p?.lastActiveAt ? Math.floor((now - Date.parse(p.lastActiveAt)) / 86_400_000) : null,
      wrongCheckAttempts: p ? Object.values(p.failedChecks).reduce((a, b) => a + b, 0) : 0,
      minutesOnTask: Math.round(results.reduce((a, r) => a + (r.secondsOnTask || 0), 0) / 60),
      modules: modules.map((m) => {
        const g = moduleGain(p, m);
        return {
          module: m.number,
          done: `${moduleDoneCount(p, m)}/${m.activities.length}`,
          warmUpPct: g.pre === null ? null : Math.round(g.pre * 100),
          wrapUpPct: g.post === null ? null : Math.round(g.post * 100),
        };
      }),
    };
  });

  const snapshot = {
    class: { name: cls.name, school: cls.school, course: course.title, students: cls.roster.length },
    modules: modules.map((m) => ({ module: m.number, title: m.title, activities: m.activities.map((a) => `${a.kind}: ${a.title}`) })),
    conceptMasteryWeakestFirst: conceptMastery(progress, cls, modules).map((c) => ({
      concept: CONCEPT_LABELS[c.concept],
      correctPct: Math.round(c.mastery * 100),
      answers: c.answers,
    })),
    students,
  };
  return { snapshot, names };
}

/** Put real names back into the AI's answer (S12 before S1, so labels never clash). */
export function restoreNames(text: string, names: Map<string, string>): string {
  return text.replace(/\bS(\d+)\b/g, (whole) => names.get(whole) ?? whole);
}
