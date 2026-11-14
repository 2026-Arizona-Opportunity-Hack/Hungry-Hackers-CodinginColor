# web — Coding in Color learning platform (Next.js)

See the [root README](../README.md) for what this is and how to run it.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build + type check
npm run lint
```

Code map:

- `src/lib/curriculum/` — course content (one file per course; typed by `src/lib/types.ts`)
- `src/lib/repo.ts` — the only data-access layer. Today it uses browser storage + demo data; swap its functions for Supabase calls without touching pages.
- `src/lib/analytics.ts` — progress, learning gain, stuck-student rules (pure functions)
- `src/app/learn/*` — student screens · `src/app/teach/*` — teacher screens · `src/app/curriculum` — read-only reviewer catalog
- `public/py-worker.js` — runs student Python (Pyodide) in a Web Worker that can be stopped
