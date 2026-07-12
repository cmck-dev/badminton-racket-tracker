import { Suspense } from "react";
import { getPlayers } from "@/lib/actions";
import { ReassignClient } from "./client";

async function ReassignContent() {
  const players = await getPlayers();
  return <ReassignClient players={players} />;
}

export default function ReassignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <ReassignContent />
    </Suspense>
  );
}
