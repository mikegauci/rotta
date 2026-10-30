"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
  ["vehicle", "Vehicle types"],
  ["era", "Vehicle eras"],
  ["service", "Services offered"],
  ["region", "Areas served"],
];

const input =
  "w-full rounded-lg border border-black/20 bg-white px-3 py-3 text-base text-body focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";
const label = "mb-2 block text-sm font-bold text-body";

// Shrinks a logo in the browser before upload (keeps Storage small).
async function toWebp(file: File, max = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
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
  onUploading,
}: {
  userId: string;
  value: PickedMedia | null;
  onChange: (media: PickedMedia | null) => void;
  onUploading: (uploading: boolean) => void;
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/"))
      return setStatus("Choose an image file.");
    if (file.size > 10 * 1024 * 1024)
      return setStatus("Choose an image smaller than 10 MB.");
    setStatus("Uploading…");
    onUploading(true);
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
      bitmap.close();
      setStatus(null);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      onUploading(false);
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload(file);
              }}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-coral block hover:underline"
            >
              Use default logo
            </button>
          )}
          <p className="text-muted text-xs">
            Square images work best. Your logo changes when you save.
          </p>
          {status && (
            <p role="status" className="text-muted">
              {status}
            </p>
          )}
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
  const [saved, setSaved] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [secondPhone, setSecondPhone] = useState(Boolean(initial.phone2));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

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
    if (pending || uploading) return;
    start(async () => {
      setMessage(null);
      try {
        const { logo, ...rest } = value;
        for (const [day, hours] of Object.entries(rest.openingHours)) {
          if (hours && (!hours.open || !hours.close)) {
            setMessage({
              ok: false,
              text: `Add both opening and closing times for ${DAY_LABELS.find(([key]) => key === day)?.[1] ?? day}, or mark it closed.`,
            });
            return;
          }
        }
        const result = await onSave({
          ...rest,
          phone2: secondPhone ? rest.phone2 : "",
          logoMediaId: logo?.id ?? null,
        });
        if ("error" in result && result.error) {
          setMessage({ ok: false, text: result.error });
          return;
        }
        setSaved(value);
        setMessage({ ok: true, text: "Your listing has been saved." });
        if (successHref) {
          router.push(successHref);
          router.refresh();
        }
      } catch {
        setMessage({
          ok: false,
          text: "Could not save your listing. Your changes are still here; please try again.",
        });
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {children}
      {logoOwner && (
        <nav
          aria-label="Business details sections"
          className="flex flex-wrap gap-2 text-sm"
        >
          {[
            ["business-basics", "Overview"],
            ["business-services", "Services"],
            ["business-about", "About"],
            ["business-hours", "Opening hours"],
            ["business-contact", "Contact"],
          ].map(([id, title]) => (
            <a
              key={id}
              href={`#${id}`}
              className="hover:border-brand hover:bg-brand/15 rounded-full border border-black/15 bg-white px-4 py-2 font-semibold"
            >
              {title}
            </a>
          ))}
        </nav>
      )}
      <fieldset
        disabled={pending || uploading}
        className="min-w-0 space-y-6 disabled:opacity-70"
      >
        <FormSection
          id="business-basics"
          title="Business overview"
          hint="Introduce your business. Fields marked * are required."
        >
          {logoOwner ? (
            <OwnerLogo
              userId={logoOwner}
              value={value.logo}
              onChange={(logo) => set({ logo })}
              onUploading={setUploading}
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
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={label}>Business Name *</span>
              <input
                required
                maxLength={120}
                {...text("name")}
                autoComplete="organization"
                className={input}
              />
            </label>
            <label>
              <span className={label}>Location</span>
              <input
                {...text("location")}
                placeholder="e.g. Birkirkara"
                maxLength={120}
                className={input}
              />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Short Description *</span>
              <textarea
                required
                rows={2}
                maxLength={200}
                {...text("shortDescription")}
                placeholder="e.g. Classic car servicing and restoration in Malta"
                aria-describedby="short-description-hint"
                className={input}
              />
              <span
                id="short-description-hint"
                className="text-muted mt-1 flex justify-between gap-3 text-xs"
              >
                <span>A quick summary shown in search results.</span>
                <span>{value.shortDescription.length}/200</span>
              </span>
            </label>
          </div>
        </FormSection>

        <FormSection
          id="business-services"
          title="Services & coverage"
          hint="Choose all options that apply so drivers can find you."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {GROUPS.map(([kind, title]) => (
              <fieldset
                key={kind}
                className={`min-w-0 ${kind === "service" || kind === "region" ? "sm:col-span-2" : ""}`}
              >
                <legend className={label}>{title}</legend>
                {kind === "service" && (
                  <div className="mb-3 space-y-2">
                    <input
                      type="search"
                      aria-label="Filter services"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Find a service, e.g. mechanic"
                      className={input}
                    />
                    <p role="status" className="text-muted text-xs">
                      {
                        terms.service.filter((term) =>
                          value.termIds.includes(term.id),
                        ).length
                      }{" "}
                      services selected
                    </p>
                  </div>
                )}
                <div
                  className={
                    kind === "service"
                      ? "grid max-h-80 gap-x-4 gap-y-1 overflow-y-auto overscroll-contain sm:grid-cols-2"
                      : "grid gap-1 sm:grid-cols-2"
                  }
                >
                  {terms[kind]
                    .filter(
                      (term) =>
                        kind !== "service" ||
                        term.label
                          .toLowerCase()
                          .includes(serviceSearch.trim().toLowerCase()),
                    )
                    .map((term) => (
                      <label
                        key={term.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-black/5"
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
                          className="accent-brand mt-0.5 size-4 shrink-0"
                        />
                        <span className="text-sm">{term.label}</span>
                      </label>
                    ))}
                  {kind === "service" &&
                    !terms.service.some((term) =>
                      term.label
                        .toLowerCase()
                        .includes(serviceSearch.trim().toLowerCase()),
                    ) && (
                      <p className="text-muted py-3 text-sm">
                        No matching services. Try another search.
                      </p>
                    )}
                </div>
              </fieldset>
            ))}
          </div>
        </FormSection>

        <FormSection
          id="business-about"
          title="About your business"
          hint="Help visitors understand what you do and where to find you."
        >
          <label className="block">
            <span className={label}>Business Description</span>
            <textarea
              rows={5}
              maxLength={5000}
              {...text("description")}
              placeholder="Tell drivers about your experience, specialities and services."
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>Location Address</span>
            <input
              maxLength={250}
              {...text("address")}
              autoComplete="street-address"
              placeholder="Street and locality"
              className={input}
            />
          </label>
        </FormSection>

        <FormSection
          id="business-hours"
          title="Opening hours"
          hint="Choose Open or Closed for each day. Open days need both times."
        >
          <div className="divide-y divide-black/10">
            {DAY_LABELS.map(([day, name]) => {
              const hours = value.openingHours[day];
              const open = hours !== null && hours !== undefined;
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4"
                >
                  <span className="w-24 font-bold">{name}</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={open}
                      onChange={(e) =>
                        setHours(day, e.target.checked ? {} : null)
                      }
                      className="accent-brand size-4"
                      aria-label={`Open on ${name}`}
                    />
                    {open ? "Open" : "Closed"}
                  </label>
                  {open && (
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-muted">From</span>
                        <input
                          required
                          type="time"
                          aria-label={`${name} opening time`}
                          value={hours?.open ?? ""}
                          onChange={(e) =>
                            setHours(day, { open: e.target.value })
                          }
                          className={`${input} w-auto`}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-muted">To</span>
                        <input
                          required
                          type="time"
                          aria-label={`${name} closing time`}
                          value={hours?.close ?? ""}
                          onChange={(e) =>
                            setHours(day, { close: e.target.value })
                          }
                          className={`${input} w-auto`}
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FormSection>

        <FormSection
          id="business-contact"
          title="Contact details"
          hint="These details are public. Add the best ways for customers to reach you."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={label}>Tel/Mob Number</span>
              <input
                type="tel"
                autoComplete="tel"
                maxLength={40}
                {...text("phone")}
                className={input}
              />
            </label>
            {secondPhone ? (
              <div>
                <label>
                  <span className={label}>2nd Tel/Mob Number</span>
                  <input
                    type="tel"
                    maxLength={40}
                    {...text("phone2")}
                    className={input}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSecondPhone(false);
                    set({ phone2: "" });
                  }}
                  className="text-muted hover:text-ink mt-2 text-sm font-semibold"
                >
                  Remove additional number
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSecondPhone(true)}
                className="hover:border-brand self-end rounded-lg border border-black/20 px-4 py-3 text-sm font-semibold"
              >
                + Add another phone number
              </button>
            )}
            <label>
              <span className={label}>Business email address</span>
              <input
                type="email"
                autoComplete="email"
                maxLength={200}
                {...text("email")}
                className={input}
              />
            </label>
            <label>
              <span className={label}>Website or Facebook URL</span>
              <input
                {...text("website")}
                maxLength={300}
                placeholder="https://"
                className={input}
              />
            </label>
          </div>
        </FormSection>
      </fieldset>

      <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-lg">
        <div className="min-w-0 flex-1">
          {message ? (
            <p
              role={message.ok ? "status" : "alert"}
              className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}
            >
              {message.text}
            </p>
          ) : (
            <p role="status" className="text-muted text-sm">
              {uploading
                ? "Uploading your logo…"
                : dirty
                  ? "You have unsaved changes."
                  : initial.name
                    ? "Your details are up to date."
                    : "Add your business details, then publish."}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending || uploading}
          className="bg-brand hover:bg-ink hover:text-brand rounded-lg px-6 py-3 font-bold text-black transition-colors disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-8 space-y-5 rounded-xl border border-black/10 bg-white p-5 sm:p-7"
    >
      <div>
        <h2 className="text-ink text-xl font-black">{title}</h2>
        <p className="text-muted mt-1 text-sm">{hint}</p>
      </div>
      {children}
    </section>
  );
}
