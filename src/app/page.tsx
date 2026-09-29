import { Suspense } from "react";
import { getWarehouseIntelligence } from "@/lib/analytics";
import { ExecutiveOverviewDashboard } from "@/components/dashboard/ExecutiveOverviewDashboard";
import { OverviewSkeleton } from "@/components/dashboard/OverviewSkeleton";

export const revalidate = 60;

async function OverviewDataStreamer() {
  const intelligenceData = await getWarehouseIntelligence();
  return <ExecutiveOverviewDashboard data={intelligenceData} />;
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <OverviewDataStreamer />
    </Suspense>
  );
}
