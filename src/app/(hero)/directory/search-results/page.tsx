import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DirectoryHero } from "@/components/directory/directory-hero";
import { ListingCard } from "@/components/directory/listing-card";
import { ListingCta } from "@/components/directory/listing-cta";
import { Promos } from "@/components/directory/promos";
import { ResultsSidebar } from "@/components/directory/results-sidebar";
import { GetInTouch } from "@/components/get-in-touch";
import { NewsletterSignup } from "@/components/newsletter-signup";
import {
  RESULTS_PAGE_SIZE,
  STEP_PARAMS,
  getDirectory,
  readFilters,
  searchListings,
  termsByKind,
  type TermKind,
} from "@/lib/directory";

export const metadata: Metadata = { title: "Search Results" };

const GROUP_TITLES: Record<TermKind, string> = {
  vehicle: "Vehicles",
  era: "Era",
  service: "Services",
  region: "Region",
};

type Params = Record<string, string | string[] | undefined>;

async function Results({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const filters = readFilters(params);
  const [{ terms }, results] = await Promise.all([
    getDirectory(),
    searchListings(filters),
  ]);

  const pageParam = params.page ?? params["frm-page-31601"];
  const pages = Math.max(1, Math.ceil(results.length / RESULTS_PAGE_SIZE));
  const page = Math.min(
    pages,
    Math.max(
      1,
      Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1,
    ),
  );
  const shown = results.slice(
    (page - 1) * RESULTS_PAGE_SIZE,
    page * RESULTS_PAGE_SIZE,
  );

  const groups = (Object.keys(STEP_PARAMS) as TermKind[]).map((kind) => ({
    kind,
    param: STEP_PARAMS[kind],
    title: GROUP_TITLES[kind],
    options: [
      ...(kind === "region" ? [{ label: "All", slug: "all" }] : []),
      ...termsByKind(terms, kind)
        .sort((a, b) =>
          kind === "service" ? a.label.localeCompare(b.label) : 0,
        )
        .map((t) => ({
          label: t.label,
          slug: t.slug,
        })),
    ],
  }));

  const pageHref = (n: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      if (
        typeof value === "string" &&
        key !== "page" &&
        !key.startsWith("frm-page")
      )
        qs.set(key, value);
    if (n > 1) qs.set("page", String(n));
    const s = qs.toString();
    return `/directory/search-results/${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto grid max-w-[1200px] gap-y-10 px-5 py-[30px] lg:grid-cols-[240px_720px_240px] lg:px-0">
      <div className="order-2 lg:order-none lg:px-2.5">
        <ResultsSidebar groups={groups} filters={filters} />
      </div>
      <div className="lg:px-2.5">
        <h2 className="text-brand mb-5 text-2xl font-bold">Search Results:</h2>
        {shown.length ? (
          <ul className="space-y-[15px]">
            {shown.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        ) : (
          <p>No businesses match your search. Try fewer filters.</p>
        )}
        <p className="mt-8 text-center">
          Showing {results.length} search result
          {results.length === 1 ? "" : "s"}.
        </p>
        {pages > 1 && (
          <nav aria-label="Pagination" className="text-brand flex gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                aria-current={n === page ? "page" : undefined}
                className={n === page ? "text-body" : "hover:text-body"}
              >
                {n}
              </Link>
            ))}
            {page < pages && (
              <Link
                href={pageHref(page + 1)}
                aria-label="Next page"
                className="hover:text-body"
              >
                »
              </Link>
            )}
          </nav>
        )}
      </div>
      <div className="desk:block order-3 hidden lg:px-2.5">
        <Promos />
      </div>
    </div>
  );
}

export default function SearchResultsPage(
  props: PageProps<"/directory/search-results">,
) {
  return (
    <>
      <DirectoryHero />
      <Suspense fallback={<div className="min-h-[600px]" />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
      <div className="h-10" />
      <ListingCta />
      <GetInTouch />
      <NewsletterSignup />
    </>
  );
}
