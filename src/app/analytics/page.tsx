import { getAnalyticsData, getActivePlayerId } from "@/lib/actions";
import { AnalyticsClient } from "./client";

export default async function AnalyticsPage() {
  const playerId = await getActivePlayerId();
  const data = await getAnalyticsData(playerId ?? undefined);
  return <AnalyticsClient data={data} />;
}
