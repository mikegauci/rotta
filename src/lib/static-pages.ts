import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicDb } from "@/lib/supabase/public";

export async function getStaticPage(path: string) {
  "use cache";
  cacheTag("pages", `page:${path}`);
  cacheLife("hours");
  const { data, error } = await publicDb
    .from("pages")
    .select("*")
    .eq("path", path)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data;
}
