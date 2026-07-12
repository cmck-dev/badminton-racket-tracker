import { Suspense } from "react";
import { getStringings, getRackets, getActivePlayerId } from "@/lib/actions";
import { StringingClient } from "./client";

async function StringingContent() {
  const playerId = await getActivePlayerId();
  const [stringings, rackets] = await Promise.all([
    getStringings(undefined, playerId ?? undefined),
    getRackets(false, playerId ?? undefined),
  ]);
  return <StringingClient initialStringings={stringings} rackets={rackets} />;
}

export default function StringingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <StringingContent />
    </Suspense>
  );
}
