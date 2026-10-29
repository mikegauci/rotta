import type { Metadata } from "next";
import Link from "next/link";
import { FilterLists, type AdminTerm } from "@/components/admin/filter-lists";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Directory filters" };

export default async function FiltersPage() {
  const db = await createClient();
  const { data, error } = await db
    .from("directory_terms")
    .select(
      "id, kind, label, sort_order, icon:media(id, path, width, height, alt), business_terms(count)",
    )
    .order("sort_order");

  const terms: AdminTerm[] = (data ?? []).map((t) => ({
    id: t.id,
    kind: t.kind,
    label: t.label,
    sortOrder: t.sort_order,
    icon: t.icon,
    uses: t.business_terms[0]?.count ?? 0,
  }));

  return (
    <>
      <AdminPageHeader
        title="Directory filters"
        description="The options in the step-by-step search and on the My Business form. Order sets the Browse by Category carousel; the filter lists services A–Z."
        actions={
          <Link href="/admin/directory/" className="text-sm hover:underline">
            ← All listings
          </Link>
        }
      />
      {error && (
        <p className="text-coral">Could not load filters: {error.message}</p>
      )}
      <FilterLists terms={terms} />
    </>
  );
}
