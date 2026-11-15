"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Lock, Palette } from "lucide-react";
import { Card, LinkButton, Loading } from "@/components/ui";
import { SHOP_BACKDROPS, SHOP_COLORS, SHOP_PETS, STAGES } from "@/lib/avatar/config";
import { levelForXp } from "@/lib/avatar/xp";
import { bonusXpFor, getAvatarProfile, getSession } from "@/lib/repo";
import { useStudent } from "@/lib/use-student";
import { Avatar, AvatarStage, LevelChip, NextTeaser, useAvatar } from "@/components/avatar";
import { DemoAvatarTools, NamePicker } from "@/components/avatar/avatar-tools";

function CustomizeTab() {
  const { classId, studentId, profile, level, refresh } = useAvatar();

  function pick(patch: Partial<typeof profile>) {
    import("@/lib/repo").then(({ updateAvatarProfile }) => {
      updateAvatarProfile(classId, studentId, patch);
      refresh();
    });
  }

  const petEmoji = (id: string) => SHOP_PETS.find((p) => p.id === id)?.emoji ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div className="justify-self-center">
        <AvatarStage
          level={level}
          colorId={profile.color}
          backdropId={profile.backdrop}
          petId={profile.pet}
          petEmoji={petEmoji(profile.pet)}
          size={200}
          priority
        />
        <p className="mt-2 text-center text-sm font-bold text-cic-muted">Live preview</p>
      </div>

      <div className="space-y-6">
        <section aria-labelledby="color-h">
          <h3 id="color-h" className="font-bold">
            Glow color
          </h3>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SHOP_COLORS.map((c) => {
              const locked = level < c.unlockLevel;
              const active = profile.color === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => pick({ color: c.id })}
                    aria-pressed={active}
                    aria-label={locked ? `${c.label}, unlocks at level ${c.unlockLevel}` : `${c.label}${active ? ", selected" : ""}`}
                    className={
                      active
                        ? "flex min-h-12 w-full items-center gap-2 rounded-xl border-2 border-cic-dark bg-cic-tint px-3 font-bold shadow-slab"
                        : locked
                          ? "flex min-h-12 w-full cursor-not-allowed items-center gap-2 rounded-xl border-2 border-dashed border-cic-line bg-white px-3 text-cic-muted"
                          : "flex min-h-12 w-full items-center gap-2 rounded-xl border-2 border-cic-line bg-white px-3 font-bold hover:bg-cic-tint"
                    }
                  >
                    <span aria-hidden className="size-6 rounded-full border-2 border-cic-line" style={{ background: c.swatch }} />
                    <span className="flex-1 text-left text-sm">{c.label}</span>
                    {locked ? <Lock aria-hidden className="size-4" /> : active ? <Check aria-hidden className="size-4 text-cic-dark" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="backdrop-h">
          <h3 id="backdrop-h" className="font-bold">
            Backdrop
          </h3>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SHOP_BACKDROPS.map((b) => {
              const locked = level < b.unlockLevel;
              const active = profile.backdrop === b.id;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => pick({ backdrop: b.id })}
                    aria-pressed={active}
                    aria-label={locked ? `${b.label}, unlocks at level ${b.unlockLevel}` : `${b.label}${active ? ", selected" : ""}`}
                    className={
                      active
                        ? "min-h-12 w-full rounded-xl border-2 border-cic-dark bg-cic-tint px-3 text-sm font-bold shadow-slab"
                        : locked
                          ? "min-h-12 w-full cursor-not-allowed rounded-xl border-2 border-dashed border-cic-line bg-white px-3 text-sm text-cic-muted"
                          : "min-h-12 w-full rounded-xl border-2 border-cic-line bg-white px-3 text-sm font-bold hover:bg-cic-tint"
                    }
                  >
                    {locked ? <Lock aria-hidden className="mx-auto size-4" /> : null}
                    {b.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="pet-h">
          <h3 id="pet-h" className="font-bold">
            Sidekick pet
          </h3>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SHOP_PETS.map((p) => {
              const locked = level < p.unlockLevel;
              const active = profile.pet === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => pick({ pet: p.id })}
                    aria-pressed={active}
                    aria-label={locked ? `${p.label}, unlocks at level ${p.unlockLevel}` : `${p.label}${active ? ", selected" : ""}`}
                    className={
                      active
                        ? "min-h-12 w-full rounded-xl border-2 border-cic-dark bg-cic-tint px-3 text-sm font-bold shadow-slab"
                        : locked
                          ? "min-h-12 w-full cursor-not-allowed rounded-xl border-2 border-dashed border-cic-line bg-white px-3 text-sm text-cic-muted"
                          : "min-h-12 w-full rounded-xl border-2 border-cic-line bg-white px-3 text-sm font-bold hover:bg-cic-tint"
                    }
                  >
                    {locked ? <Lock aria-hidden className="mx-auto size-4" /> : p.emoji ? `${p.emoji} ${p.label}` : p.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function GalleryTab() {
  const { level } = useAvatar();
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {STAGES.map((s) => {
        const locked = s.level > level;
        const current = s.level === level;
        return (
          <li
            key={s.level}
            className={
              current
                ? "rounded-2xl border-2 border-cic-dark bg-white p-3 text-center shadow-slab"
                : "rounded-2xl border-2 border-cic-line bg-white p-3 text-center"
            }
          >
            {locked ? (
              <div className="grid h-24 place-items-center rounded-xl bg-cic-tint" aria-hidden>
                <Lock className="size-8 text-cic-muted" />
              </div>
            ) : (
              <Avatar level={s.level} size={96} className="mx-auto h-24 w-24" />
            )}
            <p className="mt-2 text-sm font-black">
              {locked ? "???" : s.title} <LevelChip level={s.level} />
            </p>
            {!locked && <p className="mt-0.5 text-xs text-cic-muted">{s.tagline}</p>}
            {locked && <p className="mt-0.5 text-xs text-cic-muted">Keep earning XP to unlock</p>}
          </li>
        );
      })}
    </ol>
  );
}

export default function AvatarPage() {
  const ctx = useStudent();
  const [tab, setTab] = useState<"name" | "style" | "gallery">("name");
  if (!ctx) return <Loading />;
  const { cls, student, baseXp, bonusXp } = ctx;
  const xp = baseXp + bonusXp;
  const level = levelForXp(xp);

  return (
    <AvatarPageInner
      key={`${cls.id}:${student.id}`}
      classId={cls.id}
      studentId={student.id}
      rosterIds={cls.roster.map((s) => s.id)}
      xp={xp}
      level={level}
      tab={tab}
      setTab={setTab}
    />
  );
}

function AvatarPageInner({
  classId,
  studentId,
  rosterIds,
  xp,
  level,
  tab,
  setTab,
}: {
  classId: string;
  studentId: string;
  rosterIds: string[];
  xp: number;
  level: number;
  tab: "name" | "style" | "gallery";
  setTab: (t: "name" | "style" | "gallery") => void;
}) {
  // Touch the store so the header snapshot below refreshes on any save.
  void bonusXpFor(getAvatarProfile(classId, studentId, rosterIds));
  void getSession();

  const profileSnapshot = getAvatarProfile(classId, studentId, rosterIds);
  const stage = STAGES[level - 1];
  const petEmoji = SHOP_PETS.find((p) => p.id === profileSnapshot.pet)?.emoji ?? "";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-cic-dark">My robot</h1>
      <p className="mt-1 text-cic-muted">
        {profileSnapshot.name} · Level {level} · {xp} XP
      </p>

      <Card className="mt-4 flex flex-wrap items-center gap-4">
        <AvatarStage
          level={level}
          colorId={profileSnapshot.color}
          backdropId={profileSnapshot.backdrop}
          petId={profileSnapshot.pet}
          petEmoji={petEmoji}
          size={160}
          priority
        />
        <div className="min-w-48 flex-1">
          <p className="font-display text-2xl">{profileSnapshot.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-bold text-cic-muted">
            Level {level}: {stage.title} <LevelChip level={level} />
          </p>
          <p className="mt-1 text-sm italic">“{stage.speech.replace("{name}", profileSnapshot.name)}”</p>
          <NextTeaser stage={stage} className="mt-2" />
        </div>
      </Card>

      <div role="tablist" aria-label="Avatar settings" className="mt-6 flex gap-2">
        {(
          [
            { id: "name", label: "Shuffle name" },
            { id: "style", label: "Customize" },
            { id: "gallery", label: "Your evolution" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-cic-dark px-3 font-black text-white shadow-slab"
                : "inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border-2 border-cic-line bg-white px-3 font-bold hover:bg-cic-tint"
            }
          >
            {t.id === "style" && <Palette aria-hidden className="size-4" />}
            {t.label}
          </button>
        ))}
      </div>

      <Card className="mt-4">
        {tab === "name" && (
          <div role="tabpanel" aria-label="Shuffle name">
            <h2 className="font-bold">Pick from these robot names</h2>
            <p className="mt-1 text-sm text-cic-muted">
              Names are generated for you — unique in your class — so everyone&apos;s robot feels one-of-a-kind.
            </p>
            <div className="mt-3">
              <NamePicker classId={classId} studentId={studentId} rosterIds={rosterIds} />
            </div>
          </div>
        )}
        {tab === "style" && (
          <div role="tabpanel" aria-label="Customize">
            <CustomizeTab />
          </div>
        )}
        {tab === "gallery" && (
          <div role="tabpanel" aria-label="Your evolution">
            <h2 className="font-bold">Your evolution</h2>
            <p className="mt-1 text-sm text-cic-muted">Locked stages stay a mystery until your robot grows into them.</p>
            <div className="mt-3">
              <GalleryTab />
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold">Demo tools</h2>
        <p className="mt-1 text-sm text-cic-muted">Try the full journey: gift XP, watch the robot evolve, then reset.</p>
        <div className="mt-3">
          <DemoAvatarTools classId={classId} studentId={studentId} />
        </div>
        <p className="mt-3">
          <Link href="/learn" className="font-bold text-cic-dark underline underline-offset-2">
            Back to Home
          </Link>
        </p>
      </Card>
    </div>
  );
}
