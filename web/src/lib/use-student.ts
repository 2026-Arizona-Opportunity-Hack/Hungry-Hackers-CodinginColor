"use client";

import { assignedModules } from "./analytics";
import { bonusXpFor, getAvatarProfile, getClass, getCourse, getSession, getStudentProgress, useStore } from "./repo";

/** Everything a student screen needs. `undefined` while mounting, `null` if not joined. */
export function useStudent() {
  return useStore(() => {
    const session = getSession();
    if (!session) return null;
    const cls = getClass(session.classId);
    const student = cls?.roster.find((s) => s.id === session.studentId);
    const course = cls ? getCourse(cls.courseId) : undefined;
    if (!cls || !student || !course) return null;
    const modules = assignedModules(course, cls);
    const progress = getStudentProgress(cls.id, student.id);
    // Base XP is untouched: 10 per finished activity. Bonus XP (first-try,
    // module completion, streak days) comes from idempotent avatar awards.
    const baseXp = Object.values(progress.results).length * 10;
    const avatar = getAvatarProfile(cls.id, student.id, cls.roster.map((s) => s.id));
    const bonusXp = bonusXpFor(avatar);
    const xp = baseXp + bonusXp;
    return { session, cls, student, course, modules, progress, baseXp, bonusXp, avatar, xp };
  });
}

export type StudentContext = NonNullable<ReturnType<typeof useStudent>>;
