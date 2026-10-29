import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin/page-header";
import { VehicleEditor } from "@/components/admin/vehicle-editor";
import { getEditorVehicle } from "../vehicle-data";

export const metadata: Metadata = { title: "Edit vehicle" };

// Reads the session on every request.
export const instant = false;

export default async function EditVehiclePage({
  params,
}: PageProps<"/admin/marketplace/[id]">) {
  const { id } = await params;
  await connection();
  const vehicle = await getEditorVehicle(id);
  if (!vehicle) notFound();
  return (
    <>
      <AdminPageHeader
        title="Edit vehicle"
        actions={
          <Link href="/admin/marketplace/" className="text-sm hover:underline">
            ← All vehicles
          </Link>
        }
      />
      <VehicleEditor key={vehicle.id} initial={vehicle} />
    </>
  );
}
