/**
 * Pure helper: determines whether a racket needs restringing.
 * A racket needs restringing when the number of sessions played
 * since the last stringing is >= RESTRING_THRESHOLD (15).
 *
 * This mirrors the logic used in app/page.tsx and analytics.
 */

export const RESTRING_THRESHOLD = 15;

export type PlaySessionStub = { date: string | Date };
export type StringingStub   = { date: string | Date };

export function sessionsSinceLastStringing(
  playSessions: PlaySessionStub[],
  lastStringing: StringingStub | undefined
): number {
  if (!lastStringing) return playSessions.length;
  return playSessions.filter(
    (s) => new Date(s.date) > new Date(lastStringing.date)
  ).length;
}

export function needsRestring(
  playSessions: PlaySessionStub[],
  lastStringing: StringingStub | undefined
): boolean {
  return sessionsSinceLastStringing(playSessions, lastStringing) >= RESTRING_THRESHOLD;
}
