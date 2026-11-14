import { ClipboardList, Code2, DoorOpen, HelpCircle, PencilLine, Presentation, Trophy, type LucideIcon } from "lucide-react";
import type { ActivityKind } from "@/lib/types";

export const STAGE_ICONS: Record<ActivityKind, LucideIcon> = {
  pretest: ClipboardList,
  slides: Presentation,
  check: HelpCircle,
  worksheet: PencilLine,
  code: Code2,
  exit: DoorOpen,
  posttest: Trophy,
};
