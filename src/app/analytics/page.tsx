import { getAnalyticsData } from "@/lib/actions";
import { AnalyticsClient } from "./client";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return <AnalyticsClient data={data} />;
}
