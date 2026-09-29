import { Suspense } from "react";
import { getWarehouseIntelligence } from "@/lib/analytics";
import { AlertsClientDashboard } from "@/components/dashboard/AlertsClientDashboard";

export const revalidate = 60;

export default async function AlertsPage() {
  const { items } = await getWarehouseIntelligence();

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Alerts & Reorder Schedule...</div>}>
      <AlertsClientDashboard items={items} />
    </Suspense>
  );
}
