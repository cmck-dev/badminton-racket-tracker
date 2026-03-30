import { describe, it, expect } from "vitest";
import {
  needsRestring,
  sessionsSinceLastStringing,
  RESTRING_THRESHOLD,
} from "@/lib/restring";

// ─── helpers ─────────────────────────────────────────────────────

function makeSessions(dates: string[]) {
  return dates.map((d) => ({ date: d }));
}

function makeStringing(date: string) {
  return { date };
}

// ─── sessionsSinceLastStringing ──────────────────────────────────

describe("sessionsSinceLastStringing", () => {
  // Standard cases
  describe("standard cases", () => {
    it("counts only sessions after the last stringing date", () => {
      const sessions = makeSessions([
        "2024-01-01", // before stringing
        "2024-03-01", // after
        "2024-04-01", // after
      ]);
      const stringing = makeStringing("2024-02-01");
      expect(sessionsSinceLastStringing(sessions, stringing)).toBe(2);
    });

    it("returns total session count when there is no stringing record", () => {
      const sessions = makeSessions(["2024-01-01", "2024-02-01", "2024-03-01"]);
      expect(sessionsSinceLastStringing(sessions, undefined)).toBe(3);
    });

    it("returns 0 when all sessions are before the stringing", () => {
      const sessions = makeSessions(["2024-01-01", "2024-01-15"]);
      const stringing = makeStringing("2024-06-01");
      expect(sessionsSinceLastStringing(sessions, stringing)).toBe(0);
    });

    it("counts sessions on the same day as stringing as NOT after (strict >)", () => {
      const sessions = makeSessions(["2024-02-01"]);
      const stringing = makeStringing("2024-02-01");
      // same date: new Date(session) > new Date(stringing) is false
      expect(sessionsSinceLastStringing(sessions, stringing)).toBe(0);
    });
  });

  // Edge cases
  describe("edge cases", () => {
    it("returns 0 for an empty session list with no stringing", () => {
      expect(sessionsSinceLastStringing([], undefined)).toBe(0);
    });

    it("returns 0 for an empty session list with a stringing record", () => {
      expect(sessionsSinceLastStringing([], makeStringing("2024-01-01"))).toBe(0);
    });

    it("handles exactly RESTRING_THRESHOLD sessions after stringing", () => {
      const dates = Array.from({ length: RESTRING_THRESHOLD }, (_, i) =>
        `2024-03-${String(i + 1).padStart(2, "0")}`
      );
      const sessions = makeSessions(dates);
      const stringing = makeStringing("2024-02-01");
      expect(sessionsSinceLastStringing(sessions, stringing)).toBe(RESTRING_THRESHOLD);
    });

    it("handles RESTRING_THRESHOLD - 1 sessions (just under alert)", () => {
      const dates = Array.from({ length: RESTRING_THRESHOLD - 1 }, (_, i) =>
        `2024-03-${String(i + 1).padStart(2, "0")}`
      );
      const sessions = makeSessions(dates);
      const stringing = makeStringing("2024-02-01");
      expect(sessionsSinceLastStringing(sessions, stringing)).toBe(RESTRING_THRESHOLD - 1);
    });

    it("handles Date objects as well as ISO strings", () => {
      const sessions = [{ date: new Date("2024-04-01") }];
      const stringing = { date: new Date("2024-02-01") };
      expect(sessionsSinceLastStringing(sessions, stringing)).toBe(1);
    });
  });

  // Negative cases
  describe("negative / unusual inputs", () => {
    it("returns 0 for a racket with sessions but no stringing and empty array", () => {
      expect(sessionsSinceLastStringing([], undefined)).toBe(0);
    });

    it("does not count sessions equal to stringing date as needing restring", () => {
      // Stringing was done today; sessions on that same date should not count
      const today = new Date().toISOString().split("T")[0];
      const sessions = makeSessions([today]);
      const stringing = makeStringing(today);
      expect(sessionsSinceLastStringing(sessions, stringing)).toBe(0);
    });
  });
});

// ─── needsRestring ───────────────────────────────────────────────

describe("needsRestring", () => {
  // Standard cases
  describe("standard cases", () => {
    it("returns true when sessions since stringing equals threshold (15)", () => {
      const dates = Array.from({ length: 15 }, (_, i) =>
        `2024-03-${String(i + 1).padStart(2, "0")}`
      );
      const sessions = makeSessions(dates);
      const stringing = makeStringing("2024-02-01");
      expect(needsRestring(sessions, stringing)).toBe(true);
    });

    it("returns true when sessions since stringing exceeds threshold", () => {
      const dates = Array.from({ length: 20 }, (_, i) =>
        `2024-03-${String(i + 1).padStart(2, "0")}`
      );
      const sessions = makeSessions(dates);
      const stringing = makeStringing("2024-02-01");
      expect(needsRestring(sessions, stringing)).toBe(true);
    });

    it("returns false when sessions since stringing is below threshold (14)", () => {
      const dates = Array.from({ length: 14 }, (_, i) =>
        `2024-03-${String(i + 1).padStart(2, "0")}`
      );
      const sessions = makeSessions(dates);
      const stringing = makeStringing("2024-02-01");
      expect(needsRestring(sessions, stringing)).toBe(false);
    });

    it("returns false for a freshly strung racket with 0 sessions after", () => {
      const sessions = makeSessions(["2024-01-01"]);
      const stringing = makeStringing("2024-06-01");
      expect(needsRestring(sessions, stringing)).toBe(false);
    });
  });

  // Edge cases
  describe("edge cases", () => {
    it("returns false for a new racket with no sessions and no stringing", () => {
      expect(needsRestring([], undefined)).toBe(false);
    });

    it("returns true for a racket with 15+ sessions and no stringing at all", () => {
      const dates = Array.from({ length: 15 }, (_, i) =>
        `2024-0${Math.floor(i / 9) + 1}-${String((i % 9) + 1).padStart(2, "0")}`
      );
      const sessions = makeSessions(dates);
      expect(needsRestring(sessions, undefined)).toBe(true);
    });

    it("returns false for a racket with exactly 14 sessions and no stringing", () => {
      const sessions = makeSessions(
        Array.from({ length: 14 }, (_, i) => `2024-01-${String(i + 1).padStart(2, "0")}`)
      );
      expect(needsRestring(sessions, undefined)).toBe(false);
    });

    it("RESTRING_THRESHOLD is 15", () => {
      expect(RESTRING_THRESHOLD).toBe(15);
    });
  });

  // Negative cases
  describe("negative / unusual inputs", () => {
    it("returns false when all sessions predate the stringing", () => {
      const sessions = makeSessions(["2023-01-01", "2023-06-01"]);
      const stringing = makeStringing("2024-01-01");
      expect(needsRestring(sessions, stringing)).toBe(false);
    });

    it("does not restring-flag a racket strung today even with many old sessions", () => {
      const oldSessions = Array.from({ length: 30 }, (_, i) =>
        `2023-0${(i % 9) + 1}-01`
      );
      const stringing = makeStringing(new Date().toISOString().split("T")[0]);
      expect(needsRestring(makeSessions(oldSessions), stringing)).toBe(false);
    });
  });
});
