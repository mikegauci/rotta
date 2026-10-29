import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { VehicleEditor } from "@/components/admin/vehicle-editor";
import { EMPTY_VEHICLE } from "../vehicle-data";

export const metadata: Metadata = { title: "New vehicle" };

export default function NewVehiclePage() {
  return (
    <>
      <AdminPageHeader
        title="New vehicle"
        actions={
          <Link href="/admin/marketplace/" className="text-sm hover:underline">
            ← All vehicles
          </Link>
        }
      />
      <VehicleEditor initial={EMPTY_VEHICLE} />
    </>
  );
}
