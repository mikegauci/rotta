import { codePageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";
import { BusinessDashboard } from "@/components/directory/business-dashboard";
import { BusinessForm } from "@/components/directory/business-form";
import { DeleteListing } from "@/components/directory/delete-listing";
import { Container } from "@/components/layout/container";
import { signOut } from "@/lib/auth/actions";
import { requireRole } from "@/lib/auth/session";
import {
  EMPTY_BUSINESS,
  getListingForForm,
  getTermGroups,
} from "@/lib/business-form-data";
import { deleteMyListing, saveMyListing } from "./actions";

export function generateMetadata() {
  return codePageMetadata("my-business", "My Business", { noindex: true });
}

// Reads the session on every request, so skip instant-navigation validation.
export const instant = false;

export default function MyBusinessPage({
  searchParams,
}: PageProps<"/my-business">) {
  return (
    <Suspense
      fallback={<section className="min-h-[600px] bg-[#131a1d] pt-[180px]" />}
    >
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({
  searchParams,
}: Pick<PageProps<"/my-business">, "searchParams">) {
  const query = await searchParams;
  const edit = query.edit === "1";
  const user = await requireRole(
    ["business_owner", "admin"],
    edit ? "/my-business/?edit=1" : "/my-business/",
  );
  const listing = await getListingForForm({ ownerId: user.id });

  if (listing && !edit) {
    return <BusinessDashboard listing={listing} saved={query.saved === "1"} />;
  }

  const terms = await getTermGroups();

  return (
    <>
      <section className="bg-[#131a1d] pt-[140px] pb-10 text-white">
        <Container className="flex max-w-[1040px] flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[30px] leading-tight font-black sm:text-[40px]">
              {listing ? "Edit your business" : "Add your business"}
            </h1>
            <p className="mt-2 text-white/75">
              {listing
                ? listing.value.name
                : "Get discovered in Malta’s automotive directory."}
            </p>
            {listing && listing.status === "published" && (
              <Link
                href={`/directory/${listing.slug}/`}
                className="text-brand mt-2 inline-block font-semibold hover:underline"
              >
                View live listing ↗
              </Link>
            )}
            {listing && (
              <Link
                href="/my-business/"
                className="text-brand mt-3 block font-semibold hover:underline"
              >
                Back to My Business
              </Link>
            )}
            {listing && listing.status === "draft" && (
              <p className="text-brand mt-2">
                Your listing is hidden from the directory at the moment. Please
                contact us if you think this is a mistake.
              </p>
            )}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="bg-brand hover:text-brand rounded-[5px] px-5 py-2.5 font-bold text-black hover:bg-black"
            >
              Log out
            </button>
          </form>
        </Container>
      </section>
      <section className="bg-black/3 py-8 sm:py-10">
        <Container className="max-w-[1040px]">
          {query.deleted === "1" && !listing && (
            <p
              role="status"
              className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
            >
              Your listing has been deleted. You can create a new one below
              whenever you’re ready.
            </p>
          )}
          {!listing && (
            <p className="text-muted mb-6 text-sm">
              Fill in your details below. Your listing goes live in the
              directory as soon as you submit.
            </p>
          )}
          <BusinessForm
            initial={listing?.value ?? EMPTY_BUSINESS}
            terms={terms}
            logoOwner={user.id}
            onSave={saveMyListing.bind(null, listing?.id ?? null)}
            submitLabel={listing ? "Save changes" : "Publish listing"}
            successHref="/my-business/?saved=1"
          />
          {listing && (
            <DeleteListing
              name={listing.value.name}
              onDelete={deleteMyListing.bind(null, listing.id)}
            />
          )}
        </Container>
      </section>
    </>
  );
}
