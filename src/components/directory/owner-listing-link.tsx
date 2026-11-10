"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Runs in the browser so listing pages stay fully prerendered: a server-side
// session check here would cost a function run on every visit, crawlers
// included. Visitors without a session cookie make no request at all.
export function OwnerListingLink({ businessId }: { businessId: string }) {
  const [owns, setOwns] = useState(false);

  useEffect(() => {
    if (!document.cookie.includes("-auth-token")) return;
    let cancelled = false;
    (async () => {
      const db = createClient();
      const { data: session } = await db.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) return;
      // RLS applies; this only decides whether to show a link.
      const { data } = await db
        .from("businesses")
        .select("id")
        .eq("id", businessId)
        .eq("owner_id", userId)
        .maybeSingle();
      if (data && !cancelled) setOwns(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (!owns) return null;
  return (
    <Link href="/my-business/?edit=1" className="text-brand hover:underline">
      Edit your listing
    </Link>
  );
}
