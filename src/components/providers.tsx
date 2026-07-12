"use client";

import { SessionProvider } from "next-auth/react";
import { CurrencyProvider } from "@/contexts/currency-context";
import { PlayerProvider } from "@/contexts/player-context";
import type { CurrencyCode } from "@/lib/currency";

export function Providers({
  children,
  defaultCurrency = "USD",
  players = [],
}: {
  children: React.ReactNode;
  defaultCurrency?: CurrencyCode;
  players?: { id: string; name: string; avatarColor: string }[];
}) {
  return (
    <SessionProvider>
      <CurrencyProvider defaultCurrency={defaultCurrency}>
        <PlayerProvider initialPlayers={players}>
          {children}
        </PlayerProvider>
      </CurrencyProvider>
    </SessionProvider>
  );
}
