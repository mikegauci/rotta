"use client";

import { useActionState } from "react";
import { changeRole } from "@/app/(admin)/admin/users/actions";
import type { Enums } from "@/lib/supabase/database.types";

const labels: Record<Enums<"app_role">, string> = {
  admin: "Admin",
  business_owner: "Business owner",
  customer: "Customer",
};

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Enums<"app_role">;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(changeRole, undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <select
        name="role"
        defaultValue={role}
        disabled={disabled || pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-[#ddd] bg-white px-2 py-1 text-sm disabled:opacity-60"
        aria-label="Role"
      >
        {Object.entries(labels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {state?.error && (
        <span className="text-coral text-xs">{state.error}</span>
      )}
      {state?.ok && <span className="text-teal text-xs">Saved</span>}
    </form>
  );
}
