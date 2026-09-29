import { Suspense } from "react";
import { getWarehouseIntelligence } from "@/lib/analytics";
import { AnalyticsClientDashboard } from "@/components/dashboard/AnalyticsClientDashboard";
import { OverviewSkeleton } from "@/components/dashboard/OverviewSkeleton";

export const revalidate = 60;

async function AnalyticsDataStreamer() {
  const data = await getWarehouseIntelligence();
  return <AnalyticsClientDashboard data={data} />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <AnalyticsDataStreamer />
    </Suspense>
  );
}
