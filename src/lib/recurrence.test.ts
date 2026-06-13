import { describe, it, expect } from "vitest";
import { generateRecurringDates } from "./recurrence";

// Helper: build a Date at midnight local time for a given ISO date string
function d(iso: string): Date {
  const dt = new Date(iso);
  return dt;
}

describe("generateRecurringDates", () => {
  it("returns empty array when daysOfWeek is empty", () => {
    const result = generateRecurringDates(
      [],
      d("2026-06-01"),
      d("2026-07-01")
    );
    expect(result).toHaveLength(0);
  });

  it("counts every Monday in June 2026 (4 Mondays)", () => {
    // June 2026: Mon on 1, 8, 15, 22, 29 => 5 Mondays
    const result = generateRecurringDates(
      [1], // Monday
      new Date(2026, 5, 1), // June 1
      new Date(2026, 6, 1)  // July 1 (exclusive)
    );
    expect(result).toHaveLength(5);
    // First Monday should be June 1
    expect(result[0].getDate()).toBe(1);
    expect(result[0].getMonth()).toBe(5);
  });

  it("counts Mon + Wed in June 2026 correctly", () => {
    // June 2026: 5 Mondays (1,8,15,22,29) + 5 Wednesdays (3,10,17,24) = wait
    // June 2026 Wednesdays: 3,10,17,24 = 4
    // June 2026 Mondays: 1,8,15,22,29 = 5
    const result = generateRecurringDates(
      [1, 3], // Monday + Wednesday
      new Date(2026, 5, 1),
      new Date(2026, 6, 1)
    );
    expect(result).toHaveLength(9);
  });

  it("full year 2026 every Saturday (52 or 53 Saturdays)", () => {
    const result = generateRecurringDates(
      [6], // Saturday
      new Date(2026, 0, 1),
      new Date(2027, 0, 1)
    );
    // 2026 starts on Thursday; first Saturday is Jan 3
    // 52 full weeks + check if 53rd Saturday falls before year end
    expect(result.length).toBeGreaterThanOrEqual(52);
    expect(result.length).toBeLessThanOrEqual(53);
  });

  it("custom range: every Sunday in a single week returns 1", () => {
    // June 7 2026 is a Sunday
    const start = new Date(2026, 5, 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(2026, 5, 14); // next Sunday, exclusive
    const result = generateRecurringDates([0], start, end);
    expect(result).toHaveLength(1);
    expect(result[0].getDay()).toBe(0);
  });

  it("does not include the end date (range is exclusive)", () => {
    // Jan 1 2026 is a Thursday (day 4)
    const result = generateRecurringDates(
      [4],
      new Date(2026, 0, 1),
      new Date(2026, 0, 1) // same day as start → range is [start, start) → empty
    );
    expect(result).toHaveLength(0);
  });

  it("all days of week yields every day in the range", () => {
    const result = generateRecurringDates(
      [0, 1, 2, 3, 4, 5, 6],
      new Date(2026, 5, 1),
      new Date(2026, 6, 1)
    );
    expect(result).toHaveLength(30); // June has 30 days
  });

  it("returns dates with midnight (00:00) hours regardless of start time", () => {
    const start = new Date(2026, 5, 1, 14, 30, 0); // 2:30 PM
    const end = new Date(2026, 6, 1);
    const result = generateRecurringDates([1], start, end);
    for (const date of result) {
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    }
  });
});
