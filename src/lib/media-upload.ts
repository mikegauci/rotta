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

export type UploadResult = {
  uploaded: { id: string; path: string; fileName: string }[];
  failed: string[];
};

// Browser-side: uploads straight to Storage (RLS checks admin), then records
// each file in public.media.
export async function uploadFiles(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<UploadResult> {
  const supabase = createClient();
  const result: UploadResult = { uploaded: [], failed: [] };

  for (const [i, file] of files.entries()) {
    onProgress?.(i, files.length);
    const { base, ext } = slugify(file.name);
    const now = new Date();
    const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    const path = `${folder}/${base}-${crypto.randomUUID().slice(0, 8)}${ext ? `.${ext}` : ""}`;

    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (error) {
      result.failed.push(`${file.name}: ${error.message}`);
      continue;
    }

    const size = await imageSize(file);
    const recorded = await recordUpload({
      path,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      width: size?.width ?? null,
      height: size?.height ?? null,
    });
    if ("error" in recorded)
      result.failed.push(`${file.name}: ${recorded.error}`);
    else result.uploaded.push({ id: recorded.id, path, fileName: file.name });
  }
  return result;
}
