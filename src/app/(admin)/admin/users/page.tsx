import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { RoleSelect } from "@/components/admin/role-select";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users" };

const dateFormat = new Intl.DateTimeFormat("en-MT", { dateStyle: "medium" });

export default async function UsersPage() {
  const me = await getCurrentUser();
  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, username, full_name, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Everyone with an account. Business owners can only manage their own listing."
      />
      {error && (
        <p className="text-coral">Could not load users: {error.message}</p>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="text-muted border-b border-[#eee] text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[#f3f3f3] last:border-0"
              >
                <td className="px-4 py-3">
                  <p className="text-ink font-semibold">
                    {user.full_name ?? "—"}
                  </p>
                  {user.username && (
                    <p className="text-muted text-xs">@{user.username}</p>
                  )}
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {dateFormat.format(new Date(user.created_at))}
                </td>
                <td className="px-4 py-3">
                  <RoleSelect
                    userId={user.id}
                    role={user.role}
                    disabled={user.id === me?.id}
                  />
                </td>
              </tr>
            ))}
            {users?.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted px-4 py-8 text-center">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
