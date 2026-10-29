// Directory: filter terms (from the "Directory Filtering" form, with icons)
// and business listings (from the "Business Details" Formidable entries).
import type { Context } from "../lib/context.ts";
import { maybeUnserialize, phpList } from "../lib/php.ts";
import { decodeEntities, slugify, wpDate } from "../lib/wp.ts";

type Kind = "vehicle" | "era" | "service" | "region";

// Filter form field -> kind, and the matching Business Details checkbox field.
const FILTER_FIELDS: {
  kind: Kind;
  filterField: string;
  businessField: string;
}[] = [
  { kind: "vehicle", filterField: "49", businessField: "143" },
  { kind: "era", filterField: "63", businessField: "146" },
  { kind: "service", filterField: "72", businessField: "145" },
  { kind: "region", filterField: "79", businessField: "144" },
];

const F = {
  name: "116",
  location: "120",
  shortDescription: "119",
  description: "333",
  address: "377",
  logo: "118",
  phone: "348",
  phone2: "350",
  email: "351",
  website: "352",
} as const;

// Day -> [open field, close field, optional "do you open?" field]
const HOURS: [string, string, string, string?][] = [
  ["mon", "335", "353"],
  ["tue", "336", "354"],
  ["wed", "337", "355"],
  ["thu", "339", "356"],
  ["fri", "338", "359"],
  ["sat", "345", "357", "344"],
  ["sun", "347", "358", "346"],
];

export function importDirectory(ctx: Context, users: Map<string, string>) {
  // Terms, with the icons and order used by the step-by-step filter.
  const terms = new Map<
    string,
    {
      id: string;
      kind: Kind;
      slug: string;
      label: string;
      icon_media_id: string | null;
      sort_order: number;
    }
  >();
  const termKey = (kind: Kind, label: string) =>
    `${kind}:${label.trim().toLowerCase()}`;
  for (const { kind, filterField } of FILTER_FIELDS) {
    const field = ctx.wp.get(
      "select options from wp_frm_fields where id = ?",
      filterField,
    );
    const options = maybeUnserialize(field?.options ?? null);
    if (!options || typeof options !== "object") continue;
    let order = 0;
    for (const option of Object.values(options)) {
      if (!option || typeof option !== "object") continue;
      const label = decodeEntities(String(option.label ?? "")).trim();
      if (!label || label === "All") continue;
      const slug = slugify(label);
      terms.set(termKey(kind, label), {
        id: ctx.id("directory_terms", `${kind}:${slug}`),
        kind,
        slug,
        label,
        icon_media_id:
          ctx.media.byAttachment(String(option.image ?? ""))?.id ?? null,
        sort_order: order++,
      });
    }
  }

  const businesses = [];
  const links: { business_id: string; term_id: string }[] = [];
  const unknownTerms = new Set<string>();
  const slugs = new Set<string>();
  for (const { item, values } of ctx.wp.frmEntries(4)) {
    const v = (field: string) =>
      decodeEntities(values.get(field)?.trim() ?? "");
    // Most entries keep the business name on the entry itself.
    const name = v(F.name) || decodeEntities(item.name?.trim() ?? "");
    if (!name) continue;
    const page =
      item.post_id && item.post_id !== "0"
        ? ctx.wp.get(
            "select ID, post_name, post_status from wp_posts where ID = ?",
            item.post_id,
          )
        : undefined;
    let slug = page?.post_name || slugify(name);
    if (slugs.has(slug)) slug = `${slug}-${item.id}`;
    slugs.add(slug);
    const id = ctx.id("businesses", item.id!);

    const hours: Record<string, { open: string; close: string } | null> = {};
    for (const [day, open, close, opens] of HOURS) {
      const isOpen = opens ? values.get(opens) === "Yes" : true;
      hours[day] =
        isOpen && values.get(open) && values.get(close)
          ? { open: values.get(open)!, close: values.get(close)! }
          : null;
    }

    for (const { kind, businessField } of FILTER_FIELDS) {
      for (const label of phpList(values.get(businessField) ?? null)) {
        // "All" regions means the business covers the whole island.
        if (kind === "region" && label === "All") {
          for (const t of terms.values())
            if (t.kind === "region")
              links.push({ business_id: id, term_id: t.id });
          continue;
        }
        const term = terms.get(termKey(kind, decodeEntities(label)));
        if (term) links.push({ business_id: id, term_id: term.id });
        else unknownTerms.add(`${kind}: ${label}`);
      }
    }

    businesses.push({
      id,
      wp_id: Number(item.id),
      owner_id: users.get(item.user_id ?? "") ?? null,
      slug,
      name,
      short_description: v(F.shortDescription),
      description: v(F.description),
      location: v(F.location),
      address: v(F.address),
      logo_media_id:
        (
          ctx.media.byAttachment(values.get(F.logo)) ??
          (page
            ? ctx.media.byAttachment(
                ctx.wp.get(
                  "select meta_value from wp_postmeta where post_id = ? and meta_key = '_thumbnail_id'",
                  page.ID!,
                )?.meta_value,
              )
            : null)
        )?.id ?? null,
      phone: v(F.phone),
      phone_2: v(F.phone2),
      email: v(F.email),
      website: v(F.website),
      opening_hours: hours,
      status:
        page?.post_status === "publish"
          ? ("published" as const)
          : ("draft" as const),
      created_at: wpDate(null, item.created_at) ?? undefined,
    });
  }

  for (const t of unknownTerms)
    ctx.warn(`directory: listing uses a term not in the filter (${t})`);
  ctx.upsert("directory_terms", [...terms.values()], "id");
  ctx.upsert("businesses", businesses, "id");
  ctx.upsert("business_terms", links, "business_id,term_id");
  ctx.count("directory: filter terms", terms.size);
  ctx.count("directory: listings", businesses.length);
  ctx.count(
    "directory: listings without a page (draft)",
    businesses.filter((b) => b.status === "draft").length,
  );
}
