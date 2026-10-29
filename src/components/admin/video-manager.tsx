"use client";

/* eslint-disable @next/next/no-img-element -- YouTube thumbnails */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
import {
  addVideo,
  deleteSeries,
  deleteVideo,
  reorder,
  saveSeries,
  updateVideo,
} from "@/app/(admin)/admin/videos/actions";
import { MediaField, type PickedMedia } from "@/components/admin/media-picker";
import type { Enums } from "@/lib/supabase/database.types";

export type ManagedVideo = {
  id: string;
  youtubeId: string;
  title: string;
  status: Enums<"publish_status">;
};

export type ManagedSeries = {
  id: string;
  title: string;
  description: string;
  titleImage: PickedMedia | null;
  videos: ManagedVideo[];
};

const control =
  "rounded border border-[#ddd] bg-white px-3 py-2 text-sm focus:border-[#999] focus:outline-none";
const field = `w-full ${control}`;
const small =
  "rounded border border-[#ddd] bg-white px-2 py-1 text-xs hover:border-[#999] disabled:opacity-40";
const button =
  "bg-brand hover:text-brand rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black disabled:opacity-60";

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function VideoManager({ series: initial }: { series: ManagedSeries[] }) {
  const router = useRouter();
  const [series, setSeries] = useState(initial);
  const [synced, setSynced] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Take fresh server data after each save.
  if (synced !== initial) {
    setSynced(initial);
    setSeries(initial);
  }

  function run(
    action: () => Promise<{ error: string } | { ok: true }>,
    after?: () => void,
  ) {
    setError(null);
    start(async () => {
      const result = await action();
      if ("error" in result) {
        setError(result.error);
        setSeries(synced);
        return;
      }
      after?.();
      router.refresh();
    });
  }

  function moveSeries(from: number, to: number) {
    const next = move(series, from, to);
    setSeries(next);
    run(() =>
      reorder(
        "video_series",
        next.map((s) => s.id),
      ),
    );
  }

  function moveVideo(seriesIndex: number, from: number, to: number) {
    const videos = move(series[seriesIndex].videos, from, to);
    setSeries(series.map((s, i) => (i === seriesIndex ? { ...s, videos } : s)));
    run(() =>
      reorder(
        "videos",
        videos.map((v) => v.id),
      ),
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-coral rounded bg-white p-3 text-sm">
          {error}
        </p>
      )}
      {series.map((s, si) => (
        <SeriesCard
          key={s.id}
          series={s}
          allSeries={series}
          pending={pending}
          first={si === 0}
          last={si === series.length - 1}
          onMoveSeries={(dir) => moveSeries(si, si + dir)}
          onMoveVideo={(from, to) => moveVideo(si, from, to)}
          run={run}
        />
      ))}
      <NewSeries run={run} pending={pending} />
    </div>
  );
}

