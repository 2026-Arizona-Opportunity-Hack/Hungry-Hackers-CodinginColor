"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame, Map, PartyPopper, Star, Users } from "lucide-react";
import { Card, HeroPanel, LinkButton, Loading, Minutes } from "@/components/ui";
import { STAGE_ICONS } from "@/components/stage-icon";
import { AvatarStage, NextTeaser, XpPopup, useAvatar } from "@/components/avatar";
import { SHOP_PETS, STAGES } from "@/lib/avatar/config";
import { courseProgress, moduleComplete, moduleDoneCount, nextStep, skippedActivities } from "@/lib/analytics";
import { getClassProgress } from "@/lib/repo";
import { STAGE_LABELS } from "@/lib/types";
import { useStudent } from "@/lib/use-student";

function EvolutionJourneyCard() {
  const { profile, level, xp, xpNeeded, justEarned } = useAvatar();
  const stage = STAGES[level - 1];
  const petEmoji = SHOP_PETS.find((p) => p.id === profile.pet)?.emoji ?? "";
  return (
    <section aria-labelledby="evolution" className="mt-8">
      <h2 id="evolution" className="font-display text-2xl text-cic-dark">
        My evolution journey
      </h2>
      <Card className="mt-4 flex flex-wrap items-center gap-4">
        <div className="relative">
          <AvatarStage
            level={level}
            colorId={profile.color}
            backdropId={profile.backdrop}
            petId={profile.pet}
            petEmoji={petEmoji}
            size={140}
            priority
          />
          <XpPopup amount={justEarned.amount} bumpKey={justEarned.bumpKey} />
        </div>
        <div className="min-w-52 flex-1">
          <p className="font-display text-2xl">
            {profile.name} · <span className="text-cic-dark">Lv {level}</span>
          </p>
          <p className="text-sm font-bold text-cic-muted">
            {stage.title} · {xp} XP{xpNeeded > 0 ? ` · ${xpNeeded} XP to next stage` : " · fully evolved!"}
          </p>
          <p aria-live="polite" className="mt-1 text-sm italic">
            “{stage.speech.replace("{name}", profile.name)}”
          </p>
          <NextTeaser stage={stage} className="mt-1" />
          <LinkButton href="/learn/avatar" variant="secondary" className="mt-3">
            Open my robot <ArrowRight aria-hidden className="size-5" />
          </LinkButton>
        </div>
      </Card>
    </section>
  );
}

