"use client";

import { FileUp } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui";
import { parseRosterCsv, SAMPLE_ROSTER_CSV, type RosterParseResult } from "@/lib/csv";

const MAX_BYTES = 200_000;
const EMPTY: RosterParseResult = { students: [], errors: [], warnings: [] };

/**
 * Add students by typing names (one per line) or uploading a CSV. The list is
 * checked as you type, with row-level problems shown before anything is saved.
 */
export function RosterImport({ seedOffset, onParsed }: { seedOffset: number; onParsed: (r: RosterParseResult) => void }) {
  const id = useId();
  const [text, setText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<RosterParseResult | null>(null);

  function update(t: string, typedList: boolean) {
    setText(t);
    if (!t.trim()) {
      setResult(null);
      onParsed(EMPTY);
      return;
    }
    const r = parseRosterCsv(t, seedOffset, { typedList });
    setResult(r);
    onParsed(r);
  }

  async function onFile(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) return setFileError("Please choose a .csv file.");
    if (file.size > MAX_BYTES) return setFileError("That file is too large for a class roster (200 KB max).");
    update(await file.text(), false);
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${id}-names`} className="font-bold">
          Type student names, one per line
        </label>
        <p id={`${id}-names-help`} className="text-sm text-cic-muted">
          Write each student&apos;s first and last name, like <strong>Ava Lopez</strong>. We only keep the first name and last initial
          (Ava L.), and each student gets their own picture code to sign in.
        </p>
        <textarea
          id={`${id}-names`}
          value={text}
          onChange={(e) => update(e.target.value, true)}
          aria-describedby={`${id}-names-help`}
          rows={6}
          className="mt-2 w-full rounded-xl border-2 border-cic-line p-3 text-base focus:border-cic-dark"
          placeholder={"Ava Lopez\nMarcus Chen\nJada Williams"}
        />
      </div>

      <div className="rounded-xl border-2 border-dashed border-cic-line p-4">
        <label htmlFor={`${id}-file`} className="font-bold">
          Or upload a class list (CSV)
        </label>
        <p id={`${id}-file-help`} className="text-sm text-cic-muted">
          A spreadsheet saved as .csv with <code translate="no">first_name</code> and <code translate="no">last_name</code> columns, or one <code translate="no">name</code> column.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            id={`${id}-file`}
            type="file"
            accept=".csv,text/csv,.txt"
            aria-describedby={`${id}-file-help`}
            onChange={(e) => onFile(e.target.files?.[0])}
            className="min-h-11 text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-2 file:border-cic-dark file:bg-white file:px-4 file:font-bold file:text-cic-dark"
          />
          <Button type="button" variant="ghost" onClick={() => update(SAMPLE_ROSTER_CSV, false)}>
            <FileUp aria-hidden className="size-4" /> Use sample roster
          </Button>
        </div>
        {fileError && (
          <p role="alert" className="mt-2 font-bold text-cic-danger">
            {fileError}
          </p>
        )}
      </div>

      {result && (
        <div role="status" className="rounded-xl bg-cic-tint p-4">
          <p className="font-bold">
            {result.students.length} student{result.students.length === 1 ? "" : "s"} ready to add
            {result.errors.length > 0 && ` · ${result.errors.length} line${result.errors.length === 1 ? "" : "s"} skipped`}
          </p>
          {result.students.length > 0 && (
            <p className="mt-1 text-sm text-cic-darker">
              {result.students
                .slice(0, 12)
                .map((s) => `${s.firstName}${s.lastInitial ? ` ${s.lastInitial}.` : ""}`)
                .join(", ")}
              {result.students.length > 12 && `, and ${result.students.length - 12} more`}
            </p>
          )}
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-cic-danger">
              {result.errors.map((e) => (
                <li key={`e${e.row}`}>
                  Line {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
          {result.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-cic-warn">
              {result.warnings.map((w) => (
                <li key={`w${w.row}`}>
                  Line {w.row}: {w.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
