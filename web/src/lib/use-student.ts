"use client";

import { assignedModules } from "./analytics";
import { getClass, getCourse, getSession, getStudentProgress, useStore } from "./repo";

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
    const xp = Object.values(progress.results).length * 10;
    return { session, cls, student, course, modules, progress, xp };
  });
}

export type StudentContext = NonNullable<ReturnType<typeof useStudent>>;
