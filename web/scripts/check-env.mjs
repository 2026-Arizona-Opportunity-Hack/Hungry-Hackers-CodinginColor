// Runs before `npm run dev`. If the Supabase connection values are missing,
// say so clearly instead of letting the app fail silently (login and saving
// do nothing without them). Real values are never committed: each person
// keeps them in web/.env.local.
import { existsSync, readFileSync } from "node:fs";

const REQUIRED = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

function fromFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const found = { ...fromFile(".env"), ...fromFile(".env.local"), ...process.env };
const missing = REQUIRED.filter((k) => !found[k] || /^(your-|PASTE_)/i.test(found[k]));

if (missing.length) {
  console.error(`
\x1b[31mMissing Supabase settings: ${missing.join(", ")}\x1b[0m

The app can't log in or save anything without them. Fix:
  1. Create the file web/.env.local  (git ignores it on purpose)
  2. Ask the project owner for the values, then add:
       NEXT_PUBLIC_SUPABASE_URL=...
       NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  3. Run npm run dev again.

See .env.example for the full list. Never commit real keys.
`);
  process.exit(1);
}
