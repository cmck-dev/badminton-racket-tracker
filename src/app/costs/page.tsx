import { Suspense } from "react";
import { getRecurringCosts, getPlayers, getActivePlayerId } from "@/lib/actions";
import { CostsClient } from "./client";

async function CostsContent() {
  const activePlayerId = await getActivePlayerId();
  const [costs, players] = await Promise.all([
    getRecurringCosts(activePlayerId),
    getPlayers().catch(() => []),
  ]);
  return <CostsClient initialCosts={costs} players={players} initialPlayerId={activePlayerId} />;
}

export default function CostsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <CostsContent />
    </Suspense>
  );
}
