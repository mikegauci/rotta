import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHome() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const [users, media] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("media").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Users", value: users.count ?? 0, href: "/admin/users/" },
    { label: "Media files", value: media.count ?? 0, href: "/admin/media/" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.username ?? user?.email}.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow"
          >
            <p className="text-muted text-sm">{stat.label}</p>
            <p className="text-ink mt-1 text-3xl font-black">{stat.value}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
