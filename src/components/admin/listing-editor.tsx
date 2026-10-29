"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adminSaveListing,
  deleteListing,
  type ListingMeta,
} from "@/app/(admin)/admin/directory/actions";
import {
  BusinessForm,
  type BusinessFormValue,
  type TermGroups,
} from "@/components/directory/business-form";

const field =
  "w-full rounded border border-[#ddd] bg-white px-3 py-2 text-sm focus:border-[#999] focus:outline-none";

export function ListingEditor({
  id,
  initial,
  meta: initialMeta,
  terms,
}: {
  id: string | null;
  initial: BusinessFormValue;
  meta: ListingMeta;
  terms: TermGroups;
}) {
  const router = useRouter();
  const [meta, setMeta] = useState(initialMeta);
  const [pending, start] = useTransition();

  return (
    <BusinessForm
      initial={initial}
      terms={terms}
      logoOwner={null}
      submitLabel={id ? "Save" : "Create listing"}
      onSave={async (input) => {
        const result = await adminSaveListing(id, input, meta);
        if ("error" in result) return result;
        setMeta((m) => ({ ...m, slug: result.slug }));
        if (!id) router.replace(`/admin/directory/${result.id}/`);
        else router.refresh();
        return {};
      }}
    >
      <div className="grid gap-4 rounded-lg bg-[#f5f5f5] p-4 md:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Status</span>
          <select
            value={meta.status}
            onChange={(e) =>
              setMeta({
                ...meta,
                status: e.target.value as ListingMeta["status"],
              })
            }
            className={field}
          >
            <option value="published">Published (live)</option>
            <option value="draft">Hidden</option>
          </select>
        </label>
        {id && (
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Web address</span>
            <span className="flex items-center gap-1">
              <span className="text-muted">/directory/</span>
              <input
                value={meta.slug}
                onChange={(e) => setMeta({ ...meta, slug: e.target.value })}
                className={field}
              />
            </span>
          </label>
        )}
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">
            Owner’s account email
          </span>
          <input
            type="email"
            value={meta.ownerEmail}
            onChange={(e) => setMeta({ ...meta, ownerEmail: e.target.value })}
            placeholder="No owner"
            className={field}
          />
        </label>
        {id && (
          <div className="flex items-center gap-4 text-sm md:col-span-3">
            {initialMeta.status === "published" && (
              <Link
                href={`/directory/${initialMeta.slug}/`}
                target="_blank"
                className="font-semibold hover:underline"
              >
                View listing
              </Link>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (
                  !window.confirm("Delete this listing? This can’t be undone.")
                )
                  return;
                start(async () => {
                  const result = await deleteListing(id);
                  if ("error" in result) window.alert(result.error);
                  else router.push("/admin/directory/");
                });
              }}
              className="text-coral hover:underline"
            >
              Delete listing
            </button>
          </div>
        )}
      </div>
    </BusinessForm>
  );
}
