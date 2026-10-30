"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MediaField, type PickedMedia } from "@/components/admin/media-picker";
import type { BusinessInput } from "@/lib/business-input";
import { MEDIA_BUCKET, mediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { LogoPlaceholder } from "@/components/directory/logo-placeholder";

export type TermOption = { id: string; label: string };
export type TermGroups = {
  vehicle: TermOption[];
  era: TermOption[];
  service: TermOption[];
  region: TermOption[];
};

export type BusinessFormValue = Omit<BusinessInput, "logoMediaId"> & {
  logo: PickedMedia | null;
};

const DAY_LABELS = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
] as const;

const GROUPS: [keyof TermGroups, string][] = [
  ["vehicle", "My business works on the following vehicles"],
  ["era", "My business works on the following era:"],
  ["service", "Include Services"],
  ["region", "Which area are you located?"],
];

const input =
  "w-full rounded-[3px] border border-[#ddd] bg-white px-3 py-2 text-sm text-[#3a3a3a] focus:border-brand focus:outline-none";
const label = "mb-1 block text-sm font-bold text-[#3a3a3a]";

// Shrinks a logo in the browser before upload (keeps Storage small).
async function toWebp(file: File, max = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not read image")),
      "image/webp",
      0.8,
    ),
  );
}

function OwnerLogo({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value: PickedMedia | null;
  onChange: (media: PickedMedia | null) => void;
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/"))
      return setStatus("Choose an image file.");
    setStatus("Uploading…");
    try {
      const blob = await toWebp(file);
      const bitmap = await createImageBitmap(blob);
      const path = `business/${userId}/logo-${crypto.randomUUID().slice(0, 8)}.webp`;
      const db = createClient();
      const uploaded = await db.storage.from(MEDIA_BUCKET).upload(path, blob, {
        contentType: "image/webp",
        cacheControl: "31536000",
      });
      if (uploaded.error) throw uploaded.error;
      const { data, error } = await db
        .from("media")
        .insert({
          path,
          file_name: file.name,
          mime_type: "image/webp",
          size_bytes: blob.size,
          width: bitmap.width,
          height: bitmap.height,
          uploaded_by: userId,
        })
        .select("id, path, width, height, alt")
        .single();
      if (error) throw error;
      onChange(data);
      setStatus(null);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  return (
    <div>
      <p className={label}>Business Logo</p>
      <div className="flex items-center gap-4">
        <div className="grid size-[100px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[#eee]">
          {value ? (
            <Image
              src={mediaUrl(value.path)}
              alt=""
              width={100}
              height={100}
              className="size-full object-contain"
            />
          ) : (
            <LogoPlaceholder />
          )}
        </div>
        <div className="space-y-2 text-sm">
          <label className="bg-brand inline-block cursor-pointer rounded-[5px] px-4 py-2 font-bold text-black">
            {value ? "Change logo" : "Upload logo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-coral block hover:underline"
            >
              Remove
            </button>
          )}
          {status && <p className="text-muted">{status}</p>}
        </div>
      </div>
    </div>
  );
}

export function BusinessForm({
  initial,
  terms,
  logoOwner,
  onSave,
  submitLabel = "Submit",
  successHref,
  children,
}: {
  initial: BusinessFormValue;
  terms: TermGroups;
  // Owners upload into their own folder; admins pick from the library.
  logoOwner: string | null;
  onSave: (input: BusinessInput) => Promise<{ error?: string } | object>;
  submitLabel?: string;
  successHref?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [secondPhone, setSecondPhone] = useState(Boolean(initial.phone2));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();

  const set = (patch: Partial<BusinessFormValue>) => {
    setValue((v) => ({ ...v, ...patch }));
    setMessage(null);
  };
  const text = (key: keyof BusinessFormValue) => ({
    value: String(value[key] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set({ [key]: e.target.value } as Partial<BusinessFormValue>),
  });

  function setHours(
    day: string,
    patch: { open?: string; close?: string } | null,
  ) {
    const current = value.openingHours[day as keyof typeof value.openingHours];
    set({
      openingHours: {
        ...value.openingHours,
        [day]:
          patch === null ? null : { open: "", close: "", ...current, ...patch },
      },
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const { logo, ...rest } = value;
      const hours = Object.fromEntries(
        Object.entries(rest.openingHours).map(([day, h]) => [
          day,
          h && h.open && h.close ? h : null,
        ]),
      );
      const result = await onSave({
        ...rest,
        phone2: secondPhone ? rest.phone2 : "",
        openingHours: hours,
        logoMediaId: logo?.id ?? null,
      });
      setMessage(
        "error" in result && result.error
          ? { ok: false, text: result.error }
          : { ok: true, text: "Your listing has been saved." },
      );
      if (!("error" in result && result.error) && successHref) {
        router.push(successHref);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {children}

      {logoOwner ? (
        <OwnerLogo
          userId={logoOwner}
          value={value.logo}
          onChange={(logo) => set({ logo })}
        />
      ) : (
        <div className="max-w-xs">
          <MediaField
            label="Business Logo"
            value={value.logo}
            onChange={(logo) => set({ logo })}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <label>
          <span className={label}>Business Name *</span>
          <input required maxLength={120} {...text("name")} className={input} />
        </label>
        <label>
          <span className={label}>Location</span>
          <input
            {...text("location")}
            placeholder="e.g. Birkirkara"
            className={input}
          />
        </label>
        <label>
          <span className={label}>Short Description *</span>
          <input
            required
            maxLength={200}
            {...text("shortDescription")}
            className={input}
          />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {GROUPS.map(([kind, title]) => (
          <fieldset key={kind}>
            <legend className={label}>{title}</legend>
            <div
              className={`grid gap-x-4 gap-y-1 ${kind === "service" ? "sm:grid-cols-2" : ""}`}
            >
              {terms[kind].map((term) => (
                <label
                  key={term.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={value.termIds.includes(term.id)}
                    onChange={(e) =>
                      set({
                        termIds: e.target.checked
                          ? [...value.termIds, term.id]
                          : value.termIds.filter((id) => id !== term.id),
                      })
                    }
                    className="accent-brand size-4"
                  />
                  {term.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-[28px] font-normal">Details</h2>
        <label className="block">
          <span className={label}>Business Description</span>
          <textarea rows={6} {...text("description")} className={input} />
        </label>
        <label className="block">
          <span className={label}>Location Address</span>
          <input {...text("address")} className={input} />
        </label>
      </div>

      <fieldset>
        <legend className={label}>Opening hours</legend>
        <div className="space-y-2">
          {DAY_LABELS.map(([day, name]) => {
            const hours = value.openingHours[day];
            const weekend = day === "sat" || day === "sun";
            const open = weekend ? hours !== null && hours !== undefined : true;
            return (
              <div
                key={day}
                className="flex flex-wrap items-center gap-3 text-sm"
              >
                <span className="w-24 font-bold">{name}</span>
                {weekend && (
                  <span className="flex gap-3">
                    <span className="text-muted">Do you open on {name}?</span>
                    {(["Yes", "No"] as const).map((answer) => (
                      <label key={answer} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`open-${day}`}
                          checked={answer === "Yes" ? open : !open}
                          onChange={() =>
                            setHours(day, answer === "Yes" ? {} : null)
                          }
                          className="accent-brand"
                        />
                        {answer}
                      </label>
                    ))}
                  </span>
                )}
                {open && (
                  <>
                    <label className="flex items-center gap-1">
                      <span className="text-muted">open</span>
                      <input
                        type="time"
                        value={hours?.open ?? ""}
                        onChange={(e) =>
                          setHours(day, { open: e.target.value })
                        }
                        className={`${input} w-auto`}
                      />
                    </label>
                    <label className="flex items-center gap-1">
                      <span className="text-muted">close</span>
                      <input
                        type="time"
                        value={hours?.close ?? ""}
                        onChange={(e) =>
                          setHours(day, { close: e.target.value })
                        }
                        className={`${input} w-auto`}
                      />
                    </label>
                  </>
                )}
              </div>
            );
          })}
          <p className="text-muted text-xs">
            Leave a weekday empty if you’re closed that day.
          </p>
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={label}>Tel/Mob Number</span>
          <input type="tel" {...text("phone")} className={input} />
        </label>
        <div>
          <p className={label}>Add an additional Tel/Mob number?</p>
          <div className="flex gap-4 text-sm">
            {(["Yes", "No"] as const).map((answer) => (
              <label key={answer} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="second-phone"
                  checked={answer === "Yes" ? secondPhone : !secondPhone}
                  onChange={() => setSecondPhone(answer === "Yes")}
                  className="accent-brand"
                />
                {answer}
              </label>
            ))}
          </div>
        </div>
        {secondPhone && (
          <label>
            <span className={label}>2nd Tel/Mob Number</span>
            <input type="tel" {...text("phone2")} className={input} />
          </label>
        )}
        <label>
          <span className={label}>Business email address</span>
          <input type="email" {...text("email")} className={input} />
        </label>
        <label>
          <span className={label}>Website or Facebook URL</span>
          <input
            {...text("website")}
            placeholder="https://"
            className={input}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand hover:text-brand rounded-[5px] px-8 py-2.5 font-bold text-black transition-colors hover:bg-black disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {message && (
          <p
            role="status"
            className={message.ok ? "text-green-700" : "text-coral"}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
