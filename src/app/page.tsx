import { getInventoryMovement } from "@/lib/movement";
import { OverviewMovementDashboard } from "@/components/dashboard/OverviewMovementDashboard";

export const revalidate = 60; // Cache for 60 seconds

export default async function OverviewPage() {
  const movementData = await getInventoryMovement(1);

  return <OverviewMovementDashboard initialData={movementData} />;
}
