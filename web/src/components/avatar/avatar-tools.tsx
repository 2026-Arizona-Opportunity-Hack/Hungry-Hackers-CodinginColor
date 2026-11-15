"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Avatar, LevelChip } from "@/components/avatar/avatar";
import { getAvatarProfile, updateAvatarProfile } from "@/lib/repo";
import { useAvatar } from "./avatar-context";

/**
 * One card on the avatar page: shuffle between 3 generated names, then
 * pick. Picked-from-options only — no free text.
 */
export function NamePicker({
  classId,
  studentId,
  rosterIds,
}: {
  classId: string;
  studentId: string;
  rosterIds: string[];
}) {
  const { refresh } = useAvatar();
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    import("@/lib/avatar/name").then(({ generateNameOptions, resolveUniqueName }) => {
      if (!live) return;
      const taken = new Set(
        rosterIds
          .filter((id) => id !== studentId)
          .map((id) => getAvatarProfile(classId, id, []).name)
          .filter(Boolean),
      );
      const opts = generateNameOptions(studentId, 3).map((n) =>
        taken.has(n) ? resolveUniqueName(`${studentId}:${n}`, taken) : n,
      );
      if (live) {
        setOptions(opts);
        setPicked(getAvatarProfile(classId, studentId, rosterIds).name);
      }
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, studentId]);

  function shuffle() {
    import("@/lib/avatar/name").then(({ generateNameOptions, resolveUniqueName }) => {
      const salt = `${studentId}:${Date.now() % 997}`;
      const taken = new Set(
        rosterIds
          .filter((id) => id !== studentId)
          .map((id) => getAvatarProfile(classId, id, []).name)
          .filter(Boolean),
      );
      setOptions(
        generateNameOptions(salt, 3).map((n) => (taken.has(n) ? resolveUniqueName(`${salt}:${n}`, taken) : n)),
      );
    });
  }

  function pick(name: string) {
    setPicked(name);
    updateAvatarProfile(classId, studentId, { name });
    refresh();
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Choose your robot's name" className="grid gap-2 sm:grid-cols-3">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={picked === n}
            onClick={() => pick(n)}
            className={
              picked === n
                ? "min-h-12 rounded-2xl border-2 border-cic-dark bg-cic-tint px-3 font-black text-cic-darker shadow-slab"
                : "min-h-12 rounded-2xl border-2 border-cic-line bg-white px-3 font-bold hover:bg-cic-tint"
            }
          >
            {n}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={shuffle}
        className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-xl border-2 border-cic-dark px-3 text-sm font-black text-cic-dark hover:bg-cic-tint"
      >
        <Sparkles aria-hidden className="size-4" /> Shuffle names
      </button>
    </div>
  );
}

/** Demo-only controls: gift +50 XP or reset the avatar. No new personal data. */
export function DemoAvatarTools({ classId, studentId }: { classId: string; studentId: string }) {
  const { refresh } = useAvatar();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          import("@/lib/repo").then(({ awardXp }) => {
            awardXp(classId, studentId, `demo:boost:${Date.now()}`, 50);
            setMsg("+50 demo XP added!");
            refresh();
          });
        }}
        className="min-h-11 rounded-xl bg-cic-dark px-4 text-sm font-black text-white shadow-slab"
      >
        +50 demo XP
      </button>
      <button
        type="button"
        onClick={() => {
          import("@/lib/repo").then(({ resetAvatar }) => {
            resetAvatar(classId, studentId);
            setMsg("Avatar reset to a fresh unique name.");
            refresh();
          });
        }}
        className="min-h-11 rounded-xl border-2 border-cic-line px-4 text-sm font-bold hover:bg-cic-tint"
      >
        Reset avatar
      </button>
      {msg && (
        <p role="status" className="text-sm font-bold text-cic-dark">
          {msg}
        </p>
      )}
    </div>
  );
}

/** Mini top-bar chip: sprite + name + Lv, linking to the avatar page. */
export function AvatarChip() {
  const { level, profile } = useAvatar();
  return (
    <Link
      href="/learn/avatar"
      aria-label={`Your robot ${profile.name}, level ${level}. Open avatar page.`}
      className="inline-flex max-w-40 items-center gap-1.5 rounded-full border-2 border-cic-line py-0.5 pr-2 pl-0.5 hover:bg-cic-tint sm:max-w-56"
    >
      <Avatar level={level} size={32} className="h-8 w-8 rounded-full" />
      <span className="hidden max-w-20 truncate text-sm font-bold min-[400px]:inline sm:max-w-32">
        {profile.name}
      </span>
      <LevelChip level={level} />
    </Link>
  );
}
