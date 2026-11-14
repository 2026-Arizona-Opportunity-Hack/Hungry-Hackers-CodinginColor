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
 * (any common spelling) or a single `name` column. Only the first name and
 * last initial are kept — we never store a student's full name.
 */
export function parseRosterCsv(text: string, seedOffset = 0): RosterParseResult {
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

  if (firstCol === -1 && nameCol === -1) {
    return {
      students,
      errors: [
        {
          row: headerIdx + 1,
          message: 'Couldn\'t find a name column. The first row should be "first_name,last_name" or "name".',
        },
      ],
      warnings,
    };
  }

  const seen = new Set<string>();
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trim() === "") continue;
    const rowNum = i + 1;
    const cells = splitLine(raw);
    let first = "";
    let last = "";
    if (firstCol !== -1) {
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
