import { describe, it, expect } from "vitest";

// ─── Pure cost-aggregation helpers ───────────────────────────────
// These mirror exactly the calculations in page.tsx and analytics.

function totalStringingCost(stringings: { cost?: number | null }[]): number {
  return stringings.reduce((sum, s) => sum + (s.cost ?? 0), 0);
}

function totalCourtCost(sessions: { courtCost?: number | null }[]): number {
  return sessions.reduce((sum, s) => sum + (s.courtCost ?? 0), 0);
}

function totalRacketCost(rackets: { purchasePrice?: number | null }[]): number {
  return rackets.reduce((sum, r) => sum + (r.purchasePrice ?? 0), 0);
}

function totalShuttleCost(
  shuttles: { price?: number | null; quantity?: number | null }[]
): number {
  return shuttles.reduce((sum, s) => sum + ((s.price ?? 0) * (s.quantity ?? 1)), 0);
}

function grandTotal(
  rackets: { purchasePrice?: number | null }[],
  stringings: { cost?: number | null }[],
  sessions: { courtCost?: number | null }[],
  shuttles: { price?: number | null; quantity?: number | null }[]
): number {
  return (
    totalRacketCost(rackets) +
    totalStringingCost(stringings) +
    totalCourtCost(sessions) +
    totalShuttleCost(shuttles)
  );
}

function totalHours(sessions: { durationMinutes: number }[]): number {
  return (
    Math.round(
      (sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60) * 10
    ) / 10
  );
}

// ─── totalStringingCost ──────────────────────────────────────────

describe("totalStringingCost", () => {
  describe("standard cases", () => {
    it("sums stringing costs correctly", () => {
      expect(totalStringingCost([{ cost: 15 }, { cost: 20 }, { cost: 12 }])).toBe(47);
    });

    it("returns 0 for an empty list", () => {
      expect(totalStringingCost([])).toBe(0);
    });

    it("handles a single entry", () => {
      expect(totalStringingCost([{ cost: 25 }])).toBe(25);
    });
  });

  describe("edge cases", () => {
    it("treats null cost as 0", () => {
      expect(totalStringingCost([{ cost: null }, { cost: 10 }])).toBe(10);
    });

    it("treats undefined cost as 0", () => {
      expect(totalStringingCost([{ cost: undefined }, { cost: 8 }])).toBe(8);
    });

    it("handles all null costs", () => {
      expect(totalStringingCost([{ cost: null }, { cost: null }])).toBe(0);
    });

    it("handles decimal costs correctly", () => {
      expect(totalStringingCost([{ cost: 14.5 }, { cost: 9.99 }])).toBeCloseTo(24.49);
    });
  });

  describe("negative cases", () => {
    it("handles a negative cost entry (e.g. refund) without crashing", () => {
      expect(totalStringingCost([{ cost: 20 }, { cost: -5 }])).toBe(15);
    });

    it("returns 0 when all entries are zero cost", () => {
      expect(totalStringingCost([{ cost: 0 }, { cost: 0 }])).toBe(0);
    });
  });
});

// ─── totalCourtCost ──────────────────────────────────────────────

