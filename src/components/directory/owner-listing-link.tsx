import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// Keep session reads out of the cached public listing and isolate them in Suspense.
export async function OwnerListingLink({ businessId }: { businessId: string }) {
  const user = await getCurrentUser();
  if (!user || !["business_owner", "admin"].includes(user.role)) return null;

  const db = await createClient();
  const { data, error } = await db
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return (
    <Link href="/my-business/?edit=1" className="text-brand hover:underline">
      Edit your listing
    </Link>
  );
}
