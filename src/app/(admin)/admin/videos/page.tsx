import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  VideoManager,
  type ManagedSeries,
} from "@/components/admin/video-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Videos" };

// Reads the session on every request.
export const instant = false;

export default async function VideosAdminPage() {
  await connection();
  const db = await createClient();
  const { data, error } = await db
    .from("video_series")
    .select(
      `id, title, description,
      titleImage:media(id, path, width, height, alt),
      videos(id, youtube_id, title, sort_order, status)`,
    )
    .order("sort_order");

  const series: ManagedSeries[] = (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    titleImage: s.titleImage,
    videos: s.videos
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        youtubeId: v.youtube_id,
        title: v.title,
        status: v.status,
      })),
  }));

  return (
    <>
      <AdminPageHeader
        title="Videos"
        description="Each series is one carousel on the Watch page, in this order."
        actions={
          <Link href="/watch/" className="text-sm hover:underline">
            View Watch page →
          </Link>
        }
      />
      {error && (
        <p className="text-coral">Could not load videos: {error.message}</p>
      )}
      <VideoManager series={series} />
    </>
  );
}
