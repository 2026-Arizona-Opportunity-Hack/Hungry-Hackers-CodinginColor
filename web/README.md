# web — Coding in Color learning platform (Next.js)

See the [root README](../README.md) for what this is and how to run it.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build + type check
npm run lint
```

Code map:

- `src/lib/curriculum/` — course content. `intro-ai.ts` is the course that ships in code (typed by `src/lib/types.ts`); `server.ts` starts from it, then the copy CIC staff publish from the admin editor (stored in Supabase) is what everyone sees; `validate.ts` checks a draft before publishing, `admin-client.ts` is the editor's client.
- `src/lib/repo.ts` — what the lesson UI reads and writes: published curriculum, plus class progress saved through the server routes. Demo and trial classes live in browser storage instead, so nothing a judge types is saved to the server.
- `src/lib/analytics.ts` — progress, learning gain, stuck-student rules (pure functions); `src/lib/insights.ts` — the teacher Insights heat map and "worth a look" flags; `src/lib/admin-analytics.ts` — cohort, school and program aggregates for the CIC admin view.
- `src/lib/supabase/` — Supabase clients: `client.ts` (browser, one per sign-in area), `server.ts` (route handlers), `admin.ts` (secret key, server only), `student-session.ts` (the signed student cookie). `src/lib/auth-areas.ts` keeps teacher, admin, reviewer and learner sign-ins separate, so they can coexist in one browser.
- `src/lib/translate.ts` + `src/components/page-translator.tsx` — whole-site translation in 16 languages via Google's Website Translator (nothing is sent to Google until a non-English language is picked); `src/components/reading-tools.tsx` — in-lesson highlighter and word-by-word reader; `src/components/display-settings.tsx` + `src/lib/display-prefs.ts` — the floating Display panel (language, theme, text size, reading options).
- `src/app/learn/*` — student screens · `src/app/teach/*` — teacher screens (Overview, Roster, Insights, New class) · `src/app/admin/*` — CIC admin (cohorts, schools, curriculum editor) · `src/app/review/*` — reviewer screens · `src/app/curriculum` — public read-only catalog · `src/app/judges` — requirement-by-requirement checklist for judges
- `src/app/api/` — server routes: `join/*` (student class-code + picture-code sign-in), `progress` (save student work), `learner/*` (self-learner sign-up and session), `curriculum` (published course for the browser), `admin/*` (school onboarding, curriculum draft/publish), `v1/cohorts` (key-authenticated read API, see `docs/API.md`)
- `scripts/seed-demo.ts` — `npm run seed:demo`: loads the sample classes and trial accounts into Supabase (safe to re-run)
- `public/py-worker.js` — runs student Python (Pyodide) in a Web Worker that can be stopped
