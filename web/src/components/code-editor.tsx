"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, defaultHighlightStyle, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { python } from "@codemirror/lang-python";

/**
 * Python editor. Tab indents; to leave the editor with the keyboard press
 * Esc and then Tab (CodeMirror's built-in escape hatch), so it's never a
 * keyboard trap (WCAG 2.1.2).
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
          syntaxHighlighting(defaultHighlightStyle),
          python(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.contentAttributes.of({
            "aria-label": label,
            ...(describedBy ? { "aria-describedby": describedBy } : {}),
          }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          }),
          EditorView.theme({
            "&": { backgroundColor: "#fff", border: "2px solid #c8c8c8", borderRadius: "12px" },
            ".cm-gutters": { backgroundColor: "#e6f4ed", color: "#595959", border: "none", borderRadius: "10px 0 0 10px" },
            ".cm-content": { fontFamily: "'Courier New', Courier, monospace", padding: "12px 0" },
            ".cm-activeLine": { backgroundColor: "#f3faf6" },
            ".cm-activeLineGutter": { backgroundColor: "#cfe9db" },
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

  return <div ref={host} />;
}
