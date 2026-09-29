import { Suspense } from "react";
import { getInventoryMovement } from "@/lib/movement";
import { MovementDashboard } from "@/components/dashboard/MovementDashboard";
import { MovementSkeleton } from "@/components/dashboard/MovementSkeleton";

export const revalidate = 60; // Cache for 60 seconds

async function MovementDataStreamer() {
  const movementData = await getInventoryMovement(1);
  return <MovementDashboard initialData={movementData} />;
}

export default function MovementPage() {
  return (
    <Suspense fallback={<MovementSkeleton />}>
      <MovementDataStreamer />
    </Suspense>
  );
}
