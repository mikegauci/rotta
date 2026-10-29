import type { Metadata } from "next";
import { EventEditor } from "@/components/admin/event-editor";
import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <>
      <AdminPageHeader title="New event" />
      <EventEditor
        initial={{
          id: null,
          title: "",
          slug: "",
          organiser: "",
          location: "",
          description: "",
          startsOn: "",
          endsOn: "",
          startTime: "",
          endTime: "",
          poster: null,
          facebookUrl: "",
          contactEmail: "",
          status: "published",
          seo: {},
        }}
      />
    </>
  );
}
