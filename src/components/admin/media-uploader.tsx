"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { recordUpload } from "@/app/(admin)/admin/media/actions";
import { MEDIA_BUCKET } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

function slugify(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  return { base: base || "file", ext };
}

function imageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function MediaUploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList) {
    setBusy(true);
    const supabase = createClient();
    const failed: string[] = [];

    for (const [i, file] of [...files].entries()) {
      setStatus(`Uploading ${i + 1} of ${files.length}…`);
      const { base, ext } = slugify(file.name);
      const now = new Date();
      const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
      const path = `${folder}/${base}-${crypto.randomUUID().slice(0, 8)}${ext ? `.${ext}` : ""}`;

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "31536000",
        });
      if (error) {
        failed.push(`${file.name}: ${error.message}`);
        continue;
      }

      const size = await imageSize(file);
      const result = await recordUpload({
        path,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        width: size?.width ?? null,
        height: size?.height ?? null,
      });
      if (result.error) failed.push(`${file.name}: ${result.error}`);
    }

    setBusy(false);
    setStatus(
      failed.length
        ? `Some files failed: ${failed.join("; ")}`
        : "Upload complete.",
    );
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {status && <span className="text-muted text-sm">{status}</span>}
      <label
        className={`bg-brand hover:text-brand cursor-pointer rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        Upload files
        <input
          ref={input}
          type="file"
          multiple
          accept="image/*,video/mp4,application/pdf"
          className="sr-only"
          disabled={busy}
          onChange={(e) =>
            e.currentTarget.files?.length && upload(e.currentTarget.files)
          }
        />
      </label>
    </div>
  );
}
