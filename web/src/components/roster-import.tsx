"use client";

import { FileUp } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui";
import { parseRosterCsv, SAMPLE_ROSTER_CSV, type RosterParseResult } from "@/lib/csv";

const MAX_BYTES = 200_000;

/** Upload or paste a roster CSV; shows row-level errors before anything is saved. */
export function RosterImport({ seedOffset, onParsed }: { seedOffset: number; onParsed: (r: RosterParseResult) => void }) {
  const id = useId();
  const [text, setText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<RosterParseResult | null>(null);

  function parse(t: string) {
    const r = parseRosterCsv(t, seedOffset);
    setResult(r);
    onParsed(r);
  }

  async function onFile(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) return setFileError("Please choose a .csv file.");
    if (file.size > MAX_BYTES) return setFileError("That file is too large for a class roster (200 KB max).");
    const t = await file.text();
    setText(t);
    parse(t);
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${id}-file`} className="font-bold">
          Upload a CSV file
        </label>
        <p id={`${id}-help`} className="text-sm text-cic-muted">
          Columns: <code>first_name,last_name</code> or a single <code>name</code> column. Only first name and last initial are kept.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            id={`${id}-file`}
            type="file"
            accept=".csv,text/csv,.txt"
            aria-describedby={`${id}-help`}
            onChange={(e) => onFile(e.target.files?.[0])}
            className="min-h-11 text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-2 file:border-cic-dark file:bg-white file:px-4 file:font-bold file:text-cic-dark"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setText(SAMPLE_ROSTER_CSV);
              parse(SAMPLE_ROSTER_CSV);
            }}
          >
            <FileUp aria-hidden className="size-4" /> Use sample roster
          </Button>
        </div>
        {fileError && (
          <p role="alert" className="mt-2 font-bold text-cic-danger">
            {fileError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-paste`} className="font-bold">
          …or paste it here
        </label>
        <textarea
          id={`${id}-paste`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-xl border-2 border-cic-line p-3 font-mono text-sm"
          placeholder={"first_name,last_name\nAva,Lopez"}
        />
        <Button type="button" variant="secondary" className="mt-2" onClick={() => parse(text)} disabled={!text.trim()}>
          Check roster
        </Button>
      </div>

      {result && (
        <div role="status" className="rounded-xl bg-cic-tint p-4">
          <p className="font-bold">
            {result.students.length} student{result.students.length === 1 ? "" : "s"} ready to add
            {result.errors.length > 0 && ` · ${result.errors.length} row${result.errors.length === 1 ? "" : "s"} skipped`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-cic-danger">
              {result.errors.map((e) => (
                <li key={`e${e.row}`}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
          {result.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-cic-warn">
              {result.warnings.map((w) => (
                <li key={`w${w.row}`}>
                  Row {w.row}: {w.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
