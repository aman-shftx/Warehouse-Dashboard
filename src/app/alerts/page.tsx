import { Suspense } from "react";
import { getWarehouseIntelligence } from "@/lib/analytics";
import { AlertsClientDashboard } from "@/components/dashboard/AlertsClientDashboard";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: {
    filter?: string;
    from?: string;
  };
}

async function AlertsDataStreamer({ filter, from }: { filter?: string; from?: string }) {
  const { items } = await getWarehouseIntelligence();
  return <AlertsClientDashboard items={items} initialFilter={filter} initialFrom={from} />;
}

export default function AlertsPage({ searchParams }: PageProps) {
  const filter = searchParams?.filter;
  const from = searchParams?.from;

  return (
    <Suspense fallback={<TableSkeleton title="Loading Alerts & Reorder Schedule..." />}>
      <AlertsDataStreamer filter={filter} from={from} />
    </Suspense>
  );
}
