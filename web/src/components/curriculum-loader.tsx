"use client";

import { useEffect } from "react";
import { CURRICULUM_CHANNEL, markCurriculumReady, setCourses } from "@/lib/repo";
import type { Course } from "@/lib/types";

/** How often open screens re-check for a newly published curriculum. */
const POLL_MS = 30_000;

/**
 * Loads the published curriculum and keeps it fresh: on page load, every 30s
 * while the tab is visible, when the tab regains focus, and immediately when an
 * admin publishes in another tab of this browser. Screens update when it changes
 * (new modules, edited answer keys). Renders nothing.
 */
export function CurriculumLoader() {
  useEffect(() => {
    let live = true;
    let inFlight = false;

    const load = () => {
      if (inFlight) return;
      inFlight = true;
      fetch("/api/curriculum", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<{ courses: Course[] }>) : null))
        .then((d) => {
          if (!live) return;
          if (d?.courses?.length) setCourses(d.courses);
          else markCurriculumReady();
        })
        .catch(() => {
          /* keep the course we already have */
          if (live) markCurriculumReady();
        })
        .finally(() => {
          inFlight = false;
        });
    };

    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", onVisible);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CURRICULUM_CHANNEL);
      channel.onmessage = load;
    } catch {
      /* not supported: polling and focus still cover it */
    }

    return () => {
      live = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", onVisible);
      channel?.close();
    };
  }, []);
  return null;
}
