# CIC Learning Platform — UI design (2026-11-14)

## Intent

Coding in Color teaches CS and AI to students aged 14–18 across partner schools. Today a lesson only
happens if a CIC instructor is in the room. The platform lets a teacher with no CS background share
one class code; students then work through each module at their own pace, and teachers and CIC
staff see progress, learning gain, and who is stuck, without a spreadsheet.

Success for the demo means a teacher sets up a class in under 10 minutes, and a student who joins late
can finish a module with no help.

## Goals

- A self-paced module flow: warm-up (pretest) → slides → quick check → practice or code → exit question → wrap-up (post-test).
- Learning gain shown per module, per student and per class (post-test score minus pretest score, using the same questions).
- A "who needs help" list: 3+ wrong tries on one activity, or 3+ days with no activity.
- Real Python in the browser (Pyodide) with no server and no API key.
- WCAG 2.2 AA: keyboard-only use, status never shown by color alone, visible focus, and brand colors kept at text-safe contrast.

## Non-goals (this weekend)

Real auth and a database (the next PR), offline mode, multiple languages, gradebook export,
attendance, a full achievements page, and an LLM tutor (we have no key yet).

## Anti-goals

- Storing full student names, emails or anything identifying beyond first name + last initial.
- A teacher view that needs training to read.
- Gamification that shames slower students (no leaderboards).

## Constraints

- CIC brand: #007A3D for text, buttons and headings (5.5:1 contrast); #00A850 only for non-text accents (3.1:1); #C8C8C8 only for borders; Arial; logo on white only.
- 8px grid, 12–16px radius, left nav on desktop and bottom nav on mobile (from the handoff spec).
- No secrets in git, MIT license, one repo.

## Approaches considered

1. **Next.js + TypeScript + Tailwind, with demo data behind a repository module (chosen).** Pages call `src/lib/repo.ts`, which today reads and writes browser storage seeded with a demo cohort. Its function shapes match future Supabase tables, so the backend swap stays inside that one file. This deploys to Vercel for free.
2. Vite + React SPA. It is lighter, but it has no file routing or server rendering for the public catalog, and we would hand-roll what Next gives us.
3. Backend-first with Supabase now. This was rejected because the user asked for UI first and no keys yet.

## Decisions (stress-tested by a 5-skeptic review)

- **Join flow:** class code → pick your name from the teacher's roster → tap your 3-picture code. The picture code stops classmates from signing in as each other, without needing email or passwords. This deliberately differs from the spec's "nickname": a roster ties progress to a real student, which learning gain and the stuck list require.
- **Late joiners:** the student home page shows a "Start here" banner that points to the next unfinished activity, and shows where the class median is.
- **Gamification:** light XP (10 per activity) and a streak counter only.
- **Visuals:** CIC logo plus lucide icons. We used no copied illustrations.
- **Hints:** a canned hint ladder approved by the teacher, which reveals more on each try. An LLM can generate drafts later, and a teacher approves them before students see them.
- **Code runner:** Pyodide in a Web Worker that can be terminated, with a Stop button and an 8s timeout. In the editor, Esc then Tab moves focus out (the WCAG keyboard-trap rule).
- **Roster CSV:** parsed in the browser. Only the first name and last initial are kept, `<>` is stripped, the file is capped at 200 KB, and errors are reported per row before saving.
- **Code freeze:** 10 AM Sunday, then demo recording.

## Curriculum source

The course is built from CIC's "Intro to Artificial Intelligence" (Teachable Machine) slide deck, in 4 modules:
What is AI?, Subfields of AI, Our Ethical Responsibility, and Build Your Own AI. See `web/src/lib/curriculum/intro-ai.ts`.

## Left to the builder / next

- A Supabase schema mirroring `types.ts` (classes, roster, results, failed_checks), row-level security for the student / teacher / admin / reviewer roles, and teacher magic-link sign-in.
- A lesson builder so authors can publish without a deploy, an admin cross-class overview, and a confusion heatmap.