function SeriesCard({
  series,
  allSeries,
  pending,
  first,
  last,
  onMoveSeries,
  onMoveVideo,
  run,
}: {
  series: ManagedSeries;
  allSeries: ManagedSeries[];
  pending: boolean;
  first: boolean;
  last: boolean;
  onMoveSeries: (dir: -1 | 1) => void;
  onMoveVideo: (from: number, to: number) => void;
  run: (
    action: () => Promise<{ error: string } | { ok: true }>,
    after?: () => void,
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const live = series.videos.filter((v) => v.status === "published").length;

  return (
    <details className="group rounded-lg bg-white shadow-sm">
      <summary className="flex cursor-pointer items-center gap-3 p-4">
        <span className="text-ink flex-1 font-semibold">
          {series.title}
          <span className="text-muted ml-2 text-xs font-normal">
            {live} live
            {series.videos.length > live
              ? `, ${series.videos.length - live} hidden`
              : ""}
          </span>
        </span>
        <button
          type="button"
          aria-label="Move series up"
          disabled={first || pending}
          onClick={(e) => {
            e.preventDefault();
            onMoveSeries(-1);
          }}
          className={small}
        >
          <FiArrowUp />
        </button>
        <button
          type="button"
          aria-label="Move series down"
          disabled={last || pending}
          onClick={(e) => {
            e.preventDefault();
            onMoveSeries(1);
          }}
          className={small}
        >
          <FiArrowDown />
        </button>
      </summary>

      <div className="space-y-4 border-t border-[#eee] p-4">
        {editing ? (
          <SeriesForm
            initial={series}
            pending={pending}
            onCancel={() => setEditing(false)}
            run={run}
          />
        ) : (
          <div className="flex flex-wrap items-start gap-4">
            <p className="text-muted flex-1 text-sm">
              {series.description || "No description."}
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={small}
            >
              Edit series
            </button>
            {series.videos.length === 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteSeries(series.id))}
                className={`${small} text-coral`}
              >
                Delete series
              </button>
            )}
          </div>
        )}

        <ol className="divide-y divide-[#f3f3f3]">
          {series.videos.map((v, vi) => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 py-2">
              <a
                href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <img
                  src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                  alt=""
                  width={96}
                  height={54}
                  className={`rounded ${v.status === "draft" ? "opacity-40" : ""}`}
                />
              </a>
              <input
                aria-label="Title"
                defaultValue={v.title}
                onBlur={(e) =>
                  e.target.value.trim() !== v.title &&
                  run(() => updateVideo(v.id, { title: e.target.value }))
                }
                className={`${control} min-w-48 flex-1`}
              />
              <select
                aria-label="Series"
                value={series.id}
                disabled={pending}
                onChange={(e) =>
                  run(() => updateVideo(v.id, { seriesId: e.target.value }))
                }
                className={`${control} w-40`}
              >
                {allSeries.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    updateVideo(v.id, {
                      status: v.status === "published" ? "draft" : "published",
                    }),
                  )
                }
                className={small}
              >
                {v.status === "published" ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                aria-label="Move up"
                disabled={vi === 0 || pending}
                onClick={() => onMoveVideo(vi, vi - 1)}
                className={small}
              >
                <FiArrowUp />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={vi === series.videos.length - 1 || pending}
                onClick={() => onMoveVideo(vi, vi + 1)}
                className={small}
              >
                <FiArrowDown />
              </button>
              {confirmDelete === v.id ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteVideo(v.id))}
                  className={`${small} bg-coral border-coral text-white`}
                >
                  Confirm delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(v.id)}
                  className={`${small} text-coral`}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ol>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => addVideo(series.id, link),
              () => setLink(""),
            );
          }}
        >
          <input
            aria-label="YouTube link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste a YouTube link to add it to the end"
            className={field}
          />
          <button
            type="submit"
            disabled={pending || !link.trim()}
            className={button}
          >
            Add
          </button>
        </form>
      </div>
    </details>
  );
}

function SeriesForm({
  initial,
  pending,
  onCancel,
  run,
}: {
  initial: Pick<ManagedSeries, "title" | "description" | "titleImage"> & {
    id: string | null;
  };
  pending: boolean;
  onCancel: () => void;
  run: (
    action: () => Promise<{ error: string } | { ok: true }>,
    after?: () => void,
  ) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [image, setImage] = useState(initial.titleImage);

  return (
    <form
      className="grid gap-4 md:grid-cols-[1fr_240px]"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            saveSeries({
              id: initial.id,
              title,
              description,
              titleMediaId: image?.id ?? null,
            }),
          onCancel,
        );
      }}
    >
      <div className="space-y-3">
        <label className="block">
          <span className="text-ink mb-1 block text-sm font-semibold">
            Series name
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={field}
          />
        </label>
        <label className="block">
          <span className="text-ink mb-1 block text-sm font-semibold">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={field}
          />
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={button}>
            Save series
          </button>
          <button type="button" onClick={onCancel} className={small}>
            Cancel
          </button>
        </div>
      </div>
      <MediaField
        label="Title artwork"
        hint="Shown instead of the name (white on transparent)."
        value={image}
        onChange={setImage}
      />
    </form>
  );
}

function NewSeries({
  run,
  pending,
}: {
  run: (
    action: () => Promise<{ error: string } | { ok: true }>,
    after?: () => void,
  ) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className={button}>
        New series
      </button>
    );
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <SeriesForm
        initial={{ id: null, title: "", description: "", titleImage: null }}
        pending={pending}
        onCancel={() => setOpen(false)}
        run={run}
      />
    </div>
  );
}
