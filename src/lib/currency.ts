export type CurrencyCode = "USD" | "INR" | "EUR";

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar ($)", symbol: "$" },
  { code: "INR", label: "Indian Rupee (₹)", symbol: "₹" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
];

// Approximate fixed rates relative to USD. Data is entered/stored in USD.
const RATES: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
};

export function convertFromUSD(amountUSD: number, to: CurrencyCode): number {
  return amountUSD * RATES[to];
}

export function formatCurrency(amountUSD: number, currency: CurrencyCode): string {
  const converted = convertFromUSD(amountUSD, currency);
  const info = CURRENCIES.find((c) => c.code === currency)!;
  if (currency === "INR") {
    // Indian numbering: no decimal for whole numbers, use commas
    return `${info.symbol}${Math.round(converted).toLocaleString("en-IN")}`;
  }
  return `${info.symbol}${converted.toFixed(converted < 10 ? 2 : 0)}`;
}
