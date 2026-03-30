"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type CurrencyCode, formatCurrency as fmt } from "@/lib/currency";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  fmt: (amount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  setCurrency: () => {},
  fmt: (n) => `$${n.toFixed(0)}`,
});

const LS_KEY = "shuttletrack_currency";

export function CurrencyProvider({
  defaultCurrency,
  children,
}: {
  defaultCurrency: CurrencyCode;
  children: ReactNode;
}) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(defaultCurrency);

  // On mount, prefer localStorage override over the server default
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY) as CurrencyCode | null;
    if (stored && ["USD", "INR", "EUR"].includes(stored)) {
      setCurrencyState(stored);
    }
  }, []);

  // When profile default changes (e.g. user just saved profile), sync if no
  // localStorage override was previously set by the runtime switcher
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) {
      setCurrencyState(defaultCurrency);
    }
  }, [defaultCurrency]);

  function setCurrency(c: CurrencyCode) {
    setCurrencyState(c);
    localStorage.setItem(LS_KEY, c);
  }

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, fmt: (n) => fmt(n, currency) }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
