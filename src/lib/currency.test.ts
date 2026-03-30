import { describe, it, expect } from "vitest";
import {
  convertFromUSD,
  formatCurrency,
  CURRENCIES,
} from "@/lib/currency";

// ─── convertFromUSD ──────────────────────────────────────────────

describe("convertFromUSD", () => {
  // Standard cases
  describe("standard conversions", () => {
    it("returns the same amount for USD", () => {
      expect(convertFromUSD(100, "USD")).toBe(100);
    });

    it("converts USD to INR using rate 83.5", () => {
      expect(convertFromUSD(1, "INR")).toBe(83.5);
    });

    it("converts USD to EUR using rate 0.92", () => {
      expect(convertFromUSD(1, "EUR")).toBeCloseTo(0.92);
    });

    it("converts a realistic racket price to INR", () => {
      // $150 racket → ₹12,525
      expect(convertFromUSD(150, "INR")).toBe(12525);
    });

    it("converts a realistic stringing cost to EUR", () => {
      // $15 stringing → €13.80
      expect(convertFromUSD(15, "EUR")).toBeCloseTo(13.8);
    });
  });

  // Edge cases
  describe("edge cases", () => {
    it("returns 0 for a zero amount in all currencies", () => {
      expect(convertFromUSD(0, "USD")).toBe(0);
      expect(convertFromUSD(0, "INR")).toBe(0);
      expect(convertFromUSD(0, "EUR")).toBe(0);
    });

    it("handles very small fractional amounts (cents)", () => {
      expect(convertFromUSD(0.01, "USD")).toBeCloseTo(0.01);
      expect(convertFromUSD(0.01, "INR")).toBeCloseTo(0.835);
    });

    it("handles a very large investment amount", () => {
      // $10,000 total → ₹835,000
      expect(convertFromUSD(10000, "INR")).toBe(835000);
    });

    it("converts decimal USD amounts accurately", () => {
      expect(convertFromUSD(9.99, "USD")).toBeCloseTo(9.99);
      expect(convertFromUSD(9.99, "EUR")).toBeCloseTo(9.1908);
    });
  });

  // Negative cases
  describe("negative / unusual inputs", () => {
    it("handles negative amounts (e.g. refunds)", () => {
      expect(convertFromUSD(-10, "INR")).toBe(-835);
    });

    it("handles NaN input without crashing", () => {
      // NaN × rate = NaN — callers should validate before displaying
      expect(isNaN(convertFromUSD(NaN, "USD"))).toBe(true);
    });

    it("handles Infinity input", () => {
      expect(convertFromUSD(Infinity, "INR")).toBe(Infinity);
    });
  });
});

// ─── formatCurrency ──────────────────────────────────────────────

describe("formatCurrency", () => {
  // Standard cases
  describe("USD formatting", () => {
    it("formats whole USD amounts without decimals", () => {
      expect(formatCurrency(100, "USD")).toBe("$100");
    });

    it("formats small USD amounts with 2 decimal places", () => {
      // values < 10 get 2 decimals
      expect(formatCurrency(9.5, "USD")).toBe("$9.50");
    });

    it("formats zero as $0.00 (zero is < 10, uses 2 decimals)", () => {
      expect(formatCurrency(0, "USD")).toBe("$0.00");
    });

    it("formats large USD amounts without decimals", () => {
      expect(formatCurrency(1250, "USD")).toBe("$1250");
    });
  });

  describe("INR formatting", () => {
    it("uses ₹ symbol for INR", () => {
      expect(formatCurrency(1, "INR")).toMatch(/^₹/);
    });

    it("formats 1 USD as ₹84 (rounded)", () => {
      expect(formatCurrency(1, "INR")).toBe("₹84");
    });

    it("formats 100 USD to ₹8,350 with Indian comma notation", () => {
      expect(formatCurrency(100, "INR")).toBe("₹8,350");
    });

    it("formats large amounts with Indian numbering (lakhs)", () => {
      // $1000 → ₹83,500
      expect(formatCurrency(1000, "INR")).toBe("₹83,500");
    });

    it("formats zero INR as ₹0", () => {
      expect(formatCurrency(0, "INR")).toBe("₹0");
    });
  });

  describe("EUR formatting", () => {
    it("uses € symbol for EUR", () => {
      expect(formatCurrency(1, "EUR")).toMatch(/^€/);
    });

    it("formats small EUR amounts with 2 decimals", () => {
      // $1 → €0.92 (< 10, so 2 decimals)
      expect(formatCurrency(1, "EUR")).toBe("€0.92");
    });

    it("formats 50 USD to €46", () => {
      // 50 × 0.92 = 46 (≥ 10, so no decimals)
      expect(formatCurrency(50, "EUR")).toBe("€46");
    });

    it("formats zero EUR as €0.00 (zero is < 10, uses 2 decimals)", () => {
      expect(formatCurrency(0, "EUR")).toBe("€0.00");
    });
  });

  // Edge cases
  describe("edge cases", () => {
    it("handles fractional cent amounts gracefully", () => {
      // Should not throw; result will be rounded per display logic
      expect(() => formatCurrency(0.001, "USD")).not.toThrow();
    });

    it("formats the same amount consistently on repeated calls", () => {
      const result1 = formatCurrency(250, "INR");
      const result2 = formatCurrency(250, "INR");
      expect(result1).toBe(result2);
    });

    it("all three currencies produce different strings for the same amount", () => {
      const usd = formatCurrency(100, "USD");
      const inr = formatCurrency(100, "INR");
      const eur = formatCurrency(100, "EUR");
      expect(usd).not.toBe(inr);
      expect(usd).not.toBe(eur);
      expect(inr).not.toBe(eur);
    });
  });

  // Negative cases
  describe("negative / unusual inputs", () => {
    it("formats a negative amount without crashing", () => {
      expect(() => formatCurrency(-50, "USD")).not.toThrow();
      expect(formatCurrency(-50, "USD")).toContain("50");
    });
  });
});

// ─── CURRENCIES constant ────────────────────────────────────────

describe("CURRENCIES constant", () => {
  it("contains exactly 3 currencies", () => {
    expect(CURRENCIES).toHaveLength(3);
  });

  it("includes USD, INR, and EUR codes", () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(codes).toContain("USD");
    expect(codes).toContain("INR");
    expect(codes).toContain("EUR");
  });

  it("each currency has a symbol and label", () => {
    for (const c of CURRENCIES) {
      expect(c.symbol).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.code).toBeTruthy();
    }
  });

  it("USD symbol is $", () => {
    const usd = CURRENCIES.find((c) => c.code === "USD");
    expect(usd?.symbol).toBe("$");
  });

  it("INR symbol is ₹", () => {
    const inr = CURRENCIES.find((c) => c.code === "INR");
    expect(inr?.symbol).toBe("₹");
  });

  it("EUR symbol is €", () => {
    const eur = CURRENCIES.find((c) => c.code === "EUR");
    expect(eur?.symbol).toBe("€");
  });
});
