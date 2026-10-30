"use client";

import {
  startTransition,
  useRef,
  useActionState,
  useState,
  useSyncExternalStore,
} from "react";
import { FiUpload } from "react-icons/fi";
import { submitEvent } from "@/app/(plain)/events/actions";

const input =
  "w-full border-0 border-b border-[#191919] bg-transparent px-0 py-2 text-sm focus:border-brand focus:outline-none";
const label = "block text-[13px] font-bold text-[#191919]";

function Label({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <span className={label}>
      {children}
      {required && <span className="text-coral"> *</span>}
    </span>
  );
}

// Shrinks the poster in the browser (max 2000px WebP) so uploads stay small.
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob ?? file), "image/webp", 0.85),
    );
  } catch {
    return file;
  }
}

// "Add Event" toggle and form under the calendar, as on the live site.
export function AddEvent() {
  const [toggled, setToggled] = useState<boolean | null>(null);
  // When the visitor started filling in the form (bots submit instantly).
  const startedAt = useRef(0);
  const [posterName, setPosterName] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [state, action, pending] = useActionState(submitEvent, undefined);
  const f = state?.fields;

  // Links to /events/#add-event open the form.
  const linked = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    },
    () => window.location.hash === "#add-event",
    () => false,
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("started_at", String(startedAt.current));
    const poster = data.get("poster");
    if (poster instanceof File && poster.size > 0) {
      setPreparing(true);
      const blob = await shrink(poster);
      setPreparing(false);
      data.set("poster", blob, poster.name.replace(/\.\w+$/, "") + ".webp");
    }
    startTransition(() => action(data));
  }

  const busy = pending || preparing;
  const open = toggled ?? linked;

  return (
    <section id="add-event" className="pt-[54px] pb-[11px]">
      <div className="mb-5 flex items-center gap-4">
        <h2 className="text-heading text-[28px] leading-[28px] font-bold">
          Add Event
        </h2>
        <button
          type="button"
          aria-expanded={open || Boolean(state?.error)}
          aria-controls="add-event-form"
          onClick={() => setToggled(!open)}
          className="flex h-[30px] w-[60px] items-center justify-center rounded-full bg-black font-black text-white hover:opacity-50"
        >
          <span aria-hidden>{open ? "−" : "+"}</span>
          <span className="sr-only">
            {open ? "Hide the form" : "Add an event"}
          </span>
        </button>
      </div>

      {(open || state?.error) && (
        <form
          id="add-event-form"
          onSubmit={onSubmit}
          onFocus={() => {
            startedAt.current ||= Date.now();
          }}
          className="grid grid-cols-1 gap-x-[2%] gap-y-5 md:grid-cols-12"
        >
          <label className="md:col-span-4">
            <Label required>Event Title</Label>
            <input
              name="title"
              required
              defaultValue={f?.title}
              placeholder="Classic JDM Car Meet"
              className={input}
            />
          </label>
          <label className="md:col-span-4">
            <Label required>Location</Label>
            <input
              name="location"
              required
              defaultValue={f?.location}
              placeholder="Ta' Qali"
              className={input}
            />
          </label>
          <label className="md:col-span-4">
            <Label required>Email</Label>
            <input
              name="email"
              type="email"
              required
              defaultValue={f?.email}
              className={input}
            />
          </label>
          <label className="md:col-span-6">
            <Label>Organiser / Club Name</Label>
            <input
              name="organiser"
              defaultValue={f?.organiser}
              placeholder="Malta Car Meets"
              className={input}
            />
          </label>
          <label className="md:col-span-6">
            <Label>Facebook Event Link</Label>
            <input
              name="facebook"
              type="url"
              defaultValue={f?.facebook}
              className={input}
            />
          </label>
          <label className="md:col-span-3">
            <Label required>Start Date</Label>
            <input
              name="startsOn"
              type="date"
              required
              defaultValue={f?.startsOn}
              className={input}
            />
          </label>
          <label className="md:col-span-3">
            <Label required>End Date</Label>
            <input
              name="endsOn"
              type="date"
              required
              defaultValue={f?.endsOn}
              className={input}
            />
          </label>
          <label className="md:col-span-3">
            <Label required>Start Time</Label>
            <input
              name="startTime"
              type="time"
              required
              defaultValue={f?.startTime}
              className={input}
            />
          </label>
          <label className="md:col-span-3">
            <Label required>End Time</Label>
            <input
              name="endTime"
              type="time"
              required
              defaultValue={f?.endTime}
              className={input}
            />
          </label>
          <label className="md:col-span-6">
            <Label>Event Description</Label>
            <textarea
              name="description"
              rows={5}
              defaultValue={f?.description}
              className="focus:border-brand mt-2 w-full border border-[#191919] bg-transparent p-2 text-sm focus:outline-none"
            />
          </label>
          <div className="md:col-span-6">
            <Label>Upload Event Poster</Label>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 border border-[#191919] px-4 py-6 text-center text-xs text-[#444] hover:bg-[#f7f7f7]">
              <FiUpload className="mb-1 size-7" aria-hidden />
              <span className="text-[13px]">
                {posterName ?? "Drop a file here or click to upload"}
              </span>
              <span>Recommended Size: 1920x1000px - Landscape</span>
              <span className="text-[10px]">Maximum upload size: 10MB</span>
              <input
                name="poster"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) =>
                  setPosterName(e.target.files?.[0]?.name ?? null)
                }
              />
            </label>
          </div>
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="hidden"
          />
          <div className="md:col-span-12">
            <button
              type="submit"
              disabled={busy}
              className="bg-brand my-2.5 h-[43px] w-[130px] rounded-[5px] text-[15px] font-bold text-black disabled:opacity-60"
            >
              {busy ? "Sending…" : "Submit"}
            </button>
            {state?.error && (
              <p role="alert" className="text-coral mt-2 text-sm">
                {state.error}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
