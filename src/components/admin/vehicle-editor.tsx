"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FiArrowLeft, FiArrowRight, FiX } from "react-icons/fi";
import {
  deleteVehicle,
  saveVehicle,
  type VehicleInput,
} from "@/app/(admin)/admin/marketplace/actions";
import {
  MediaField,
  MediaPicker,
  type PickedMedia,
} from "@/components/admin/media-picker";
import { mediaUrl } from "@/lib/media";
import { slugify } from "@/lib/slug";
import {
  BODY_TYPES,
  TRANSMISSIONS,
  VEHICLE_FEATURES,
} from "@/lib/vehicle-features";

export type EditorVehicle = Omit<
  VehicleInput,
  "imageMediaId" | "ctaMediaId" | "photoIds"
> & {
  image: PickedMedia | null;
  cta: PickedMedia | null;
  photos: PickedMedia[];
};

const field =
  "w-full rounded border border-[#ddd] bg-white px-3 py-2 text-sm focus:border-[#999] focus:outline-none";
const panel = "space-y-4 rounded-lg bg-white p-5 shadow-sm";
const label = "mb-1 block text-sm font-semibold text-ink";

export function VehicleEditor({ initial }: { initial: EditorVehicle }) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [picking, setPicking] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();

  const update = (patch: Partial<EditorVehicle>) => {
    setVehicle((v) => ({ ...v, ...patch }));
    setMessage(null);
  };
  const text = (key: keyof EditorVehicle) => ({
    value: String(vehicle[key] ?? ""),
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => update({ [key]: e.target.value } as Partial<EditorVehicle>),
  });
  const setFeature = (key: string, patch: { value?: string; show?: boolean }) =>
    update({
      features: {
        ...vehicle.features,
        [key]: {
          value: vehicle.features[key]?.value ?? "",
          show: vehicle.features[key]?.show ?? false,
          ...patch,
        },
      },
    });
  const movePhoto = (from: number, to: number) => {
    const photos = [...vehicle.photos];
    const [p] = photos.splice(from, 1);
    photos.splice(to, 0, p);
    update({ photos });
  };

  function save() {
    start(async () => {
      const { image, cta, photos, ...rest } = vehicle;
      const result = await saveVehicle({
        ...rest,
        imageMediaId: image?.id ?? null,
        ctaMediaId: cta?.id ?? null,
        photoIds: photos.map((p) => p.id),
      });
      if ("error" in result)
        return setMessage({ ok: false, text: result.error });
      setVehicle((v) => ({ ...v, id: result.id, slug: result.slug }));
      setSlugTouched(true);
      setMessage({ ok: true, text: "Saved." });
      if (!vehicle.id) router.replace(`/admin/marketplace/${result.id}/`);
      else router.refresh();
    });
  }

  function remove() {
    if (
      !vehicle.id ||
      !window.confirm(`Delete “${vehicle.title}”? This can’t be undone.`)
    )
      return;
    start(async () => {
      const result = await deleteVehicle(vehicle.id!);
      if ("error" in result)
        return setMessage({ ok: false, text: result.error ?? "" });
      router.push("/admin/marketplace/");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <div className={panel}>
          <input
            value={vehicle.title}
            onChange={(e) =>
              update({
                title: e.target.value,
                ...(slugTouched ? {} : { slug: slugify(e.target.value) }),
              })
            }
            placeholder="Buick Skylark 1969"
            aria-label="Title"
            className="text-ink w-full text-2xl font-black outline-none placeholder:text-[#bbb]"
          />
          <label className="text-muted flex items-center gap-1 text-sm">
            rotta.mt/marketplace/
            <input
              value={vehicle.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update({ slug: e.target.value });
              }}
              aria-label="URL slug"
              className="min-w-0 flex-1 rounded border border-transparent px-1 py-0.5 hover:border-[#ddd] focus:border-[#999] focus:outline-none"
            />
            /
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className={label}>Price</span>
              <input
                {...text("price")}
                placeholder="€42,500"
                className={field}
              />
            </label>
            <label>
              <span className={label}>Year</span>
              <input {...text("year")} placeholder="1969" className={field} />
            </label>
            <label>
              <span className={label}>Condition</span>
              <input
                {...text("condition")}
                placeholder="Excellent"
                className={field}
              />
            </label>
          </div>
          <label className="block">
            <span className={label}>Description</span>
            <textarea rows={8} {...text("description")} className={field} />
            <span className="text-muted text-xs">
              Line breaks are kept as typed.
            </span>
          </label>
          <label className="block">
            <span className={label}>Seller details</span>
            <textarea
              rows={5}
              {...text("sellerDetails")}
              placeholder={"Jason Camilleri\nPieta\n+356 9999 9999"}
              className={field}
            />
            <span className="text-muted text-xs">
              One item per line; the first line is shown in bold.
            </span>
          </label>
        </div>

        <div className={panel}>
          <h2 className="text-ink font-black">Vehicle details</h2>
          <p className="text-muted -mt-2 text-sm">
            Ticked items show as icons on the page.
          </p>
          <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
            {VEHICLE_FEATURES.map(({ key, label: name }) => {
              const f = vehicle.features[key] ?? { value: "", show: false };
              return (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label={`Show ${name}`}
                    checked={f.show}
                    onChange={(e) =>
                      setFeature(key, { show: e.target.checked })
                    }
                  />
                  <span className="w-32 shrink-0 text-sm">{name}</span>
                  {key === "transmission" || key === "body_type" ? (
                    <select
                      aria-label={name}
                      value={f.value}
                      onChange={(e) =>
                        setFeature(key, { value: e.target.value })
                      }
                      className={field}
                    >
                      <option value="">Choose…</option>
                      {(key === "transmission"
                        ? TRANSMISSIONS.map((t) => ({
                            value: t,
                            label: t[0].toUpperCase() + t.slice(1),
                          }))
                        : BODY_TYPES
                      ).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-label={name}
                      value={f.value}
                      onChange={(e) =>
                        setFeature(key, { value: e.target.value })
                      }
                      className={field}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={panel}>
          <div className="flex items-center justify-between">
            <h2 className="text-ink font-black">Photos</h2>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="rounded border border-[#ddd] px-3 py-1 text-sm hover:border-[#999]"
            >
              Add photo
            </button>
          </div>
          {vehicle.photos.length === 0 && (
            <p className="text-muted text-sm">No photos yet.</p>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {vehicle.photos.map((p, i) => (
              <li
                key={p.id}
                className="relative aspect-[4/3] overflow-hidden rounded bg-[#eee]"
              >
                <Image
                  src={mediaUrl(p.path)}
                  alt=""
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1 text-white">
                  <button
                    type="button"
                    aria-label="Move earlier"
                    disabled={i === 0}
                    onClick={() => movePhoto(i, i - 1)}
                    className="disabled:opacity-30"
                  >
                    <FiArrowLeft />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() =>
                      update({
                        photos: vehicle.photos.filter((x) => x.id !== p.id),
                      })
                    }
                  >
                    <FiX />
                  </button>
                  <button
                    type="button"
                    aria-label="Move later"
                    disabled={i === vehicle.photos.length - 1}
                    onClick={() => movePhoto(i, i + 1)}
                    className="disabled:opacity-30"
                  >
                    <FiArrowRight />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <MediaPicker
            open={picking}
            onClose={() => setPicking(false)}
            onSelect={(media) => {
              if (!vehicle.photos.some((p) => p.id === media.id))
                update({ photos: [...vehicle.photos, media] });
              setPicking(false);
            }}
          />
        </div>
      </div>

      <aside className="space-y-6">
        <div className={panel}>
          <label className="block">
            <span className={label}>Status</span>
            <select {...text("status")} className={field}>
              <option value="published">Published</option>
              <option value="draft">Draft (hidden)</option>
            </select>
          </label>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="bg-brand hover:text-brand w-full rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black disabled:opacity-60"
          >
            {pending ? "Saving…" : vehicle.id ? "Save" : "Create vehicle"}
          </button>
          {message && (
            <p
              role="status"
              className={`text-sm ${message.ok ? "text-green-700" : "text-coral"}`}
            >
              {message.text}
            </p>
          )}
          {vehicle.id && initial.status === "published" && (
            <Link
              href={`/marketplace/${initial.slug}/`}
              target="_blank"
              className="block text-sm font-semibold hover:underline"
            >
              View vehicle
            </Link>
          )}
          {vehicle.id && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="text-coral text-sm hover:underline"
            >
              Delete vehicle
            </button>
          )}
        </div>

        <div className={panel}>
          <h2 className="text-ink font-black">Listing card</h2>
          <label className="block">
            <span className={label}>Card title</span>
            <input
              {...text("cardTitle")}
              placeholder={vehicle.title}
              className={field}
            />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label>
              <span className={label}>Sale status</span>
              <input
                {...text("listingStatus")}
                placeholder="For Sale"
                list="listing-statuses"
                className={field}
              />
              <datalist id="listing-statuses">
                <option value="For Sale" />
                <option value="Sold" />
                <option value="Reserved" />
              </datalist>
            </label>
            <label>
              <span className={label}>Colour</span>
              <input
                type="color"
                value={vehicle.statusColor || "#00876d"}
                onChange={(e) => update({ statusColor: e.target.value })}
                className="h-[38px] w-12 rounded border border-[#ddd]"
              />
            </label>
          </div>
          <label className="block">
            <span className={label}>Listed on</span>
            <input type="date" {...text("listedOn")} className={field} />
          </label>
        </div>

        <div className={panel}>
          <MediaField
            label="Main image"
            hint="The page hero and the listing card."
            value={vehicle.image}
            onChange={(image) => update({ image })}
          />
          <MediaField
            label="“Have a car worth listing?” background"
            hint="Defaults to the main image."
            value={vehicle.cta}
            onChange={(cta) => update({ cta })}
          />
        </div>
      </aside>
    </div>
  );
}
