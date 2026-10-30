import { codePageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";
import { BusinessDashboard } from "@/components/directory/business-dashboard";
import { BusinessForm } from "@/components/directory/business-form";
import { Container } from "@/components/layout/container";
import { signOut } from "@/lib/auth/actions";
import { requireRole } from "@/lib/auth/session";
import {
  EMPTY_BUSINESS,
  getListingForForm,
  getTermGroups,
} from "@/lib/business-form-data";
import { saveMyListing } from "./actions";

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
  const edit = (await searchParams).edit === "1";
  const user = await requireRole(
    ["business_owner", "admin"],
    edit ? "/my-business/?edit=1" : "/my-business/",
  );
  const listing = await getListingForForm({ ownerId: user.id });

  if (listing && !edit) {
    return <BusinessDashboard listing={listing} />;
  }

  const terms = await getTermGroups();

  return (
    <>
      <section className="bg-[#131a1d] pt-[180px] pb-[60px] text-white">
        <Container className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-black">My Business</h1>
            <p className="mt-2">
              Signed in as {user.fullName ?? user.username ?? user.email}.
            </p>
            {listing && listing.status === "published" && (
              <Link
                href={`/directory/${listing.slug}/`}
                className="text-brand mt-2 inline-block font-semibold hover:underline"
              >
                View your listing
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
      <section className="bg-white py-[50px]">
        <Container className="max-w-[1000px]">
          <h2 className="mt-0 mb-[25px] text-center text-[40px] leading-none font-medium md:text-[65px]">
            Business Details
          </h2>
          {!listing && (
            <p className="mb-8 text-center">
              Fill in your details below. Your listing goes live in the
              directory as soon as you submit.
            </p>
          )}
          <BusinessForm
            initial={listing?.value ?? EMPTY_BUSINESS}
            terms={terms}
            logoOwner={user.id}
            onSave={saveMyListing}
            submitLabel={listing ? "Update" : "Submit"}
            successHref="/my-business/"
          />
        </Container>
      </section>
    </>
  );
}
