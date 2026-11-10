import { mediaUrl } from "@/lib/media";
import { publicDb } from "@/lib/supabase/public";

// Old WordPress upload links (/wp-content/uploads/2021/03/photo-1024x683.jpg)
// redirect to the migrated file in Storage. Images were re-encoded as WebP
// and WordPress size variants were not imported, so both are tried.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/wp-content/uploads/[...path]">,
) {
  const rel = (await params).path.join("/");
  const original = rel.replace(/-\d+x\d+(\.\w+)$/, "$1");
  const candidates = [...new Set([rel, original])].flatMap((p) => [
    `wp/${p}`,
    `wp/${p.replace(/\.(jpe?g|png)$/i, ".webp")}`,
  ]);
  const { data } = await publicDb
    .from("media")
    .select("path")
    .in("path", candidates)
    .limit(candidates.length);
  const found = candidates.find((c) => data?.some((m) => m.path === c));
  // Crawlers keep asking for the same old URLs: let the CDN answer repeats.
  if (!found)
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=0, s-maxage=86400" },
    });
  return new Response(null, {
    status: 301,
    headers: {
      Location: mediaUrl(found),
      "Cache-Control": "public, max-age=86400, s-maxage=31536000",
    },
  });
}
