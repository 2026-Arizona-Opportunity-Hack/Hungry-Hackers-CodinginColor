"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STAGES } from "@/lib/avatar/config";
import { galleryStatus, levelForXp, xpToNext } from "@/lib/avatar/xp";
import { getAvatarProfile, markLevelSeen, type AvatarProfile, type XpAward } from "@/lib/repo";
import { LevelUpModal } from "./level-up-modal";

export interface AvatarContextValue {
  classId: string;
  studentId: string;
  profile: AvatarProfile;
  rosterIds: string[];
  /** Base 10/activity XP + bonus awards. */
  xp: number;
  level: number;
  xpNeeded: number;
  justEarned: { amount: number; bumpKey: number };
  pendingLevelUp: number | null;
  dismissLevelUp: () => void;
  refresh: () => void;
  gallery: { level: number; status: "seen" | "current" | "locked" }[];
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

export function useAvatar(): AvatarContextValue {
  const v = useContext(AvatarContext);
  if (!v) throw new Error("useAvatar must be used inside <AvatarProvider>");
  return v;
}

/**
 * Owns the avatar profile for one student. `xp` comes from the caller (base
 * XP from results + bonus awards) so every screen shares one definition.
 * Level-up modal appears at most once per level (lastSeenLevel guard).
 */
export function AvatarProvider({
  classId,
  studentId,
  baseXp,
  bonusXp,
  awardsVersion,
  children,
}: {
  classId: string;
  studentId: string;
  baseXp: number;
  bonusXp: number;
  /** Bumps whenever new awards land, so popups/modals re-evaluate. */
  awardsVersion: number;
  children: React.ReactNode;
}) {
  const [, setTick] = useState(0);
  const [bumpKey, setBumpKey] = useState(0);
  const [lastAwardAmount, setLastAwardAmount] = useState(0);
  const [pendingLevelUp, setPendingLevelUp] = useState<number | null>(null);

  const profile = getAvatarProfile(classId, studentId, []);
  const rosterIds: string[] = [];
  const xp = baseXp + bonusXp;
  const level = levelForXp(xp);
  const xpNeeded = xpToNext(xp);

  // After awards land: popup the latest amount, and queue the modal the
  // first time each new level is seen.
  useEffect(() => {
    if (awardsVersion === 0) return;
    setTick((t) => t + 1);
    const awards = getAvatarProfile(classId, studentId, []).awards;
    const latest: XpAward | undefined = awards[awards.length - 1];
    if (latest) {
      setLastAwardAmount(latest.amount);
      setBumpKey((k) => k + 1);
    }
    const seenNow = getAvatarProfile(classId, studentId, []).lastSeenLevel;
    const nowLevel = levelForXp(baseXp + bonusXp);
    if (nowLevel > Math.max(1, seenNow)) {
      setPendingLevelUp(nowLevel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awardsVersion]);

  const dismissLevelUp = useCallback(() => {
    setPendingLevelUp((lvl) => {
      if (lvl !== null) markLevelSeen(classId, studentId, lvl);
      return null;
    });
  }, [classId, studentId]);

  // Safety: if the profile already caught up (e.g. two tabs), don't modal.
  useEffect(() => {
    if (pendingLevelUp !== null && profile.lastSeenLevel >= pendingLevelUp) {
      setPendingLevelUp(null);
    }
  }, [pendingLevelUp, profile.lastSeenLevel]);

  const gallery = useMemo(
    () => STAGES.map((s) => ({ level: s.level, status: galleryStatus(s.level, level) })),
    [level],
  );

  const value: AvatarContextValue = {
    classId,
    studentId,
    profile,
    rosterIds,
    xp,
    level,
    xpNeeded,
    justEarned: { amount: lastAwardAmount, bumpKey },
    pendingLevelUp,
    dismissLevelUp,
    refresh: () => setTick((t) => t + 1),
    gallery,
  };

  return (
    <AvatarContext.Provider value={value}>
      {children}
      {pendingLevelUp !== null && (
        <LevelUpModal level={pendingLevelUp} robotName={profile.name} onClose={dismissLevelUp} />
      )}
    </AvatarContext.Provider>
  );
}
