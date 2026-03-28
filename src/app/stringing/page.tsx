import { Suspense } from "react";
import { getStringings, getRackets } from "@/lib/actions";
import { StringingClient } from "./client";

async function StringingContent() {
  const [stringings, rackets] = await Promise.all([
    getStringings(),
    getRackets(),
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
