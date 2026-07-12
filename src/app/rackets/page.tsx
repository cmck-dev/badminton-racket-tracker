import { Suspense } from "react";
import { getRackets, getActivePlayerId } from "@/lib/actions";
import { RacketsClient } from "./client";

async function RacketsContent() {
  const playerId = await getActivePlayerId();
  const rackets = await getRackets(true, playerId ?? undefined);
  return <RacketsClient initialRackets={rackets} />;
}

export default function RacketsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <RacketsContent />
    </Suspense>
  );
}
