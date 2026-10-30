"use server";

import { revalidatePath, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { slugify } from "@/lib/slug";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { parseYoutubeId } from "@/lib/watch";

type Result = { error: string } | { ok: true };

function refresh() {
  updateTag("videos");
  revalidatePath("/admin/videos/");
}

async function youtubeTitle(id: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return ((await res.json()) as { title?: string }).title ?? null;
  } catch {
    return null;
  }
}

// Adds a YouTube video to the end of a series, titled from YouTube.
export async function addVideo(
  seriesId: string,
  link: string,
): Promise<Result> {
  await assertAdmin("videos");
  const youtubeId = parseYoutubeId(link);
  if (!youtubeId) return { error: "Paste a YouTube link or video id." };
  const db = await createClient();
  const { data: existing } = await db
    .from("videos")
    .select("series:video_series(title)")
    .eq("youtube_id", youtubeId)
    .maybeSingle();
  if (existing)
    return {
      error: `That video is already in ${existing.series?.title ?? "another series"}.`,
    };
  const title = await youtubeTitle(youtubeId);
  if (!title)
    return {
      error: "YouTube didn’t find that video. Is it public or unlisted?",
    };
  const { data: last } = await db
    .from("videos")
    .select("sort_order")
    .eq("series_id", seriesId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db.from("videos").insert({
    youtube_id: youtubeId,
    title,
    series_id: seriesId,
    sort_order: (last?.sort_order ?? -1) + 1,
    status: "published",
  });
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

export async function updateVideo(
  id: string,
  patch: {
    title?: string;
    seriesId?: string;
    status?: Enums<"publish_status">;
  },
): Promise<Result> {
  await assertAdmin("videos");
  const db = await createClient();
  const row: {
    title?: string;
    series_id?: string;
    status?: Enums<"publish_status">;
    sort_order?: number;
  } = {};
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) return { error: "Titles can’t be empty." };
    row.title = title;
  }
  if (patch.status) row.status = patch.status;
  if (patch.seriesId) {
    // Moved videos go to the end of their new series.
    const { data: last } = await db
      .from("videos")
      .select("sort_order")
      .eq("series_id", patch.seriesId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    row.series_id = patch.seriesId;
    row.sort_order = (last?.sort_order ?? -1) + 1;
  }
  const { error } = await db.from("videos").update(row).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteVideo(id: string): Promise<Result> {
  await assertAdmin("videos");
  const db = await createClient();
  const { error } = await db.from("videos").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

// Saves a new order: `ids` are videos of one series, or the series themselves.
export async function reorder(
  table: "videos" | "video_series",
  ids: string[],
): Promise<Result> {
  await assertAdmin("videos");
  if (table !== "videos" && table !== "video_series")
    return { error: "Unknown list." };
  const db = await createClient();
  const results = await Promise.all(
    ids.map((id, i) => db.from(table).update({ sort_order: i }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };
  refresh();
  return { ok: true };
}

export async function saveSeries(input: {
  id: string | null;
  title: string;
  description: string;
  titleMediaId: string | null;
}): Promise<Result> {
  await assertAdmin("videos");
  const title = input.title.trim();
  if (!title) return { error: "Add a series name." };
  const row = {
    title,
    description: input.description.trim(),
    title_media_id: input.titleMediaId,
  };
  const db = await createClient();
  if (input.id) {
    const { error } = await db
      .from("video_series")
      .update(row)
      .eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { data: last } = await db
      .from("video_series")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await db.from("video_series").insert({
      ...row,
      slug: `${slugify(title) || "series"}-${Date.now().toString(36)}`,
      sort_order: (last?.sort_order ?? -1) + 1,
    });
    if (error) return { error: error.message };
  }
  refresh();
  return { ok: true };
}

// Only empty series can go, so videos are never orphaned by accident.
export async function deleteSeries(id: string): Promise<Result> {
  await assertAdmin("videos");
  const db = await createClient();
  const { count } = await db
    .from("videos")
    .select("id", { count: "exact", head: true })
    .eq("series_id", id);
  if (count) return { error: "Move or delete this series’ videos first." };
  const { error } = await db.from("video_series").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}
