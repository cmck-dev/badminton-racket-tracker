import { Suspense } from "react";
import { getSessions, getRackets, getLastSession } from "@/lib/actions";
import { SessionsClient } from "./client";

async function SessionsContent() {
  const [sessions, rackets, lastSession] = await Promise.all([
    getSessions(),
    getRackets(),
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
