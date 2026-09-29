import { Suspense } from "react";
import { getWarehouseIntelligence } from "@/lib/analytics";
import { AlertsClientDashboard } from "@/components/dashboard/AlertsClientDashboard";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

export const revalidate = 60;

async function AlertsDataStreamer() {
  const { items } = await getWarehouseIntelligence();
  return <AlertsClientDashboard items={items} />;
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<TableSkeleton title="Loading Alerts & Reorder Schedule..." />}>
      <AlertsDataStreamer />
    </Suspense>
  );
}
