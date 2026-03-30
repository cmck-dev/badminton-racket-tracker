"use client";

import { useCurrency } from "@/contexts/currency-context";

export function CurrencyAmount({ amount }: { amount: number }) {
  const { fmt } = useCurrency();
  return <>{fmt(amount)}</>;
}
