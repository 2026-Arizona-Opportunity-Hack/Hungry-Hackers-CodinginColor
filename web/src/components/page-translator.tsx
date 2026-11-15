"use client";

import { useEffect } from "react";
import { loadPrefs } from "@/lib/display-prefs";
import { isLanguage, loadTranslator, setTranslateCookie } from "@/lib/translate";

/**
 * Loads Google's translator, only if the visitor chose a language other than
 * English. English visitors never contact Google. The language picker lives in
 * the Display panel (display-settings.tsx).
 */
export function PageTranslator() {
  useEffect(() => {
    const { lang } = loadPrefs();
    if (!isLanguage(lang) || lang === "en") return;
    setTranslateCookie(lang);
    loadTranslator();
  }, []);
  // Google needs a mount point; it is hidden (we use our own picker).
  return <div id="google_translate_element" className="hidden" translate="no" aria-hidden />;
}
