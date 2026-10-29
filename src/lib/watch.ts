import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { MediaInfo } from "@/lib/blog";
import { mediaUrl } from "@/lib/media";
import { publicDb } from "@/lib/supabase/public";

export type WatchVideo = { youtubeId: string; title: string };

export type WatchSeries = {
  slug: string;
  title: string;
  description: string;
  titleImage: MediaInfo | null;
  videos: WatchVideo[];
};

// Hero background, uploaded to Storage by the import.
export const WATCH_HERO_VIDEO = mediaUrl("wp/2021/01/rotta-video-bg.mp4");

// Every series in admin order, each with its published videos in order.
export async function getWatchSeries(): Promise<WatchSeries[]> {
  "use cache";
  cacheTag("videos");
  cacheLife("hours");
  const { data, error } = await publicDb
    .from("video_series")
    .select(
      `slug, title, description,
      titleImage:media(path, width, height, alt),
      videos(youtube_id, title, sort_order, status)`,
    )
    .order("sort_order");
  if (error) throw error;
  return data
    .map((s) => ({
      slug: s.slug,
      title: s.title,
      description: s.description,
      titleImage: s.titleImage,
      videos: s.videos
        .filter((v) => v.status === "published")
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((v) => ({ youtubeId: v.youtube_id, title: v.title })),
    }))
    .filter((s) => s.videos.length);
}

// "https://youtu.be/abc", ".../watch?v=abc", ".../shorts/abc" or a bare id.
export function parseYoutubeId(input: string): string | null {
  const text = input.trim();
  if (/^[\w-]{11}$/.test(text)) return text;
  try {
    const url = new URL(text);
    if (url.hostname === "youtu.be") return url.pathname.slice(1, 12) || null;
    const v = url.searchParams.get("v");
    if (v) return v;
    const m = /\/(?:shorts|embed|live)\/([\w-]{11})/.exec(url.pathname);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function youtubeThumbnail(id: string) {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}
