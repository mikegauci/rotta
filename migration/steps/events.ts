// Events from the "Events Data Source" Formidable entries. Entries that never
// got a page on the live site come in as drafts.
import type { Context } from "../lib/context.ts";
import { decodeEntities, slugify, wpDate } from "../lib/wp.ts";

const F = {
  title: "447",
  location: "448",
  organiser: "449",
  startDate: "451",
  endDate: "466",
  startTime: "452",
  endTime: "453",
  description: "465",
  email: "467",
  facebook: "468",
  poster: "469",
} as const;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{1,2}:\d{2}/;

export function importEvents(ctx: Context) {
  const rows = [];
  const slugs = new Set<string>();
  let skipped = 0;
  for (const { item, values } of ctx.wp.frmEntries(20)) {
    const v = (field: string) => values.get(field)?.trim() ?? "";
    // Newer entries keep the title on the entry itself.
    const title = decodeEntities(v(F.title) || item.name?.trim() || "");
    const startsOn = v(F.startDate);
    if (!title || !DATE.test(startsOn)) {
      skipped++;
      continue;
    }
    const page =
      item.post_id && item.post_id !== "0"
        ? ctx.wp.get(
            "select ID, post_name, post_status from wp_posts where ID = ?",
            item.post_id,
          )
        : undefined;
    let slug = page?.post_name || slugify(title);
    if (slugs.has(slug)) slug = `${slug}-${item.id}`;
    slugs.add(slug);
    const endsOn =
      DATE.test(v(F.endDate)) && v(F.endDate) >= startsOn ? v(F.endDate) : null;

    // The poster field holds an attachment id (or a URL on old entries);
    // otherwise the event page's featured image is the poster.
    const posterValue = v(F.poster);
    const poster =
      (/^\d+$/.test(posterValue)
        ? ctx.media.byAttachment(posterValue)
        : posterValue
          ? ctx.media.byUrl(posterValue)
          : null) ??
      (page
        ? ctx.media.byAttachment(
            ctx.wp.get(
              "select meta_value from wp_postmeta where post_id = ? and meta_key = '_thumbnail_id'",
              page.ID!,
            )?.meta_value,
          )
        : null);

    rows.push({
      id: ctx.id("events", item.id!),
      wp_id: Number(item.id),
      slug,
      title,
      organiser: decodeEntities(v(F.organiser)),
      location: decodeEntities(v(F.location)),
      description: decodeEntities(v(F.description)),
      starts_on: startsOn,
      ends_on: endsOn,
      start_time: TIME.test(v(F.startTime)) ? v(F.startTime) : null,
      end_time: TIME.test(v(F.endTime)) ? v(F.endTime) : null,
      poster_media_id: poster?.id ?? null,
      facebook_url: v(F.facebook),
      contact_email: v(F.email),
      status:
        page?.post_status === "publish"
          ? ("published" as const)
          : ("draft" as const),
      created_at: wpDate(null, item.created_at) ?? undefined,
    });
  }
  ctx.upsert("events", rows, "id");
  ctx.count("events", rows.length);
  ctx.count(
    "events: drafts (no page on live site)",
    rows.filter((r) => r.status === "draft").length,
  );
  if (skipped)
    ctx.warn(
      `events: skipped ${skipped} entries without a title or start date`,
    );
}
