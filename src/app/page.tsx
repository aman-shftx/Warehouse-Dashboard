import { Suspense } from "react";
import { getWarehouseIntelligence } from "@/lib/analytics";
import { ExecutiveOverviewDashboard } from "@/components/dashboard/ExecutiveOverviewDashboard";

export const revalidate = 60;

export default async function OverviewPage() {
  const intelligenceData = await getWarehouseIntelligence();

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Warehouse Intelligence...</div>}>
      <ExecutiveOverviewDashboard data={intelligenceData} />
    </Suspense>
  );
}
