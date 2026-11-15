import { pictureCodeFor } from "./picture-codes";
import type { RosterStudent } from "./types";

export interface RosterParseResult {
  students: RosterStudent[];
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
}

/** Split one CSV line, honoring double quotes. */
function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const clean = (s: string) => s.replace(/[<>]/g, "").trim().slice(0, 40);

/**
 * Parse a roster CSV. Accepts either `first_name,last_name` columns
 * (any common spelling), a single `name` column, or a plain list with no header. Only the first name and
 * last initial are kept — we never store a student's full name.
 */
export function parseRosterCsv(text: string, seedOffset = 0, { typedList = false } = {}): RosterParseResult {
  const errors: RosterParseResult["errors"] = [];
  const warnings: RosterParseResult["warnings"] = [];
  const students: RosterStudent[] = [];

  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const headerIdx = lines.findIndex((l) => l.trim() !== "");
  if (headerIdx === -1) {
    return { students, errors: [{ row: 1, message: "The file is empty." }], warnings };
  }

  const header = splitLine(lines[headerIdx]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const firstCol = header.findIndex((h) => ["firstname", "first", "givenname", "fname"].includes(h));
  const lastCol = header.findIndex((h) => ["lastname", "last", "surname", "familyname", "lname"].includes(h));
  const nameCol = header.findIndex((h) => ["name", "studentname", "fullname", "student"].includes(h));

  // No recognizable header? Treat every line as a student, e.g. "Ana Lopez",
  // "Ana, Lopez" or a quoted "Ana, Lopez".
  const headerless = firstCol === -1 && nameCol === -1;
  // A typed list of names is expected to have no header, so don't warn about it.
  if (headerless && !typedList) {
    warnings.push({ row: headerIdx + 1, message: "No header row found, so every line was read as a student (first name, then last name)." });
  }

  const seen = new Set<string>();
  for (let i = headerless ? headerIdx : headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trim() === "") continue;
    const rowNum = i + 1;
    let cells = splitLine(raw);
    if (headerless && cells.length === 1 && cells[0].includes(",")) cells = cells[0].split(",").map((c) => c.trim());
    let first = "";
    let last = "";
    if (headerless) {
      if (cells.length >= 2) {
        first = clean(cells[0]);
        last = clean(cells[1]);
      } else {
        const parts = clean(cells[0] ?? "").split(/\s+/).filter(Boolean);
        first = parts[0] ?? "";
        last = parts.length > 1 ? parts[parts.length - 1] : "";
      }
    } else if (firstCol !== -1) {
      first = clean(cells[firstCol] ?? "");
      last = lastCol !== -1 ? clean(cells[lastCol] ?? "") : "";
    } else {
      const parts = clean(cells[nameCol] ?? "").split(/\s+/).filter(Boolean);
      first = parts[0] ?? "";
      last = parts.length > 1 ? parts[parts.length - 1] : "";
    }
    if (!first) {
      errors.push({ row: rowNum, message: "Missing first name — row skipped." });
      continue;
    }
    const lastInitial = last ? last[0].toUpperCase() : "";
    const key = `${first.toLowerCase()} ${lastInitial}`;
    if (seen.has(key)) {
      warnings.push({ row: rowNum, message: `${first} ${lastInitial}. appears twice — their picture codes tell them apart.` });
    }
    seen.add(key);
    const n = students.length + seedOffset;
    students.push({
      id: `s-${Date.now().toString(36)}-${n}`,
      firstName: first[0].toUpperCase() + first.slice(1),
      lastInitial,
      pictureCode: pictureCodeFor(n + 11),
    });
  }

  if (students.length === 0 && errors.length === 0) {
    errors.push({ row: headerIdx + 2, message: "No students found under the header row." });
  }
  return { students, errors, warnings };
}

export const SAMPLE_ROSTER_CSV = `first_name,last_name
Aaliyah,Martinez
Brian,Tran
Carlos,Reyes
Dirah,Singh
Elena,Vasquez
Jordan,Miller
`;
