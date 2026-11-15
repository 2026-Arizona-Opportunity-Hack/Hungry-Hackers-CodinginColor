"use client";

import { useEffect, useMemo, useState } from "react";
import { summarizeClass, type ClassSummary } from "./admin-analytics";
import { getCourse, useCurriculumVersion } from "./repo";
import { ADMIN_DATA_EVENT, fetchAdminData, type AdminData } from "./admin-store";

/** The CIC admin's view of every school and cohort. `undefined` while loading. */
export function useAdmin() {
  const [data, setData] = useState<AdminData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState(() => new Date());

  useEffect(() => {
    let live = true;
    const load = () =>
      fetchAdminData().then(
        (d) => {
          if (!live) return;
          setData(d);
          setError(null);
          setLoadedAt(new Date());
        },
        (e: Error) => live && setError(e.message),
      );
    load();
    window.addEventListener(ADMIN_DATA_EVENT, load);
    return () => {
      live = false;
      window.removeEventListener(ADMIN_DATA_EVENT, load);
    };
  }, []);

  const curriculumVersion = useCurriculumVersion();
  const summaries = useMemo<ClassSummary[]>(
    () => (data ? data.data.classes.map((c) => summarizeClass(c, data.data.progress[c.id] ?? {}, getCourse(c.courseId))) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, curriculumVersion],
  );
  return { data, summaries, error, loadedAt };
}
