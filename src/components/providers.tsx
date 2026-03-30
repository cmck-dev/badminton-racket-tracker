"use client";

import { SessionProvider } from "next-auth/react";
import { CurrencyProvider } from "@/contexts/currency-context";
import type { CurrencyCode } from "@/lib/currency";

export function Providers({
  children,
  defaultCurrency = "USD",
}: {
  children: React.ReactNode;
  defaultCurrency?: CurrencyCode;
}) {
  return (
    <SessionProvider>
      <CurrencyProvider defaultCurrency={defaultCurrency}>
        {children}
      </CurrencyProvider>
    </SessionProvider>
  );
}
