# CIC Curriculum & Student Progress Platform — Hackathon Game Plan

## What we're building
A code.org-style link that teaches by itself. Teachers share a class code; students self-pace
through modules (video/slides → check for understanding → worksheet/exercise → exit question);
the next module unlocks. Instructors manage, admins see cohort completion + learning gain,
external reviewers browse the curriculum read-only, authors publish without a deploy.

**Judging reality:** Scope + Polish. If an instructor can't set up a class in 10 minutes, or a
student can't follow a module without help, it fails regardless of features.

## Key decisions
- **Student login = class code + pick your name from the roster** (like code.org sections).
  No email, no Google account.
- **P1 pick = Pyodide in-browser Python runner** (also covers half the P2 no-login tool moonshot).
- **Stack:** Next.js on Vercel + Supabase (auth, Postgres, row-level security for the 4 roles).
  Video via YouTube/Drive embeds.

## 1. Win the demo first
- [ ] Script the demo around the judges' success criteria:
  - Live stopwatch: create class → import CSV → assign module in ~2 min (vs. their 10-min bar)
  - Student joins on a phone with the class code
  - Late joiner lands on a "Start here" banner
  - Admin dashboard: Maryvale cohort completion + learning gain
  - `curl` the read API with a key
- [ ] Seed a realistic "Maryvale cohort": ~25 students, mixed progress, pre/post scores, a few stuck
- [ ] Convert one real CIC printed worksheet into a digital activity; show them side by side

## 2. One feature, three scoring hits
- [ ] Pyodide runner + test-case auto-grading (P1 ×2, part of the P2 moonshot)
- [ ] Socratic hint ladder: nudges, never the answer; hints logged so the teacher can review them
- [ ] Tag every question with a concept (loops, variables) → "80% stuck on loops" view nearly free

## 3. Cheap things that look big
- [ ] External reviewer = read-only public curriculum catalog (mostly a filtered view)
- [ ] Concrete "stuck" rule: failed a check 3× OR no activity in 3 days
- [ ] Authoring as stacked blocks (video / question / worksheet / code / exit) stored as JSON →
      publishing never needs a deploy

## 4. Borrow, don't build
- Video: YouTube/Drive embeds
- Auth + DB + roles: Supabase (RLS)
- Hosting: Vercel

## 5. Polish = "usable Monday"
- [ ] CSV import errors that name the row ("row 7: missing name")
- [ ] Friendly empty states everywhere
- [ ] Mobile layout for students (Chromebook + phone)

## Open questions
- Hours until the demo? How many people building? → decides what gets polished vs. stubbed
