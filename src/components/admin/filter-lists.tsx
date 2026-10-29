"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteTerm,
  saveTerm,
  type TermInput,
} from "@/app/(admin)/admin/directory/actions";
import { MediaField, type PickedMedia } from "@/components/admin/media-picker";

export type AdminTerm = {
  id: string;
  kind: TermInput["kind"];
  label: string;
  sortOrder: number;
  icon: PickedMedia | null;
  uses: number;
};

const KINDS: [TermInput["kind"], string][] = [
  ["vehicle", "Step 1 · Vehicles"],
  ["era", "Step 2 · Era"],
  ["service", "Step 3 · Parts/Services"],
  ["region", "Step 4 · Regions"],
];

const field =
  "rounded border border-[#ddd] bg-white px-3 py-1.5 text-sm focus:border-[#999] focus:outline-none";

function TermRow({
  term,
}: {
  term: AdminTerm | (Omit<AdminTerm, "id"> & { id: null });
}) {
  const router = useRouter();
  const [label, setLabel] = useState(term.label);
  const [sortOrder, setSortOrder] = useState(term.sortOrder);
  const [icon, setIcon] = useState(term.icon);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const isNew = term.id === null;
  const dirty =
    label !== term.label ||
    sortOrder !== term.sortOrder ||
    icon?.id !== term.icon?.id;

  function save() {
    start(async () => {
      const result = await saveTerm({
        id: term.id,
        kind: term.kind,
        label,
        sortOrder,
        iconMediaId: icon?.id ?? null,
      });
      if ("error" in result) return setMessage(result.error ?? "Error");
      setMessage(null);
      if (isNew) {
        setLabel("");
        setIcon(null);
      }
      router.refresh();
    });
  }

  function remove() {
    if (
      !window.confirm(
        term.uses
          ? `Remove “${term.label}”? ${term.uses} listings will lose it.`
          : `Remove “${term.label}”?`,
      )
    )
      return;
    start(async () => {
      const result = await deleteTerm(term.id!);
      if ("error" in result) setMessage(result.error ?? "Error");
      else router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-end gap-3 border-b border-[#f3f3f3] py-3 last:border-0">
      <div className="w-28">
        <MediaField label="Icon" value={icon} onChange={setIcon} />
      </div>
      <label className="text-sm">
        <span className="mb-1 block font-semibold">
          {isNew ? "New option" : "Name"}
        </span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={field}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-semibold">Order</span>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className={`${field} w-20`}
        />
      </label>
      <button
        type="button"
        onClick={save}
        disabled={pending || !label.trim() || (!isNew && !dirty)}
        className="bg-brand rounded-[5px] px-4 py-1.5 text-sm font-bold text-black disabled:opacity-40"
      >
        {isNew ? "Add" : "Save"}
      </button>
      {!isNew && (
        <>
          <span className="text-muted text-xs">{term.uses} listings</span>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-coral text-sm hover:underline"
          >
            Remove
          </button>
        </>
      )}
      {message && <p className="text-coral w-full text-sm">{message}</p>}
    </li>
  );
}

// The four filter lists owners pick from and visitors search by.
export function FilterLists({ terms }: { terms: AdminTerm[] }) {
  return (
    <div className="space-y-8">
      {KINDS.map(([kind, title]) => {
        const list = terms.filter((t) => t.kind === kind);
        const next = Math.max(-1, ...list.map((t) => t.sortOrder)) + 1;
        return (
          <section key={kind} className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-ink mb-2 font-black">{title}</h2>
            <ul>
              {list.map((term) => (
                <TermRow
                  key={`${term.id}-${term.label}-${term.sortOrder}`}
                  term={term}
                />
              ))}
              <TermRow
                key={`new-${kind}-${list.length}`}
                term={{
                  id: null,
                  kind,
                  label: "",
                  sortOrder: next,
                  icon: null,
                  uses: 0,
                }}
              />
            </ul>
          </section>
        );
      })}
    </div>
  );
}
