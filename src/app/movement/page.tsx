import { Suspense } from "react";
import { getInventoryMovement } from "@/lib/movement";
import { MovementDashboard } from "@/components/dashboard/MovementDashboard";

export const revalidate = 60; // Cache for 60 seconds

export default async function MovementPage() {
  const movementData = await getInventoryMovement(1);

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Movement Trackers...</div>}>
      <MovementDashboard initialData={movementData} />
    </Suspense>
  );
}
