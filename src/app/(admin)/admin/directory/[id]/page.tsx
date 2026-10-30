import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingEditor } from "@/components/admin/listing-editor";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getListingForForm, getTermGroups } from "@/lib/business-form-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({
  params,
}: PageProps<"/admin/directory/[id]">) {
  const { id } = await params;
  const [listing, terms] = await Promise.all([
    getListingForForm({ id }),
    getTermGroups(),
  ]);
  if (!listing) notFound();
  let ownerEmail = "";
  if (listing.ownerId) {
    const db = await createClient();
    const { data, error } = await db.rpc("admin_directory_owner_email", {
      listing_id: listing.id,
    });
    if (error) throw error;
    ownerEmail = data ?? "";
  }
  return (
    <>
      <AdminPageHeader
        title={listing.value.name}
        actions={
          <Link href="/admin/directory/" className="text-sm hover:underline">
            ← All listings
          </Link>
        }
      />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <ListingEditor
          key={listing.id}
          id={listing.id}
          initial={listing.value}
          meta={{ slug: listing.slug, status: listing.status, ownerEmail }}
          terms={terms}
        />
      </div>
    </>
  );
}