describe("totalCourtCost", () => {
  describe("standard cases", () => {
    it("sums court costs across sessions", () => {
      expect(totalCourtCost([{ courtCost: 10 }, { courtCost: 12 }, { courtCost: 8 }])).toBe(30);
    });

    it("returns 0 for an empty session list", () => {
      expect(totalCourtCost([])).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("treats null courtCost as 0", () => {
      expect(totalCourtCost([{ courtCost: null }, { courtCost: 10 }])).toBe(10);
    });

    it("treats undefined courtCost as 0", () => {
      expect(totalCourtCost([{ courtCost: undefined }, { courtCost: 5 }])).toBe(5);
    });

    it("handles a mix of paid and free court sessions", () => {
      expect(
        totalCourtCost([{ courtCost: 15 }, { courtCost: null }, { courtCost: 10 }])
      ).toBe(25);
    });
  });

  describe("negative cases", () => {
    it("handles zero court cost sessions", () => {
      expect(totalCourtCost([{ courtCost: 0 }, { courtCost: 0 }])).toBe(0);
    });
  });
});

// ─── totalRacketCost ─────────────────────────────────────────────

describe("totalRacketCost", () => {
  describe("standard cases", () => {
    it("sums racket purchase prices", () => {
      expect(
        totalRacketCost([{ purchasePrice: 150 }, { purchasePrice: 200 }, { purchasePrice: 80 }])
      ).toBe(430);
    });

    it("returns 0 for no rackets", () => {
      expect(totalRacketCost([])).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("treats null purchasePrice as 0 (price not recorded)", () => {
      expect(totalRacketCost([{ purchasePrice: null }, { purchasePrice: 150 }])).toBe(150);
    });

    it("handles a fleet of rackets all without prices", () => {
      expect(
        totalRacketCost([{ purchasePrice: null }, { purchasePrice: null }])
      ).toBe(0);
    });

    it("handles a single expensive racket", () => {
      expect(totalRacketCost([{ purchasePrice: 350 }])).toBe(350);
    });
  });

  describe("negative cases", () => {
    it("handles zero purchase price (gifted racket)", () => {
      expect(totalRacketCost([{ purchasePrice: 0 }, { purchasePrice: 100 }])).toBe(100);
    });
  });
});

// ─── totalShuttleCost ────────────────────────────────────────────

describe("totalShuttleCost", () => {
  describe("standard cases", () => {
    it("multiplies price × quantity and sums across entries", () => {
      // 2 tubes × $25 + 3 tubes × $20 = $110
      expect(
        totalShuttleCost([{ price: 25, quantity: 2 }, { price: 20, quantity: 3 }])
      ).toBe(110);
    });

    it("returns 0 for an empty shuttle list", () => {
      expect(totalShuttleCost([])).toBe(0);
    });

    it("treats missing quantity as 1 (single unit)", () => {
      expect(totalShuttleCost([{ price: 30, quantity: null }])).toBe(30);
    });

    it("treats missing price as 0", () => {
      expect(totalShuttleCost([{ price: null, quantity: 5 }])).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("handles a large bulk purchase", () => {
      // 100 tubes × $18
      expect(totalShuttleCost([{ price: 18, quantity: 100 }])).toBe(1800);
    });

    it("handles all null prices and quantities", () => {
      expect(
        totalShuttleCost([
          { price: null, quantity: null },
          { price: null, quantity: null },
        ])
      ).toBe(0);
    });

    it("handles a mix of entries with and without prices", () => {
      expect(
        totalShuttleCost([
          { price: 20, quantity: 2 },   // 40
          { price: null, quantity: 5 },  // 0
          { price: 25, quantity: 1 },   // 25
        ])
      ).toBe(65);
    });

    it("handles fractional prices (e.g. $19.99 per tube)", () => {
      expect(totalShuttleCost([{ price: 19.99, quantity: 2 }])).toBeCloseTo(39.98);
    });
  });

  describe("negative cases", () => {
    it("handles zero quantity", () => {
      expect(totalShuttleCost([{ price: 25, quantity: 0 }])).toBe(0);
    });

    it("handles zero price", () => {
      expect(totalShuttleCost([{ price: 0, quantity: 5 }])).toBe(0);
    });
  });
});

// ─── grandTotal ──────────────────────────────────────────────────

describe("grandTotal", () => {
  describe("standard cases", () => {
    it("sums all four cost categories", () => {
      const rackets   = [{ purchasePrice: 150 }];
      const stringings = [{ cost: 20 }];
      const sessions  = [{ courtCost: 10 }];
      const shuttles  = [{ price: 25, quantity: 2 }];
      // 150 + 20 + 10 + 50 = 230
      expect(grandTotal(rackets, stringings, sessions, shuttles)).toBe(230);
    });

    it("returns 0 when everything is empty", () => {
      expect(grandTotal([], [], [], [])).toBe(0);
    });

    it("returns just racket cost when other categories are empty", () => {
      expect(grandTotal([{ purchasePrice: 200 }], [], [], [])).toBe(200);
    });
  });

  describe("edge cases", () => {
    it("handles all-null optional fields across every category", () => {
      expect(
        grandTotal(
          [{ purchasePrice: null }],
          [{ cost: null }],
          [{ courtCost: null }],
          [{ price: null, quantity: null }]
        )
      ).toBe(0);
    });

    it("calculates a realistic total investment correctly", () => {
      // 2 rackets, 4 stringings, 12 sessions, 3 shuttle purchases
      const rackets    = [{ purchasePrice: 150 }, { purchasePrice: 200 }];
      const stringings = [{ cost: 18 }, { cost: 20 }, { cost: 18 }, { cost: 22 }];
      const sessions   = Array.from({ length: 12 }, () => ({ courtCost: 8 }));
      const shuttles   = [
        { price: 25, quantity: 2 },
        { price: 20, quantity: 3 },
        { price: 22, quantity: 2 },
      ];
      // 350 + 78 + 96 + (50 + 60 + 44) = 350 + 78 + 96 + 154 = 678
      expect(grandTotal(rackets, stringings, sessions, shuttles)).toBe(678);
    });
  });
});

// ─── totalHours ──────────────────────────────────────────────────

describe("totalHours", () => {
  describe("standard cases", () => {
    it("converts minutes to hours and rounds to 1 decimal place", () => {
      // 90 + 90 = 180 min = 3.0 h
      expect(totalHours([{ durationMinutes: 90 }, { durationMinutes: 90 }])).toBe(3);
    });

    it("returns 0 for no sessions", () => {
      expect(totalHours([])).toBe(0);
    });

    it("rounds 1 decimal place correctly", () => {
      // 95 min = 1.5833... h → 1.6h
      expect(totalHours([{ durationMinutes: 95 }])).toBe(1.6);
    });

    it("handles a typical mixed session list", () => {
      // 60 + 90 + 45 = 195 min = 3.25 → 3.3h
      expect(
        totalHours([
          { durationMinutes: 60 },
          { durationMinutes: 90 },
          { durationMinutes: 45 },
        ])
      ).toBe(3.3);
    });
  });

  describe("edge cases", () => {
    it("handles a very long session (480 min = 8 h)", () => {
      expect(totalHours([{ durationMinutes: 480 }])).toBe(8);
    });

    it("handles a very short session (5 min)", () => {
      expect(totalHours([{ durationMinutes: 5 }])).toBeCloseTo(0.1);
    });

    it("handles many sessions accurately", () => {
      // 100 sessions × 60 min = 100 h
      const sessions = Array.from({ length: 100 }, () => ({ durationMinutes: 60 }));
      expect(totalHours(sessions)).toBe(100);
    });
  });

  describe("negative cases", () => {
    it("handles 0-minute sessions without crashing", () => {
      expect(totalHours([{ durationMinutes: 0 }])).toBe(0);
    });
  });
});
