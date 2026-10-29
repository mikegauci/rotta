import "server-only";
import type {
  BusinessFormValue,
  TermGroups,
} from "@/components/directory/business-form";
import { getDirectory, type OpeningHours } from "@/lib/directory";
import { createClient } from "@/lib/supabase/server";

export const EMPTY_BUSINESS: BusinessFormValue = {
  name: "",
  location: "",
  shortDescription: "",
  description: "",
  address: "",
  logo: null,
  phone: "",
  phone2: "",
  email: "",
  website: "",
  openingHours: {},
  termIds: [],
};

export async function getTermGroups(): Promise<TermGroups> {
  const { terms } = await getDirectory();
  const pick = (kind: keyof TermGroups) =>
    terms
      .filter((t) => t.kind === kind)
      .map((t) => ({ id: t.id, label: t.label }));
  return {
    vehicle: pick("vehicle"),
    era: pick("era"),
    service: pick("service").sort((a, b) => a.label.localeCompare(b.label)),
    region: pick("region"),
  };
}

const COLUMNS = `id, slug, status, owner_id, name, location, short_description,
  description, address, phone, phone_2, email, website, opening_hours,
  logo:media(id, path, width, height, alt), terms:business_terms(term_id)`;

type Filter = { ownerId: string } | { id: string };

// A listing as the form edits it (RLS lets owners read their own drafts).
export async function getListingForForm(filter: Filter) {
  const db = await createClient();
  let query = db.from("businesses").select(COLUMNS);
  query =
    "ownerId" in filter
      ? query.eq("owner_id", filter.ownerId)
      : query.eq("id", filter.id);
  const { data } = await query.maybeSingle();
  if (!data) return null;
  const value: BusinessFormValue = {
    name: data.name,
    location: data.location,
    shortDescription: data.short_description,
    description: data.description,
    address: data.address,
    logo: data.logo,
    phone: data.phone,
    phone2: data.phone_2,
    email: data.email,
    website: data.website,
    openingHours: (data.opening_hours ?? {}) as OpeningHours,
    termIds: data.terms.map((t) => t.term_id),
  };
  return {
    id: data.id,
    slug: data.slug,
    status: data.status,
    ownerId: data.owner_id,
    value,
  };
}
