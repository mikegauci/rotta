// Watch page: each Slide Anything slider on the page is a series of YouTube
// videos. Titles and dates aren't stored in WordPress, so they come from
// YouTube's oEmbed endpoint (title) during the import.
import type { Context } from "../lib/context.ts";
import { decodeEntities, slugify } from "../lib/wp.ts";

async function youtubeTitle(id: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`,
    );
    if (!res.ok) return null;
    return ((await res.json()) as { title?: string }).title ?? null;
  } catch {
    return null;
  }
}

export async function importVideos(ctx: Context) {
  const watch = ctx.wp.get(
    "select post_content from wp_posts where post_type = 'page' and post_name = 'watch' and post_status = 'publish'",
  );
  const sliderIds = [
    ...(watch?.post_content ?? "").matchAll(/slide-anything id=["'](\d+)["']/g),
  ].map((m) => m[1]);

  const series = [];
  const videos = new Map<
    string,
    { youtube_id: string; series_id: string; sort_order: number }
  >();
  for (const [index, sliderId] of sliderIds.entries()) {
    const slider = ctx.wp.get(
      "select post_title from wp_posts where ID = ?",
      sliderId,
    );
    if (!slider) continue;
    const seriesId = ctx.id("video_series", sliderId);
    const title = decodeEntities(slider.post_title!);
    series.push({
      id: seriesId,
      wp_id: Number(sliderId),
      slug: slugify(title),
      title,
      sort_order: index,
    });

    const slides = ctx.wp.all(
      "select meta_key, meta_value from wp_postmeta where post_id = ? and meta_key like 'sa_slide%_popup_video_id' and meta_value <> ''",
      sliderId,
    );
    slides.sort(
      (a, b) =>
        Number(/\d+/.exec(a.meta_key!)![0]) -
        Number(/\d+/.exec(b.meta_key!)![0]),
    );
    for (const [order, slide] of slides.entries()) {
      const youtubeId = slide.meta_value!.trim();
      // A video shown in two carousels stays in the first one.
      if (!videos.has(youtubeId))
        videos.set(youtubeId, {
          youtube_id: youtubeId,
          series_id: seriesId,
          sort_order: order,
        });
    }
  }

  const rows = [];
  let untitled = 0;
  for (const v of videos.values()) {
    const title = await youtubeTitle(v.youtube_id);
    if (!title) untitled++;
    rows.push({
      id: ctx.id("videos", v.youtube_id),
      ...v,
      title: title ?? v.youtube_id,
      status: "published" as const,
    });
  }

  ctx.upsert("video_series", series, "id");
  ctx.upsert("videos", rows, "id");
  ctx.count("watch: series", series.length);
  ctx.count("watch: videos", rows.length);
  if (untitled)
    ctx.warn(
      `watch: ${untitled} videos have no YouTube title (private or removed?); titled with their id`,
    );
}
