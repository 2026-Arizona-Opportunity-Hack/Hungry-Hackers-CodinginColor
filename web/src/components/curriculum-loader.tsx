"use client";

import { useEffect } from "react";
import { setCourses } from "@/lib/repo";
import type { Course } from "@/lib/types";

/** Loads the published curriculum once per page load; screens update when it arrives. Renders nothing. */
export function CurriculumLoader() {
  useEffect(() => {
    let live = true;
    fetch("/api/curriculum", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ courses: Course[] }>) : null))
      .then((d) => {
        if (live && d?.courses?.length) setCourses(d.courses);
      })
      .catch(() => {
        /* keep the course that ships in code */
      });
    return () => {
      live = false;
    };
  }, []);
  return null;
}