export default function StudentHome() {
  const ctx = useStudent();
  if (!ctx) return <Loading />;
  const { student, cls, course, modules, progress, xp } = ctx;

  const next = nextStep(progress, modules);
  const started = Object.keys(progress.results).length > 0;
  const overall = courseProgress(progress, modules);
  const doneModules = modules.filter((m) => moduleComplete(progress, m)).length;
  // Undone activities the student skipped, grouped under their module.
  const skippedByModule = modules
    .map((m) => ({ module: m, skipped: skippedActivities(progress, m) }))
    .filter((g) => g.skipped.length > 0);

  // Where is most of the class? Shown to reassure late joiners.
  const classmates = Object.values(getClassProgress(cls)).filter((p) => p.studentId !== student.id);
  const positions = classmates.map((p) => nextStep(p, modules)?.module.number ?? modules.length).sort((a, b) => a - b);
  const classModule = positions.length ? positions[Math.floor(positions.length / 2)] : 1;
  const modPct = next ? moduleDoneCount(progress, next.module) / next.module.activities.length : 1;

  const stats = [
    { Icon: Flame, value: `${progress.streakDays}`, label: "day streak" },
    { Icon: Star, value: `${xp}`, label: "XP" },
    { Icon: CheckCircle2, value: `${Math.round(overall * 100)}%`, label: "of the course" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <HeroPanel>
        <p className="font-bold text-cic-tint">{started ? "Welcome back" : cls.selfPaced ? "Welcome to your learning space" : `Welcome to ${cls.name}`}</p>
        <h1 className="mt-1 font-display text-4xl leading-tight md:text-5xl">Hi, {student.firstName}!</h1>

        {next && (
          <div className="mt-6 max-w-xl rounded-2xl bg-white p-5 text-black shadow-slab">
            {!started ? (
              <>
                <p className="text-sm font-bold text-cic-dark">Start here</p>
                <h2 className="mt-1 text-xl font-bold">
                  Module {next.module.number}: {next.module.title}
                </h2>
                <p className="mt-1 text-cic-muted">
                  {!cls.selfPaced && classModule > 1 ? `Most of your class is around Module ${classModule}, and that's okay. ` : ""}
                  {cls.selfPaced
                    ? "Every module is open to you. Start here, or pick any module you like."
                    : "Every lesson teaches itself, so you can go at your own pace."}
                </p>
                {cls.selfPaced && (
                  <p className="mt-1">
                    <Link href="/learn/course" className="inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline underline-offset-2">
                      Choose a different module
                    </Link>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-cic-dark">
                  Up next{next.activity.title !== STAGE_LABELS[next.activity.kind] ? `: ${STAGE_LABELS[next.activity.kind]}` : ""}
                </p>
                <h2 className="mt-1 text-xl font-bold">{next.activity.title}</h2>
                <p className="text-cic-muted">
                  Module {next.module.number}: {next.module.title}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div
                    role="progressbar"
                    aria-label={`Module ${next.module.number} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(modPct * 100)}
                    className="h-4 flex-1 overflow-hidden rounded-full bg-cic-tint"
                  >
                    <div className="h-full origin-left animate-grow rounded-full bg-cic-green" style={{ width: `${modPct * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold">{Math.round(modPct * 100)}%</span>
                </div>
              </>
            )}
            <LinkButton href={`/learn/lesson/${next.module.id}`} className="mt-4 w-full text-lg sm:w-auto">
              {started ? "Continue" : `Start Module ${next.module.number}`} <ArrowRight aria-hidden className="size-5" />
            </LinkButton>
          </div>
        )}

        {!next && (
          <div className="mt-6 max-w-xl rounded-2xl bg-white p-5 text-black shadow-slab">
            <PartyPopper aria-hidden className="size-8 text-cic-dark" />
            <h2 className="mt-2 text-xl font-bold">You finished the course!</h2>
            <p className="mt-1 text-cic-muted">See how much you grew from warm-up to wrap-up.</p>
            <LinkButton href="/learn/results" className="mt-4">
              See my growth <ArrowRight aria-hidden className="size-5" />
            </LinkButton>
          </div>
        )}

        <ul className="mt-6 flex flex-wrap gap-3" aria-label="My stats">
          {stats.map(({ Icon, value, label }) => (
            <li key={label} className="flex items-center gap-2 rounded-full bg-cic-darker px-4 py-2">
              <Icon aria-hidden className="size-5 text-cic-tint" />
              <span className="font-display text-lg">{value}</span>
              <span className="text-sm text-cic-tint">{label}</span>
            </li>
          ))}
        </ul>
      </HeroPanel>

      <EvolutionJourneyCard />

      {next && (
        <section aria-labelledby="coming" className="mt-8">
          <h2 id="coming" className="font-display text-2xl text-cic-dark">
            Coming up in Module {next.module.number}
          </h2>
          <ol className="stagger mt-4 grid gap-3 sm:grid-cols-3">
            {next.module.activities.slice(next.activityIndex, next.activityIndex + 3).map((a, i) => {
              const Icon = STAGE_ICONS[a.kind];
              return (
                <li key={a.id}>
                  <Card className={i === 0 ? "h-full border-cic-dark shadow-slab" : "h-full"}>
                    <span className={i === 0 ? "grid size-11 place-items-center rounded-xl bg-cic-dark text-white" : "grid size-11 place-items-center rounded-xl bg-cic-tint text-cic-dark"}>
                      <Icon aria-hidden className="size-6" />
                    </span>
                    {a.title !== STAGE_LABELS[a.kind] && <p className="mt-3 text-sm font-bold text-cic-muted">{STAGE_LABELS[a.kind]}</p>}
                    <p className={a.title === STAGE_LABELS[a.kind] ? "mt-3 font-bold" : "font-bold"}>{a.title}</p>
                    <div className="mt-2">
                      <Minutes n={a.minutes} />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {skippedByModule.length > 0 && (
        <section aria-labelledby="comeback" className="mt-8">
          <h2 id="comeback" className="font-display text-2xl text-cic-dark">
            Come back to {skippedByModule.reduce((n, g) => n + g.skipped.length, 0) === 1 ? "this" : "these"} when you&apos;re ready
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {skippedByModule.map(({ module, skipped }) =>
              skipped.map((a) => {
                const Icon = STAGE_ICONS[a.kind];
                return (
                  <li key={a.id}>
                    <Card className="h-full border-dashed border-cic-warn">
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cic-warn-bg text-cic-warn">
                          <Icon aria-hidden className="size-6" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-cic-muted">
                            Module {module.number} · {STAGE_LABELS[a.kind]} · skipped
                          </p>
                          <p className="truncate font-bold">{a.title}</p>
                        </div>
                      </div>
                      <LinkButton href={`/learn/lesson/${module.id}`} variant="secondary" className="mt-3 w-full">
                        Go back to it <ArrowRight aria-hidden className="size-5" />
                      </LinkButton>
                    </Card>
                  </li>
                );
              }),
            )}
          </ul>
        </section>
      )}

      <Card className="mt-8 flex flex-wrap items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-cic-tint text-cic-dark">
          <Users aria-hidden className="size-6" />
        </span>
        <div className="flex-1">
          <p className="font-bold">{cls.selfPaced ? "Your self-paced learning" : `${cls.name}, ${cls.school}`}</p>
          <p className="text-sm text-cic-muted">
            {doneModules} of {modules.length} modules done in {course.title}
          </p>
        </div>
        <LinkButton href="/learn/course" variant="secondary">
          <Map aria-hidden className="size-5" /> Course map
        </LinkButton>
      </Card>
    </div>
  );
}
