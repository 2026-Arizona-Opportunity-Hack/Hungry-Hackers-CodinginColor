# Hungry Hackers — Coding in Color

Built at [ASU Fall Hackathon 2026 | Phoenix Hackathon for Nonprofits: Nov 14-15](https://www.ohack.dev/hack/fall-2026) for the public good (MIT license).

> **⚠️ This is your team's ONE repository — all code goes here.** Please don't create
> another repo (personal or org). Judges, the Team Dashboard's code-activity card,
> the public project page and the nonprofit all read **this** repo; work pushed
> anywhere else is invisible to them and won't count. Everyone on the team should be
> a collaborator here — ask an organizer in Slack if someone can't push.

| | |
|---|---|
| **Nonprofit** | [Coding in Color](https://www.ohack.dev/nonprofit/YIXYdYCoxIZC08uQ5DL3) |
| **Problem statement** | [Curriculum & Student Progress Platform (CIC Problem 1)](https://www.ohack.dev/project/d09466fadf1b11f18e63deadc507a848) |
| **Team page** | [Hungry Hackers](https://www.ohack.dev/hack/fall-2026/team/87e36ae2e05511f1884cdeadb145c312) · [Team Dashboard](https://www.ohack.dev/hack/fall-2026/manageteam) (story, demo video, submit) |
| **Slack** | team: [#hungryhackers](https://opportunity-hack.slack.com/app_redirect?channel=hungryhackers) · nonprofit: [#npo-coding-in-color](https://opportunity-hack.slack.com/app_redirect?channel=npo-coding-in-color) · help: [#ask-a-mentor](https://opportunity-hack.slack.com/archives/C01E5CGDQ74) |
| **Created by** | Praneeth |

## Final day

Start recording your demo video by **Sun Nov 15, 12:00 PM MST** — hacking ends at **Sun Nov 15, 2:00 PM MST**, and a demo you recorded with time to spare beats a feature you finished at 1:59.

- Sun Nov 15, 11:00 AM MST — Presentation Feedback Hour
- **Sun Nov 15, 12:00 PM MST — Start recording your demo video**
- Sun Nov 15, 12:30 PM MST — Judges Arrive
- **Sun Nov 15, 2:00 PM MST — 🛑 Submission Deadline: Hacking ends**
- Sun Nov 15, 2:05 PM MST — Judging Round 1
- Sun Nov 15, 3:40 PM MST — Judging Final Round
- Sun Nov 15, 4:30 PM MST — Closing Ceremony: Winners Announced

## Before hacking ends — the submission checklist

Everything is submitted from your [Team Dashboard](https://www.ohack.dev/hack/fall-2026/manageteam); judges read the dashboard, this README and your demo video.

- [ ] **Code pushed** to this repo, in small PRs (see `AGENTS.md`) — judges and future recruiters read the history
- [ ] **Project story** written on the dashboard (`#project`): the problem, who it helps, what you built, what's next
- [ ] **Demo video** (4 minutes or less) on YouTube, Vimeo, Loom or Google Drive, linked on the dashboard (`#demo`) — show it working, not slides
- [ ] **Submit** on the dashboard (you can keep editing until the close)
- [ ] This README filled in below: team, tech stack, how to run it, live link if you have one
- Optional: a [DevPost entry](https://opportunity-hack-2026-arizona.devpost.com/) — the dashboard is the submission of record.

Judges score **Scope, Documentation, Polish and Security**, plus a separate **Accessibility** prize — the rubric is at [ohack.dev/hackathon-judging-criteria](https://www.ohack.dev/hackathon-judging-criteria). Document your work as GitHub Issues as you go: that's how you get public credit for it.

## Team

<!-- Replace with real people; link GitHub profiles so this repo works as your portfolio -->
- [Name](https://github.com/username) — role
- [Name](https://github.com/username) — role

## What we built

**CIC Learn** — a self-paced course platform for Coding in Color. A teacher creates a class, uploads a roster CSV and shares one class code. Students join with the code, pick their name and tap a 3-picture code (no email, no passwords), then work through each module on their own: warm-up quiz → slides → quick check → practice or real Python in the browser → exit question → wrap-up quiz. Teachers see live progress, **learning gain** (wrap-up minus warm-up), concept mastery and a "who needs help" list. An **Insights** page (`/teach/insights`) adds a student × activity heat map (score or time on task), activity per day, time per module against the estimate, and a "worth a look" list that flags very fast, back-to-back or suspiciously sudden results as conversation starters, not proof of cheating. A **Class assistant** (`/teach/assistant`) lets a teacher ask an AI about their class (who needs help, what to reteach, how to group students), 10 questions per teacher per week. It sees only numbers and statuses with students labelled S1, S2… (names are swapped back on our server, and students' written answers are never sent); the gateway key stays in server env vars, and the class is loaded with the teacher's own login so they can only ask about their own classes. The first course, *Intro to Artificial Intelligence*, is built from CIC's own slide deck.

**For judges:** `/judges` lists every requirement in the brief, where it lives in the app and how to try it, including the admin-only screens.

**Try the demo** (`npm run dev`, then open http://localhost:3000):

| Role | How |
|---|---|
| Self-learner | `/start` → create an account → `/learn` (every module open) · sign back in at `/login?next=/learn` |
| Student | `/join` → class code **MVH3AI** → **Jordan M.** → tap 🦊 🐢 🦉. The sample class runs in the browser only: nothing is saved to the server, and it starts over from the sample data on every join and on **Leave**. |
| Teacher | `/teach` redirects to `/login` — use the trial account shown there (`demo.teacher@example.com`, a public sample login) for the Maryvale cohort of 24 students · `/teach/new` to create a class in under 10 minutes. New classes and students made with this trial account stay in that browser only and are wiped at every sign-in and sign-out, so each visitor starts fresh. |
| External reviewer | `/login?next=/review` with the demo reviewer `demo.reviewer@example.com` → `/review` (curriculum with answer keys, read-only, no student data). Not shown on the login page: ask the team for the password, or set `DEMO_TRIAL_REVIEWER_PASSWORD` in `web/.env.local` and run `npm run seed:demo` to set a new one. |
| CIC admin | `/login?next=/admin` with the demo admin `demo.admin@example.com` → `/admin` (every school and cohort, grant-report CSVs, curriculum editor with publishing, add schools and accounts). Not shown on the login page because it has full powers: ask the team for the password, or set `DEMO_TRIAL_ADMIN_PASSWORD` in `web/.env.local` and run `npm run seed:demo` to set a new one. A second admin, `cic.admin@example.com`, has a private password (`npm run seed:demo` prints it once, or set `DEMO_ADMIN_PASSWORD` in `web/.env.local` first). |
| Public catalog | `/curriculum` — short read-only catalog, no sign-in |

**What a CIC admin can do** (`/admin`, sign in via the **CIC Admin** button on the home page):
1. **See every class** across every school and instructor, with an **Open** button to view any class as its teacher does.
2. **Pull grant numbers** per cohort, school and program: completion and learning gain (wrap-up minus warm-up, per student and per class), calculated by the site. Download a cohort CSV or a per-student CSV.
3. **Onboard a partner school** (`/admin/schools`): add the school, create its teachers' logins and give external reviewers access. Temporary passwords are shown once.
4. **Create and publish curriculum** (`/admin/curriculum`): a form-based editor for modules (slides or video, quick check, worksheet, exit question, warm-up and wrap-up quizzes). Edits stay in a private draft until **Publish**; publishing validates the content and can add new modules to existing classes. Python exercises stay developer-edited on purpose.
5. **Read API for CIC's own dashboard**: `GET /api/v1/cohorts`, protected by `CIC_DASHBOARD_API_KEY`. See [docs/API.md](docs/API.md).

**Separate logins per role:** a teacher, a CIC admin and a reviewer can all be signed in at the same time in one browser. Each role keeps its own login cookie (`cic-auth-teacher`, `cic-auth-admin`, `cic-auth-reviewer`, see `web/src/lib/auth-areas.ts`), so signing in as one never replaces another and signing out only ends that one. Admins view classes at `/admin/classes/...`; `/teach` is the teacher's own area.

**Self-learners (no class needed):** anyone can make a free account at `/start` and learn on their own. They pick any module in any order, and every module you publish later appears for them automatically. Behind the scenes a learner is a normal student in one hidden, self-paced class (`classes.self_paced`), so the lesson screens, progress saving and the admin dashboard work unchanged. The admin sees them as an "Independent learners" cohort. Accounts are created by the server with the lowest role (`learner`); emails are not verified, and the sign-up rate limit is per server in memory.

**Who can sign in:** students use a class code (no accounts). Teachers, CIC admins and reviewers sign in with email + password. Roles live in `public.profiles.role` and are only ever set by the server or the seed script, never by users. In the Supabase dashboard (Authentication → Sign In / Providers) turn **off** "Allow new users to sign up" so only admins can create accounts.

Status: teacher sign-in and the teacher dashboard run on Supabase (Postgres + row-level security). Students join and save progress through server routes (`/api/join/*`, `/api/progress`) with a signed-in cookie. Design decisions: [`docs/superpowers/specs/2026-11-14-cic-learning-platform-design.md`](docs/superpowers/specs/2026-11-14-cic-learning-platform-design.md).

## Accessibility

Every page has a **Display** button (bottom left) with:

- **Theme:** match device, light or dark. Dark mode swaps the brand color tokens in `web/src/app/globals.css`, so all screens follow it, the Python editor included. Text stays at 6:1 contrast or better.
- **Text size:** four steps up to 150%. All sizes and spacing are in rem, so the whole layout scales.
- **Easy-read font** (Lexend) and **extra text spacing** (WCAG 1.4.12 values), which help many dyslexic readers.
- **Reduce motion:** turns off animations and confetti (also automatic when the device asks for reduced motion).

Choices are saved per device (`web/src/lib/display-prefs.ts`) and applied before the page draws. The rest of the site keeps WCAG 2.2 AA basics: a skip link, visible focus rings, keyboard-only use (the code editor is never a keyboard trap) and labelled controls.

## Tech stack

- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, lucide icons
- Code editor / runner: CodeMirror 6 + Pyodide (Python in a Web Worker, no server)
- Backend / database: Supabase (Postgres, row-level security, email + password auth for teachers). Schema is in `supabase/migrations/`
- APIs / services: Supabase only — see `.env.example`

## Run it locally

Requires Node.js 20+.

```bash
git clone https://github.com/2026-Arizona-Opportunity-Hack/Hungry-Hackers-CodinginColor.git
cd Hungry-Hackers-CodinginColor/web
npm install
npm run dev        # http://localhost:3000
```

Create `web/.env.local` from `.env.example` with your Supabase URL, publishable key and secret key (never commit it). Then load the sample class and trial teacher with `npm run seed:demo` (safe to re-run). To set up a fresh Supabase project, run the files in `supabase/migrations/` in order in its SQL editor first. For the class assistant, also set `AI_GATEWAY_URL`, `AI_GATEWAY_KEY` and `AI_MODEL` (in `.env.local`, and in Vercel → Project → Settings → Environment Variables for the live site; never `NEXT_PUBLIC_`). `npm run build` type-checks and builds; `npm run lint` runs ESLint.

**Accessibility:** every flow works keyboard-only (skip link, visible focus, in the code editor press Esc then Tab to leave), status is always icon + text, and brand green is only used for text where it passes WCAG AA.

## Links

- Live demo: https://cic-learn-rouge.vercel.app
- Demo video:
- Design / docs: [design decisions](docs/superpowers/specs/2026-11-14-cic-learning-platform-design.md) · [game plan](docs/HACKATHON_IDEAS.md)

## After the hackathon

Winning teams finish the project with the nonprofit — the [Definition of Done](https://www.ohack.dev/about/completion) (deployed, nonprofit sign-off, docs, open source) is tracked on your team page. Keep the repo public and the README honest; recruiters do read these.

Need a hand this weekend? [#ask-a-mentor](https://opportunity-hack.slack.com/archives/C01E5CGDQ74) on Slack, or ask in [#hungryhackers](https://opportunity-hack.slack.com/app_redirect?channel=hungryhackers) and a mentor will drop in.
