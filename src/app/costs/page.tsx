import { Suspense } from "react";
import { getRecurringCosts } from "@/lib/actions";
import { CostsClient } from "./client";

async function CostsContent() {
  const costs = await getRecurringCosts();
  return <CostsClient initialCosts={costs} />;
}

export default function CostsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <CostsContent />
    </Suspense>
  );
}
