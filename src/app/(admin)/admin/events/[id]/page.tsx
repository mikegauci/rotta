import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventEditor } from "@/components/admin/event-editor";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit event" };

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

export default async function EditEventPage({
  params,
}: PageProps<"/admin/events/[id]">) {
  const { id } = await params;
  const db = await createClient();
  const { data: e } = await db
    .from("events")
    .select("*, poster:media(id, path, width, height, alt)")
    .eq("id", id)
    .maybeSingle();
  if (!e) notFound();
  return (
    <>
      <AdminPageHeader
        title="Edit event"
        actions={
          <Link href="/admin/events/" className="text-sm hover:underline">
            ← All events
          </Link>
        }
      />
      <EventEditor
        key={e.id}
        initial={{
          id: e.id,
          title: e.title,
          slug: e.slug,
          organiser: e.organiser,
          location: e.location,
          description: e.description,
          startsOn: e.starts_on,
          endsOn: e.ends_on ?? "",
          startTime: hhmm(e.start_time),
          endTime: hhmm(e.end_time),
          poster: e.poster,
          facebookUrl: e.facebook_url,
          contactEmail: e.contact_email,
          status: e.status,
          seo: (e.seo ?? {}) as {
            title?: string;
            description?: string;
            noindex?: boolean;
          },
        }}
      />
    </>
  );
}
