"use client";

import { useEffect, useMemo, useState } from "react";
import { assignedModules } from "./analytics";
import { getCourse, useCurriculumVersion } from "./repo";
import { fetchTeacherData, TEACHER_DATA_EVENT, type TeacherData } from "./teacher-store";

const KEY = "cic.teacher.class.v1";
const SELECT_EVENT = "cic-teacher-select";

function getSelectedClassId(): string | null {
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
    /* ignore: the switcher still works for this page load */
  }
  window.dispatchEvent(new Event(SELECT_EVENT));
}

/**
 * The signed-in teacher's classes plus the selected class with its course,
 * modules and live progress, loaded from Supabase. `undefined` while loading;
 * `null` if the teacher has no classes yet; throws nothing (errors are returned).
 */
export function useTeacherClass() {
  const [data, setData] = useState<TeacherData | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState(() => new Date());

  useEffect(() => {
    let live = true;
    const load = () =>
      fetchTeacherData().then(
        (d) => {
          if (!live) return;
          setData(d);
          setError(null);
          setLoadedAt(new Date());
        },
        (e: Error) => live && setError(e.message),
      );
    const pick = () => setSelected(getSelectedClassId());
    pick();
    load();
    window.addEventListener(TEACHER_DATA_EVENT, load);
    window.addEventListener(SELECT_EVENT, pick);
    return () => {
      live = false;
      window.removeEventListener(TEACHER_DATA_EVENT, load);
      window.removeEventListener(SELECT_EVENT, pick);
    };
  }, []);

  const curriculumVersion = useCurriculumVersion();
  const ctx = useMemo(() => {
    if (!data) return data;
    const cls = data.classes.find((c) => c.id === selected) ?? data.classes[0];
    if (!cls) return null;
    const course = getCourse(cls.courseId)!;
    return {
      classes: data.classes,
      cls,
      course,
      modules: assignedModules(course, cls),
      progress: data.progress[cls.id] ?? {},
      loadedAt,
    };
    // curriculumVersion: recompute when the published course arrives or changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selected, loadedAt, curriculumVersion]);

  return { ctx, error };
}

export type TeacherContext = NonNullable<ReturnType<typeof useTeacherClass>["ctx"]>;
