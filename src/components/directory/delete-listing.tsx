"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteListing({
  name,
  onDelete,
}: {
  name: string;
  onDelete: () => Promise<{ error: string } | { deleted: true }>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function remove() {
    start(async () => {
      setError(null);
      try {
        const result = await onDelete();
        if ("error" in result) return setError(result.error);
        dialog.current?.close();
        router.replace("/my-business/?deleted=1");
        router.refresh();
      } catch {
        setError("Could not delete your listing. Please try again.");
      }
    });
  }

  return (
    <section
      id="delete-listing"
      className="mt-12 scroll-mt-8 rounded-xl border border-red-200 bg-white p-6"
    >
      <h2 className="text-ink text-lg font-bold">Delete listing</h2>
      <p className="text-muted mt-2 text-sm">
        Remove your business page from the directory. Your account will stay
        active.
      </p>
      <button
        type="button"
        onClick={() => {
          setError(null);
          dialog.current?.showModal();
        }}
        className="mt-4 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
      >
        Delete my listing
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={title}
        aria-describedby={description}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="text-body fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border-0 bg-white p-6 shadow-xl backdrop:bg-black/60"
      >
        <h2 id={title} className="text-ink text-xl font-black">
          Delete your listing?
        </h2>
        <p id={description} className="mt-3 text-sm leading-6">
          “{name}” will be removed from the directory, including its details and
          selected services. This cannot be undone. Your account will stay
          active, and you can create a new listing.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            autoFocus
            disabled={pending}
            onClick={() => dialog.current?.close()}
            className="rounded-lg border border-black/20 px-4 py-2.5 font-bold disabled:opacity-50"
          >
            Keep listing
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            className="rounded-lg bg-red-700 px-4 py-2.5 font-bold text-white hover:bg-red-800 disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Delete listing"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
