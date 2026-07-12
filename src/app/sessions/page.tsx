import { Suspense } from "react";
import { getSessions, getRackets, getLastSession, getActivePlayerId } from "@/lib/actions";
import { SessionsClient } from "./client";

async function SessionsContent() {
  const playerId = await getActivePlayerId();
  const [sessions, rackets, lastSession] = await Promise.all([
    getSessions(undefined, playerId ?? undefined),
    getRackets(false, playerId ?? undefined),
    getLastSession(),
  ]);
  return (
    <SessionsClient
      initialSessions={sessions}
      rackets={rackets}
      lastSession={lastSession}
    />
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <SessionsContent />
    </Suspense>
  );
}
