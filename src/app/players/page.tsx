import { Suspense } from "react";
import { getPlayers } from "@/lib/actions";
import { PlayersClient } from "./client";

async function PlayersContent() {
  const players = await getPlayers();
  return <PlayersClient initialPlayers={players} />;
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <PlayersContent />
    </Suspense>
  );
}
