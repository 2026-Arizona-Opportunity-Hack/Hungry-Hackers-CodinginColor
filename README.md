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

**CIC Learn** — a self-paced course platform for Coding in Color. A teacher creates a class, uploads a roster CSV and shares one class code. Students join with the code, pick their name and tap a 3-picture code (no email, no passwords), then work through each module on their own: warm-up quiz → slides → quick check → practice or real Python in the browser → exit question → wrap-up quiz. Teachers see live progress, **learning gain** (wrap-up minus warm-up), concept mastery and a "who needs help" list. An **Insights** page (`/teach/insights`) adds a student × activity heat map (score or time on task), activity per day, time per module against the estimate, and a "worth a look" list that flags very fast, back-to-back or suspiciously sudden results as conversation starters, not proof of cheating. The first course, *Intro to Artificial Intelligence*, is built from CIC's own slide deck.

**Try the demo** (`npm run dev`, then open http://localhost:3000):

| Role | How |
|---|---|
| Student | `/join` → class code **MVH3AI** → **Jordan M.** → tap 🦊 🐢 🦉 |
| Teacher | `/teach` redirects to `/login` — use the trial account shown there (`demo.teacher@example.com`, a public sample login) for the Maryvale cohort of 24 students · `/teach/new` to create a class in under 10 minutes |
| Reviewer | `/curriculum` — read-only catalog, no student data |

Status: teacher sign-in and the teacher dashboard run on Supabase (Postgres + row-level security). Students join and save progress through server routes (`/api/join/*`, `/api/progress`) with a signed-in cookie. Design decisions: [`docs/superpowers/specs/2026-11-14-cic-learning-platform-design.md`](docs/superpowers/specs/2026-11-14-cic-learning-platform-design.md).

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

Create `web/.env.local` from `.env.example` with your Supabase URL, publishable key and secret key (never commit it). Then load the sample class and trial teacher with `npm run seed:demo` (safe to re-run). To set up a fresh Supabase project, run the files in `supabase/migrations/` in order in its SQL editor first. `npm run build` type-checks and builds; `npm run lint` runs ESLint.

**Accessibility:** every flow works keyboard-only (skip link, visible focus, in the code editor press Esc then Tab to leave), status is always icon + text, and brand green is only used for text where it passes WCAG AA.

## Links

- Live demo:
- Demo video:
- Design / docs: [design decisions](docs/superpowers/specs/2026-11-14-cic-learning-platform-design.md) · [game plan](docs/HACKATHON_IDEAS.md)

## After the hackathon

Winning teams finish the project with the nonprofit — the [Definition of Done](https://www.ohack.dev/about/completion) (deployed, nonprofit sign-off, docs, open source) is tracked on your team page. Keep the repo public and the README honest; recruiters do read these.

Need a hand this weekend? [#ask-a-mentor](https://opportunity-hack.slack.com/archives/C01E5CGDQ74) on Slack, or ask in [#hungryhackers](https://opportunity-hack.slack.com/app_redirect?channel=hungryhackers) and a mentor will drop in.
