/**
 * Site-wide translation, powered by Google's free Website Translator widget.
 * It translates everything on the page, including lessons that CIC staff write
 * in the curriculum editor, with no per-string dictionary to maintain.
 *
 * Privacy: nothing is sent to Google until a visitor picks a language other than
 * English. Then the visible page text is sent to Google to be translated.
 *
 * How it works: the widget reads a `googtrans` cookie ("/en/es") when it loads.
 * Picking a language sets that cookie and reloads; picking English clears it.
 */
export interface Language {
  code: string;
  /** The language's own name, shown untranslated so people can find theirs. */
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "ar", name: "العربية" },
  { code: "zh-CN", name: "简体中文" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "tl", name: "Filipino" },
  { code: "fr", name: "Français" },
  { code: "pt", name: "Português" },
  { code: "hi", name: "हिन्दी" },
  { code: "ne", name: "नेपाली" },
  { code: "so", name: "Soomaali" },
  { code: "sw", name: "Kiswahili" },
  { code: "ru", name: "Русский" },
  { code: "uk", name: "Українська" },
  { code: "ko", name: "한국어" },
  { code: "ja", name: "日本語" },
];

const CODES = new Set(LANGUAGES.map((l) => l.code));
export const isLanguage = (c: unknown): c is string => typeof c === "string" && CODES.has(c);

/** Points Google's widget at a language (or clears it for English). */
export function setTranslateCookie(lang: string) {
  const value = lang === "en" ? "" : `/en/${lang}`;
  const expires = value ? "" : "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=${value}; path=/; SameSite=Lax${expires}`;
}

let loading = false;

/** Loads Google's widget once. Safe to call repeatedly. */
export function loadTranslator() {
  if (loading) return;
  loading = true;
  patchDomForTranslation();
  (window as unknown as { cicTranslateInit: () => void }).cicTranslateInit = () => {
    const g = (window as unknown as { google?: { translate?: { TranslateElement: new (o: object, id: string) => unknown } } }).google;
    if (!g?.translate) return;
    new g.translate.TranslateElement(
      { pageLanguage: "en", includedLanguages: LANGUAGES.filter((l) => l.code !== "en").map((l) => l.code).join(","), autoDisplay: false },
      "google_translate_element",
    );
  };
  const s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=cicTranslateInit";
  s.async = true;
  document.head.appendChild(s);
}

/**
 * Google wraps text nodes in <font> tags, which makes React throw when it later
 * removes or moves a node it no longer finds where it left it. This makes those
 * two DOM calls forgiving. (Known, widely used workaround.)
 */
function patchDomForTranslation() {
  const proto = Node.prototype as Node & { __cicPatched?: boolean };
  if (proto.__cicPatched) return;
  proto.__cicPatched = true;
  const remove = proto.removeChild;
  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return remove.call(this, child) as T;
  };
  const insert = proto.insertBefore;
  proto.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return node;
    return insert.call(this, node, ref) as T;
  };
}
