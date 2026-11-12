// Runtime half of the redirects. Rules known at build time (the `redirects`
// table and the retired WordPress URLs) are served by `redirects()` in
// next.config.ts, at the CDN and without running any code. Rules added since
// the last deploy (CMS slug renames, new admin redirects) are caught here,
// at the point where a page would otherwise answer 404.
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { publicDb } from "@/lib/supabase/public";

type Rule = { destination: string; permanent: boolean };

function normalize(path: string) {
  const p = path.toLowerCase();
  return p.endsWith("/") ? p : `${p}/`;
}

async function getRedirects(): Promise<Record<string, Rule>> {
  "use cache";
  cacheTag("redirects");
  cacheLife("weeks");
  const { data, error } = await publicDb
    .from("redirects")
    .select("source, destination, permanent");
  if (error) throw error;
  return Object.fromEntries(
    data.map((r) => [
      normalize(r.source),
      { destination: r.destination, permanent: r.permanent },
    ]),
  );
}

// For pages whose content is missing: follow a redirect if one exists for
// this path, otherwise 404.
export async function redirectOrNotFound(pathname: string): Promise<never> {
  const rule = (await getRedirects())[normalize(pathname)];
  if (rule && normalize(rule.destination) !== normalize(pathname)) {
    if (rule.permanent) permanentRedirect(rule.destination);
    redirect(rule.destination);
  }
  notFound();
}
