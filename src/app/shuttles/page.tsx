import { Suspense } from "react";
import { getShuttles, getActivePlayerId } from "@/lib/actions";
import { ShuttlesClient } from "./client";

async function ShuttlesContent() {
  const playerId = await getActivePlayerId();
  const shuttles = await getShuttles(playerId ?? undefined);
  return <ShuttlesClient initialShuttles={shuttles} />;
}

export default function ShuttlesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <ShuttlesContent />
    </Suspense>
  );
}
