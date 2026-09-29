import { Suspense } from "react";
import { getWarehouseIntelligence } from "@/lib/analytics";
import { AnalyticsClientDashboard } from "@/components/dashboard/AnalyticsClientDashboard";

export const revalidate = 60;

export default async function AnalyticsPage() {
  const data = await getWarehouseIntelligence();

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Run-Rate & Velocity Analytics...</div>}>
      <AnalyticsClientDashboard data={data} />
    </Suspense>
  );
}
