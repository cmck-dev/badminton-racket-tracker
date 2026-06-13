export type CurrencyCode = "USD" | "INR" | "EUR";

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar ($)", symbol: "$" },
  { code: "INR", label: "Indian Rupee (₹)", symbol: "₹" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
];

// Kept for potential future use (e.g. displaying cross-currency totals).
const RATES: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
};

export function convertFromUSD(amountUSD: number, to: CurrencyCode): number {
  return amountUSD * RATES[to];
}

// Costs are stored as-entered in the user's profile currency.
// No conversion applied — just format with the correct symbol.
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const info = CURRENCIES.find((c) => c.code === currency)!;
  if (currency === "INR") {
    return `${info.symbol}${Math.round(amount).toLocaleString("en-IN")}`;
  }
  return `${info.symbol}${amount.toFixed(amount < 10 ? 2 : 0)}`;
}
