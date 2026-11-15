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

**Hungry Hackers**, at [ASU Fall Hackathon 2026](https://www.ohack.dev/hack/fall-2026):

- **Daksh Kalra** — Frontend
- **Ashwin Joshi** — Backend
- **Praneeth Kemburu** — Frontend, features & testing
- **Yogansh Chandaluri** — Testing & features
- **Sarvesh Satish** — Testing & features

## What we built

**CIC Learn** is a self-paced course platform for Coding in Color. Teachers set up a class in minutes, students learn with no email or passwords, and CIC gets grant-ready numbers on who finished and how much they learned. The first course, *Intro to Artificial Intelligence*, is built from CIC's own slide deck.

> **AI status:** The Class assistant is fully built and deployable and only needs the AI gateway key connected, but we ran out of API tokens, so it is not fully wired into the live demo.

**For judges:** `/judges` lists every requirement in the brief, where it lives in the app and how to try it, including the admin-only screens.

### Feature list

#### The course: *Intro to Artificial Intelligence*
- **4 modules:** What is AI? · Subfields of AI · Our Ethical Responsibility · Build Your Own AI.
- **Every module follows the same flow:** Warm-up quiz → Slides → Quick check → Practice worksheet or Python activity → Exit question → Wrap-up quiz.
- **Warm-up and wrap-up use the same questions**, so every question is a matched before/after pair. The warm-up gives no feedback; on the wrap-up a wrong answer gets a hint and a retry, but only the **first try** counts.
- **Quick checks** give a hint after a wrong answer and let the student retry. A first-try right answer scores full credit.
- **Slides** are built from CIC's own deck, with section dividers and a "Slide X of Y" label.
- **Digital worksheets** with short, long and number answers, typed right in the lesson. Drafts save on the device while typing, and the worksheet must be submitted before the next step unlocks.
- **Python in the browser** (CodeMirror editor + Pyodide in a Web Worker, no server): Run code, Stop, Reset, and automatic tests that show which pass. The step unlocks when all tests pass. Hints appear one at a time and never give the answer.
- **Exit question** to close each module.
- **Every question is tagged with a concept**, which powers concept mastery on the teacher dashboard.
- **Modules unlock in order** (lock icons), and inside a module each step unlocks after the one before.
- **Skip for now:** a student can skip a step and come back; it still counts as not done.
- **Late joiners** land on a "Start here" card at Module 1 with a friendly note that the class is further along and that's okay.
- **My progress page:** warm-up average, wrap-up average and the student's own learning gain.
- **Day streak counter** and **confetti** on finishing activities (off when Reduce motion is on).
- **Loading, empty and error states** on every screen.

#### Students
- **Join with a class code, pick your name and tap a 3-picture code.** No email, no passwords.
- **Join protection:** repeated wrong picture codes lock out the student and the client for a while.
- **Leave** button to sign out of the class.
- **Self-learners:** anyone can make a free account at `/start` and take any module in any order. Modules published later show up automatically. They appear to CIC admins as an "Independent learners" cohort.

#### Teachers (`/teach`)
- **Create a class in under 10 minutes** (`/teach/new`): name, school, which modules to assign, then paste a roster or upload a CSV (first name, last initial).
- **Automatic codes:** a 6-character class code and a 3-picture code for every student.
- **Share tools:** Copy class code, Copy join message, and **Print picture codes** for handing out.
- **Add students later** from the Roster page the same way.
- **Overview:** module completion, learning gain (wrap-up minus warm-up), **concept mastery** ranked weakest first, a **Need help now** list (3+ wrong tries on a check, or idle for 3 days) and a **Not started** list.
- **Roster:** every student with status (on track, stuck, not started, done), progress and picture codes.
- **Insights** (`/teach/insights`):
  - Student × activity **heat map**, switchable between score and time on task.
  - **Activity per day** chart.
  - **Time per module vs. estimate**, using the median among students who finished.
  - **"Worth a look" flags** for very fast finishes, fast perfect scores, sudden big jumps and bursts of activities in a short window. These are conversation starters, not proof of cheating.
- **Class assistant** (`/teach/assistant`): ask an AI who needs help, what to reteach and how to group students, with one-tap suggested questions.
  - 10 questions per teacher per week (resets Monday), real teacher accounts only (not the demo login), with a "questions left" counter.
  - Students are sent as S1, S2…, names are swapped back only in the reply on our server, and students' written answers are never sent.
  - The gateway key stays in server env vars, and the class loads with the teacher's own login, so teachers can only ask about their own classes.
  - A failed answer is not counted against the weekly limit.

#### CIC admins (`/admin`)
- **Program overview:** totals across every school, then *Schools at a glance* and *Every cohort*, each with completion, average learning gain and stuck counts.
- **Open any class** exactly as its teacher sees it.
- **Grant-report CSVs:** one row per cohort, or one row per student.
- **Onboard partner schools** (`/admin/schools`): add a school, create its teachers' logins and add external reviewers. Temporary passwords are shown once.
- **Curriculum editor** (`/admin/curriculum`): a form-based editor for warm-up questions, slides or video, checks with hints, worksheet prompts, exit question and wrap-up. Changes stay in a private **draft**; **Discard changes** or **Publish now**. Publishing validates the content, updates every screen live and adds new modules to existing classes. Python exercises stay developer-edited on purpose.
- **Read API** for CIC's own dashboard (see below).

#### External reviewers (`/review`)
- Read-only view of the curriculum **with answer keys** and no student data.
- Can also try the product with their own class.

#### Public pages
- **`/curriculum`:** read-only catalog of every module, with no sign-in.
- **`/judges`:** every requirement in the brief, where it lives, and how to try it.
- **Landing page** with entry points for students, teachers, CIC admins and reviewers.

#### Read API (`GET /api/v1/cohorts`)
- Completion, pre/post averages and learning gain per cohort, school and program. Filters: `?school=` and `?code=`.
- **Aggregates only:** never names, picture codes or answers. Values are `null` until there is data.
- Protected by `CIC_DASHBOARD_API_KEY` (at least 24 characters, compared in constant time). Returns `401` for a wrong key, `405` for non-GET and `503` if the key isn't configured, so a bad deploy can't leave it open. See [docs/API.md](docs/API.md).

### Roles and security
- **Four roles:** student (class code, no account), teacher (own classes only), CIC admin (everything) and external reviewer (curriculum only). A self-learner is the lowest role (`learner`).
- **Enforced on the server:** Supabase row-level security and route middleware, not just hidden buttons. Roles live in `public.profiles.role` and are only set by the server or the seed script.
- **Separate logins per role:** a teacher, an admin and a reviewer can be signed in at the same time in one browser. Each role has its own cookie (see `web/src/lib/auth-areas.ts`), so signing out ends only that role.
- **Student sessions:** a random token in an httpOnly cookie, with only its hash stored in the database.
- **Rate limits:** wrong picture codes lock out; self-learner sign-ups are limited per client and overall through a shared database table. If the limit can't be checked, sign-up is refused.
- **Security headers:** `X-Frame-Options: DENY` and a Content-Security-Policy (report-only in production).
- **Supabase setting:** turn **off** "Allow new users to sign up" (Authentication → Sign In / Providers) so only admins can create accounts. Self-learner emails are not verified.
- **Secrets** (service key, AI gateway key, dashboard API key) stay in server env vars and are never `NEXT_PUBLIC_`.

### Try the demo
Run `npm run dev` and open http://localhost:3000.

| Role | How |
|---|---|
| Self-learner | `/start` → create an account → `/learn` |
| Student | `/join` → class code **MVH3AI** → **Jordan M.** → tap 🦊 🐢 🦉. The sample class runs in the browser only and resets on every join and on **Leave**. |
| Teacher | `/login` → use the trial account shown there (`demo.teacher@example.com`) for the Maryvale cohort of 24 students, plus sample cohorts at other schools for the admin view. `/teach/new` creates a class in under 10 minutes. Trial changes stay in that browser and are wiped at every sign-in and sign-out. |
| External reviewer | `/login?next=/review` with `demo.reviewer@example.com`. Ask the team for the password. |
| CIC admin | `/login?next=/admin` with `demo.admin@example.com`. Not shown on the login page because it has full powers: ask the team for the password. |
| Public catalog | `/curriculum` — no sign-in |

Design decisions: [`docs/superpowers/specs/2026-11-14-cic-learning-platform-design.md`](docs/superpowers/specs/2026-11-14-cic-learning-platform-design.md).

## Accessibility

Every page has a **Display** button (bottom left):

- **Language:** 16 languages through Google's Website Translator — English, Español, العربية, 简体中文, Tiếng Việt, Filipino, Français, Português, हिन्दी, नेपाली, Soomaali, Kiswahili, Русский, Українська, 한국어 and 日本語. Each is listed in its own name. Nothing is sent to Google until a visitor picks a language other than English.
- **Theme:** match device, light or dark, with text at 6:1 contrast or better. Dark mode covers every screen, the Python editor included.
- **Text size:** Default, Large, Larger and Largest (up to 150%). Sizes and spacing are in rem, so the layout scales.
- **Easy-read font** (Lexend) and **extra text spacing** (WCAG 1.4.12), which help many dyslexic readers.
- **Reduce motion:** turns off animations and confetti (also automatic when the device asks).

Inside lessons (`web/src/components/reading-tools.tsx`):

- **Highlighter:** tap any word to mark it in yellow; tap again to remove. Never saved.
- **Read word by word:** one word lit at a time, stepped by Next/Back buttons or arrow keys, or auto-played at three speeds. You can highlight the current word without leaving the reader.
- **Mark for review:** flag quiz questions to revisit; clears on submit.

The reading tools are English-only for now and turn off when another language is chosen. Choices are saved per device (`web/src/lib/display-prefs.ts`) and applied before the page draws.

Everywhere else: WCAG 2.2 AA basics, a skip-to-content link, visible focus rings, full keyboard use (answer choices are real radio buttons; in the code editor press Esc then Tab to leave), labelled controls and screen-reader labels on icons and progress bars, status always shown as icon + text, and brand green only used for text where it passes AA.

## Tech stack

- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, lucide icons
- Code editor / runner: CodeMirror 6 + Pyodide (Python in a Web Worker, no server)
- Backend: Next.js server routes (`/api/*`) and middleware
- Database: Supabase (Postgres, row-level security, email + password auth). Schema is in `supabase/migrations/`
- APIs / services: Supabase, Google's Website Translator (only after a non-English pick), and an AI gateway for the Class assistant. See `.env.example`
- Hosting: Vercel

## Run it locally

Requires Node.js 20+.

```bash
git clone https://github.com/2026-Arizona-Opportunity-Hack/Hungry-Hackers-CodinginColor.git
cd Hungry-Hackers-CodinginColor/web
npm install
npm run dev        # http://localhost:3000
```

1. Create `web/.env.local` from `.env.example` with your Supabase URL, publishable key and secret key. Never commit it.
2. Load the sample class and trial teacher: `npm run seed:demo` (safe to re-run).
3. Fresh Supabase project? Run the files in `supabase/migrations/` in order in its SQL editor first.
4. Class assistant: also set `AI_GATEWAY_URL`, `AI_GATEWAY_KEY` and `AI_MODEL` (in `.env.local`, and in Vercel → Project → Settings → Environment Variables for the live site).
5. CIC dashboard API: set `CIC_DASHBOARD_API_KEY` (24+ characters).
6. `npm run build` type-checks and builds; `npm run lint` runs ESLint.

## Links

- Live demo: https://cic-learn-rouge.vercel.app
- Demo video:
- Design / docs: [design decisions](docs/superpowers/specs/2026-11-14-cic-learning-platform-design.md) · [game plan](docs/HACKATHON_IDEAS.md) · [Read API](docs/API.md)

## After the hackathon

Winning teams finish the project with the nonprofit — the [Definition of Done](https://www.ohack.dev/about/completion) (deployed, nonprofit sign-off, docs, open source) is tracked on your team page. Keep the repo public and the README honest; recruiters do read these.

Need a hand this weekend? [#ask-a-mentor](https://opportunity-hack.slack.com/archives/C01E5CGDQ74) on Slack, or ask in [#hungryhackers](https://opportunity-hack.slack.com/app_redirect?channel=hungryhackers) and a mentor will drop in.
