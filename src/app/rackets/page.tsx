import { Suspense } from "react";
import { getRackets } from "@/lib/actions";
import { RacketsClient } from "./client";

async function RacketsContent() {
  const rackets = await getRackets(true);
  return <RacketsClient initialRackets={rackets} />;
}

export default function RacketsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <RacketsContent />
    </Suspense>
  );
}
