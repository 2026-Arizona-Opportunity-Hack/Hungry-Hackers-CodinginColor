"use client";

import { Check, Lock, RotateCcw } from "lucide-react";
import { RobotPicture, shownStage } from "@/components/robot-avatar";
import { Button, Card, Loading, PageTitle, cx } from "@/components/ui";
import { LEVEL_XP, MAX_LEVEL, robotLevel } from "@/lib/robot-level";
import {
  DEFAULT_STYLE,
  NAME_MAX,
  ROBOT_BACKGROUNDS,
  ROBOT_COLORS,
  backgroundCss,
  cleanName,
  saveRobotStyle,
  useRobotStyle,
  type RobotStyle,
} from "@/lib/robot-style";
import { useStudent } from "@/lib/use-student";

/** Big round option buttons share this look; the chosen one gets a thick ring. */
const optionBase =
  "relative grid size-14 place-items-center rounded-full border-2 border-cic-line outline-offset-4 transition-transform hover:scale-105 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-cic-dark";
const chosen = "ring-4 ring-cic-dark ring-offset-2";

export default function AvatarPage() {
  const ctx = useStudent();
  const studentId = ctx?.student.id ?? "";
  const style = useRobotStyle(studentId);
  if (!ctx) return <Loading />;

  const { xp } = ctx;
  const { level, nextAt } = robotLevel(xp);
  const stage = shownStage(style, level);
  const name = style.name || "Your robot";
  const set = (patch: Partial<RobotStyle>) => saveRobotStyle(studentId, { ...style, ...patch });

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="My robot" subtitle="Make it yours. Your robot grows a new stage as you earn XP." />

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Preview */}
        <Card className="flex flex-col items-center text-center md:sticky md:top-4 md:self-start">
          <RobotPicture
            key={`${stage}-${style.color}`}
            style={style}
            stage={stage}
            size={240}
            alt={`${name}, stage ${stage}`}
            className="animate-pop rounded-3xl"
          />
          <p className="mt-4 font-display text-2xl break-all">{name}</p>
          <p className="text-cic-muted">
            Level {level} · {xp} XP
          </p>
          <p className="mt-1 text-sm text-cic-muted" aria-live="polite">
            {nextAt === null ? "Every stage unlocked!" : `${nextAt - xp} XP to unlock stage ${level + 1}`}
          </p>
          <p className="mt-3 text-sm text-cic-muted">Changes save on their own.</p>
        </Card>

        <div className="space-y-6">
          {/* Name */}
          <Card>
            <label htmlFor="robot-name" className="text-lg font-bold">
              Name your robot
            </label>
            <input
              id="robot-name"
              type="text"
              value={style.name}
              maxLength={NAME_MAX}
              placeholder="e.g. Byte"
              autoComplete="off"
              onChange={(e) => set({ name: cleanName(e.target.value) })}
              className="mt-2 block min-h-11 w-full rounded-xl border-2 border-cic-line bg-white px-3 text-lg focus:border-cic-dark"
              aria-describedby="robot-name-hint"
            />
            <p id="robot-name-hint" className="mt-1 text-sm text-cic-muted">
              Up to {NAME_MAX} letters or numbers. {style.name.length}/{NAME_MAX}
            </p>
          </Card>

          {/* Colour */}
          <Card>
            <fieldset>
              <legend className="text-lg font-bold">Colour</legend>
              <div className="mt-3 flex flex-wrap gap-4">
                {ROBOT_COLORS.map((c) => (
                  <label key={c.id} className="flex flex-col items-center gap-1 text-sm font-bold">
                    <span className={cx(optionBase, style.color === c.id && chosen)} style={{ background: c.swatch }}>
                      <input
                        type="radio"
                        name="robot-color"
                        value={c.id}
                        checked={style.color === c.id}
                        onChange={() => set({ color: c.id })}
                        className="sr-only"
                      />
                      {style.color === c.id && <Check aria-hidden className="size-6 text-white" />}
                    </span>
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>

          {/* Background */}
          <Card>
            <fieldset>
              <legend className="text-lg font-bold">Background</legend>
              <div className="mt-3 flex flex-wrap gap-4">
                {ROBOT_BACKGROUNDS.map((b) => (
                  <label key={b.id} className="flex flex-col items-center gap-1 text-sm font-bold">
                    <span
                      className={cx(optionBase, "rounded-2xl", style.background === b.id && chosen)}
                      style={{ background: b.id === "none" ? undefined : backgroundCss(b.id) }}
                    >
                      <input
                        type="radio"
                        name="robot-bg"
                        value={b.id}
                        checked={style.background === b.id}
                        onChange={() => set({ background: b.id })}
                        className="sr-only"
                      />
                      {style.background === b.id && (
                        <Check aria-hidden className={cx("size-6", b.id === "space" ? "text-white" : "text-cic-dark")} />
                      )}
                    </span>
                    {b.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>

          {/* Stages */}
          <Card>
            <fieldset>
              <legend className="text-lg font-bold">Stage</legend>
              <p className="text-sm text-cic-muted">Show any stage you&apos;ve unlocked. Earn XP to unlock the rest.</p>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                <label className="flex flex-col items-center gap-1 text-center text-sm font-bold">
                  <span
                    className={cx(
                      "relative grid size-20 place-items-center rounded-2xl border-2 border-cic-line bg-cic-tint text-cic-dark has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-cic-dark",
                      style.stage === null && chosen,
                    )}
                  >
                    <input
                      type="radio"
                      name="robot-stage"
                      checked={style.stage === null}
                      onChange={() => set({ stage: null })}
                      className="sr-only"
                    />
                    <span className="font-display text-lg">Auto</span>
                  </span>
                  Newest
                </label>
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((n) => {
                  const unlocked = n <= level;
                  return (
                    <label
                      key={n}
                      className={cx("flex flex-col items-center gap-1 text-center text-sm font-bold", !unlocked && "text-cic-muted")}
                    >
                      <span
                        className={cx(
                          "relative grid size-20 place-items-center overflow-hidden rounded-2xl border-2 border-cic-line has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-cic-dark",
                          style.stage === n && chosen,
                          !unlocked && "bg-cic-line/40",
                        )}
                      >
                        <input
                          type="radio"
                          name="robot-stage"
                          checked={style.stage === n}
                          disabled={!unlocked}
                          onChange={() => set({ stage: n })}
                          className="sr-only"
                        />
                        <RobotPicture style={style} stage={n} size={76} alt="" locked={!unlocked} />
                        {!unlocked && <Lock aria-hidden className="absolute size-5 text-cic-muted" />}
                      </span>
                      <span>
                        Stage {n}
                        {!unlocked && <span className="block text-xs font-normal">{LEVEL_XP[n - 1]} XP</span>}
                        {!unlocked && <span className="sr-only">, locked</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Card>

          <Button variant="secondary" onClick={() => saveRobotStyle(studentId, DEFAULT_STYLE)}>
            <RotateCcw aria-hidden className="size-4" /> Start over
          </Button>
        </div>
      </div>
    </div>
  );
}
