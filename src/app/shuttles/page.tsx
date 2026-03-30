import { Suspense } from "react";
import { getShuttles } from "@/lib/actions";
import { ShuttlesClient } from "./client";

async function ShuttlesContent() {
  const shuttles = await getShuttles();
  return <ShuttlesClient initialShuttles={shuttles} />;
}

export default function ShuttlesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <ShuttlesContent />
    </Suspense>
  );
}
