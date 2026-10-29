import type { Metadata } from "next";
import { ListingEditor } from "@/components/admin/listing-editor";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EMPTY_BUSINESS, getTermGroups } from "@/lib/business-form-data";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  const terms = await getTermGroups();
  return (
    <>
      <AdminPageHeader title="New listing" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <ListingEditor
          id={null}
          initial={EMPTY_BUSINESS}
          meta={{ slug: "", status: "published", ownerEmail: "" }}
          terms={terms}
        />
      </div>
    </>
  );
}
