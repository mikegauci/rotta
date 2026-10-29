"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteEvent,
  saveEvent,
  type EventInput,
} from "@/app/(admin)/admin/events/actions";
import { MediaField, type PickedMedia } from "@/components/admin/media-picker";
import { slugify } from "@/lib/slug";

export type EditorEvent = Omit<EventInput, "posterMediaId"> & {
  poster: PickedMedia | null;
};

const field =
  "w-full rounded border border-[#ddd] bg-white px-3 py-2 text-sm focus:border-[#999] focus:outline-none";
const panel = "space-y-4 rounded-lg bg-white p-5 shadow-sm";
const label = "mb-1 block text-sm font-semibold text-ink";

export function EventEditor({ initial }: { initial: EditorEvent }) {
  const router = useRouter();
  const [event, setEvent] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();

  const update = (patch: Partial<EditorEvent>) => {
    setEvent((e) => ({ ...e, ...patch }));
    setMessage(null);
  };
  const text = (key: keyof EditorEvent) => ({
    value: String(event[key] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      update({ [key]: e.target.value } as Partial<EditorEvent>),
  });

  function save() {
    start(async () => {
      const { poster, ...rest } = event;
      const result = await saveEvent({
        ...rest,
        posterMediaId: poster?.id ?? null,
      });
      if ("error" in result)
        return setMessage({ ok: false, text: result.error });
      setEvent((e) => ({ ...e, id: result.id, slug: result.slug }));
      setSlugTouched(true);
      setMessage({ ok: true, text: "Saved." });
      if (!event.id) router.replace(`/admin/events/${result.id}/`);
      else router.refresh();
    });
  }

  function remove() {
    if (
      !event.id ||
      !window.confirm(`Delete “${event.title}”? This can’t be undone.`)
    )
      return;
    start(async () => {
      const result = await deleteEvent(event.id!);
      if ("error" in result)
        return setMessage({ ok: false, text: result.error ?? "" });
      router.push("/admin/events/");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <div className={panel}>
          <input
            value={event.title}
            onChange={(e) =>
              update({
                title: e.target.value,
                ...(slugTouched ? {} : { slug: slugify(e.target.value) }),
              })
            }
            placeholder="Event title"
            aria-label="Title"
            className="text-ink w-full text-2xl font-black outline-none placeholder:text-[#bbb]"
          />
          <label className="text-muted flex items-center gap-1 text-sm">
            rotta.mt/events/
            <input
              value={event.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update({ slug: e.target.value });
              }}
              aria-label="URL slug"
              className="min-w-0 flex-1 rounded border border-transparent px-1 py-0.5 hover:border-[#ddd] focus:border-[#999] focus:outline-none"
            />
            /
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className={label}>Organiser</span>
              <input {...text("organiser")} className={field} />
            </label>
            <label>
              <span className={label}>Location</span>
              <input {...text("location")} className={field} />
            </label>
          </div>
          <label className="block">
            <span className={label}>Description</span>
            <textarea rows={10} {...text("description")} className={field} />
            <span className="text-muted text-xs">
              Leave an empty line between paragraphs.
            </span>
          </label>
        </div>

        <div className={panel}>
          <h2 className="text-ink font-black">When</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <label>
              <span className={label}>Start date *</span>
              <input
                type="date"
                required
                {...text("startsOn")}
                className={field}
              />
            </label>
            <label>
              <span className={label}>End date</span>
              <input
                type="date"
                min={event.startsOn}
                {...text("endsOn")}
                className={field}
              />
            </label>
            <label>
              <span className={label}>Start time</span>
              <input type="time" {...text("startTime")} className={field} />
            </label>
            <label>
              <span className={label}>End time</span>
              <input type="time" {...text("endTime")} className={field} />
            </label>
          </div>
        </div>

        <div className={panel}>
          <h2 className="text-ink font-black">Links</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className={label}>Facebook event / tickets link</span>
              <input
                {...text("facebookUrl")}
                placeholder="https://facebook.com/events/…"
                className={field}
              />
            </label>
            <label>
              <span className={label}>Contact email</span>
              <input type="email" {...text("contactEmail")} className={field} />
            </label>
          </div>
        </div>

        <div className={panel}>
          <h2 className="text-ink font-black">SEO</h2>
          <label className="block">
            <span className={label}>Title</span>
            <input
              value={event.seo.title ?? ""}
              onChange={(e) =>
                update({ seo: { ...event.seo, title: e.target.value } })
              }
              placeholder={event.title}
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Description</span>
            <textarea
              rows={2}
              value={event.seo.description ?? ""}
              onChange={(e) =>
                update({ seo: { ...event.seo, description: e.target.value } })
              }
              className={field}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(event.seo.noindex)}
              onChange={(e) =>
                update({ seo: { ...event.seo, noindex: e.target.checked } })
              }
            />
            Hide from search engines (noindex)
          </label>
        </div>
      </div>

      <aside className="space-y-6">
        <div className={panel}>
          <label className="block">
            <span className={label}>Status</span>
            <select
              value={event.status}
              onChange={(e) =>
                update({ status: e.target.value as EditorEvent["status"] })
              }
              className={field}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="bg-brand hover:text-brand w-full rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black disabled:opacity-60"
          >
            {pending ? "Saving…" : event.id ? "Save" : "Create event"}
          </button>
          {message && (
            <p
              role="status"
              className={`text-sm ${message.ok ? "text-green-700" : "text-coral"}`}
            >
              {message.text}
            </p>
          )}
          {event.id && initial.status === "published" && (
            <Link
              href={`/events/${initial.slug}/`}
              target="_blank"
              className="block text-sm font-semibold hover:underline"
            >
              View event
            </Link>
          )}
          {event.id && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="text-coral text-sm hover:underline"
            >
              Delete event
            </button>
          )}
        </div>
        <div className={panel}>
          <MediaField
            label="Poster"
            hint="Shown on the event page and the Upcoming Events carousel."
            value={event.poster}
            onChange={(poster) => update({ poster })}
          />
        </div>
      </aside>
    </div>
  );
}
