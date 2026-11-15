"use client";

import Link from "next/link";
import { Paintbrush } from "lucide-react";
import { MAX_LEVEL, robotImage, robotLevel } from "@/lib/robot-level";
import { backgroundCss, colorFilter, useRobotStyle, type RobotStyle } from "@/lib/robot-style";

/** The stage a student's robot shows: their pick if it's unlocked, else their newest stage. */
export function shownStage(style: RobotStyle, level: number) {
  return style.stage && style.stage <= level ? style.stage : level;
}

/** Robot picture in a rounded tile with the student's colour and background. */
export function RobotPicture({
  style,
  stage,
  size,
  alt,
  className = "",
  locked = false,
}: {
  style: RobotStyle;
  stage: number;
  size: number;
  alt: string;
  className?: string;
  locked?: boolean;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden ${className}`}
      style={{ width: size, height: size, background: locked ? undefined : backgroundCss(style.background) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={robotImage(stage)}
        alt={alt}
        width={size}
        height={size}
        className="size-[88%] object-contain"
        style={{ filter: locked ? "brightness(0) opacity(0.35)" : colorFilter(style.color) }}
      />
    </span>
  );
}

/** Small round robot badge for the top bar. */
export function RobotBadge({ xp, studentId }: { xp: number; studentId: string }) {
  const style = useRobotStyle(studentId);
  const { level } = robotLevel(xp);
  return (
    <Link href="/learn/avatar" className="inline-flex min-h-11 items-center gap-1 rounded-xl px-1 text-sm font-bold hover:bg-cic-tint">
      <RobotPicture style={style} stage={shownStage(style, level)} size={32} alt="" className="rounded-full bg-cic-tint" />
      <span>
        <span className="sr-only">My robot, level </span>
        <span aria-hidden>Lv </span>
        {level}
      </span>
    </Link>
  );
}

/** The student's robot, its level and how close it is to evolving. */
export function RobotCard({ xp, studentId }: { xp: number; studentId: string }) {
  const style = useRobotStyle(studentId);
  const { level, nextAt, toNext } = robotLevel(xp);
  const pct = Math.round(toNext * 100);
  const name = style.name || "Your robot";
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-cic-darker p-4">
      <RobotPicture
        key={`${level}-${style.stage}`}
        style={style}
        stage={shownStage(style, level)}
        size={112}
        alt={`${name}, level ${level} of ${MAX_LEVEL}`}
        className="animate-pop rounded-2xl"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-cic-tint">{name}</p>
        <p className="font-display text-2xl">Level {level}</p>
        {nextAt === null ? (
          <p className="mt-1 text-sm text-cic-tint">Fully evolved! You reached the top level.</p>
        ) : (
          <>
            <div
              role="progressbar"
              aria-label={`Progress to robot level ${level + 1}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="mt-2 h-3 overflow-hidden rounded-full bg-cic-dark"
            >
              <div className="h-full rounded-full bg-cic-green" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-sm text-cic-tint">
              {nextAt - xp} XP until it evolves to Level {level + 1}
            </p>
          </>
        )}
        <Link
          href="/learn/avatar"
          className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-white underline underline-offset-2"
        >
          <Paintbrush aria-hidden className="size-4" /> Customize my robot
        </Link>
      </div>
    </div>
  );
}
