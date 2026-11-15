"use client";

import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Colors are CSS variables (globals.css) so the editor follows light/dark mode at AA contrast.
const cicHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.operatorKeyword, t.bool, t.null], color: "var(--cm-keyword)", fontWeight: "bold" },
  { tag: [t.string, t.special(t.string)], color: "var(--cm-string)" },
  { tag: [t.number], color: "var(--cm-number)" },
  { tag: [t.comment, t.lineComment], color: "var(--cm-comment)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.definition(t.variableName), t.className], color: "var(--cm-def)" },
  { tag: [t.variableName, t.propertyName, t.operator, t.punctuation], color: "var(--cm-name)" },
]);
import { python } from "@codemirror/lang-python";

/**
 * Python editor. Tab indents; to leave the editor with the keyboard press
 * Esc and then Tab (CodeMirror's built-in escape hatch), so it's never a
 * keyboard trap (WCAG 2.1.2).
 *
 * Copy, cut, paste and drag-and-drop are blocked so students type their own
 * code; a short note explains why when they try.
 */
export function CodeEditor({
  value,
  onChange,
  label,
  describedBy,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  describedBy?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          history(),
          indentOnInput(),
          bracketMatching(),
          syntaxHighlighting(cicHighlight),
          python(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.contentAttributes.of({
            "aria-label": label,
            ...(describedBy ? { "aria-describedby": describedBy } : {}),
          }),
          EditorView.domEventHandlers(
            Object.fromEntries(
              (["copy", "cut", "paste", "drop", "dragstart"] as const).map((type) => [
                type,
                (e: Event) => {
                  e.preventDefault();
                  setBlocked(true);
                  return true; // stop CodeMirror handling it too
                },
              ]),
            ),
          ),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          }),
          EditorView.theme({
            "&": { backgroundColor: "var(--color-white)", color: "var(--color-black)", border: "2px solid var(--color-cic-line)", borderRadius: "12px" },
            ".cm-gutters": { backgroundColor: "var(--color-cic-tint)", color: "var(--color-cic-muted)", border: "none", borderRadius: "10px 0 0 10px" },
            ".cm-content": { fontFamily: "'Courier New', Courier, monospace", padding: "12px 0", caretColor: "var(--color-black)" },
            ".cm-cursor": { borderLeftColor: "var(--color-black)" },
            ".cm-activeLine": { backgroundColor: "var(--cm-active-line)" },
            ".cm-activeLineGutter": { backgroundColor: "var(--color-cic-tint)", color: "var(--color-black)" },
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // The editor owns its document after mount; external resets go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allow the parent to reset the code (e.g. "Reset" button).
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return (
    <div>
      <div ref={host} translate="no" />
      {blocked && (
        <p role="status" className="mt-2 text-sm font-bold text-cic-muted">
          Copy and paste are turned off here. Typing the code yourself is how it sticks!
        </p>
      )}
    </div>
  );
}
