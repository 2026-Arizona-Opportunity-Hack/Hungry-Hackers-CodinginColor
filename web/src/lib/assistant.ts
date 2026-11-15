/**
 * Cody the teacher helper: keyword FAQ brain. Mock only — no network, no AI
 * keys, no PII. `askAssistant` resolves a canned answer from local context
 * (real flagged counts come from the caller). A future server route can swap
 * this file's guts without touching the UI.
 */

export interface AssistantContext {
  route: string;
  flaggedCount: number;
  className: string;
}

export async function askAssistant(message: string, ctx: AssistantContext): Promise<string> {
  // Keep the async shape so a future /api/assistant route slots in.
  await new Promise((r) => setTimeout(r, 500));
  const m = message.toLowerCase();

  if (/(stuck|stuggle|struggle|help|flag|behind|lost|confus)/.test(m)) {
    return ctx.flaggedCount > 0
      ? `Right now ${ctx.flaggedCount} student${ctx.flaggedCount === 1 ? " is" : "s are"} flagged as needing help in ${ctx.className}. Open the roster filtered to "Needs help" — each row shows which activity tripped the stuck rule (3+ wrong tries on a check), so you can start there.`
      : `Nobody is flagged as stuck in ${ctx.className} right now — nice! If a student looks lost anyway, the roster shows per-student progress so you can spot who hasn't moved today.`;
  }
  if (/(xp|level|robot|avatar|evol|bonus|coin)/.test(m)) {
    return "Students earn 10 XP per finished activity, plus bonuses: +5 for a check on the first try, +10 for code tests passing first try, +20 for finishing a module's wrap-up, and +5 for each streak day. Their robot evolves through 10 stages at 0/60/150/280/450/660/920/1240/1630/2100 XP. Bonuses are idempotent, so retries never inflate XP.";
  }
  if (/(roster|add|student|join|code|picture)/.test(m)) {
    return `On the Roster page you can add students and print picture codes. Students join at /join with the 6-letter class code, then tap their three picture emoji — no passwords, and only first name + last initial is ever stored.`;
  }
  if (/(module|unlock|assign|curriculum|lesson)/.test(m)) {
    return "Modules unlock in order unless the class is self-paced. Use the Course map to preview modules, and the Curriculum page to edit content — publishing updates every student screen at once.";
  }
  if (/(insight|progress|gain|report|grade|export|print)/.test(m)) {
    return "Insights shows class-wide learning gain (warm-up vs wrap-up), per-module completion, and rushed flags. Roster rows show each student's status — print picture codes from there before class starts.";
  }
  if (/(hi|hello|hey|thanks|thank)/.test(m)) {
    return `Hi! I'm Cody, your classroom helper. Ask me about stuck students, XP and robots, roster setup, modules, or insights — e.g. "who needs help?"`;
  }
  return `Good question! I can help with: who needs help (${ctx.flaggedCount} flagged in ${ctx.className}), how XP and robot evolution work, roster and join codes, modules and unlocking, or reading Insights. What would you like to dig into?`;
}

export const ASSISTANT_CHIPS = [
  "Who needs help?",
  "How does XP work?",
  "How do students join?",
] as const;
