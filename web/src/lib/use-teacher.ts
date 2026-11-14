"use client";

import { assignedModules } from "./analytics";
import { getClasses, getClassProgress, getCourse, useStore } from "./repo";

const KEY = "cic.teacher.class.v1";

export function getSelectedClassId(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function selectClass(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("cic-store"));
}

/** The teacher's currently selected class with its course, modules and live progress. */
export function useTeacherClass() {
  return useStore(() => {
    const classes = getClasses();
    const id = getSelectedClassId();
    const cls = classes.find((c) => c.id === id) ?? classes[0];
    const course = getCourse(cls.courseId)!;
    const modules = assignedModules(course, cls);
    const progress = getClassProgress(cls);
    return { classes, cls, course, modules, progress, loadedAt: new Date() };
  });
}

export type TeacherContext = NonNullable<ReturnType<typeof useTeacherClass>>;
