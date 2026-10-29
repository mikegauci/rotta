"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { Constants, type Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type RoleState = { error?: string; ok?: boolean } | undefined;

export async function changeRole(
  _: RoleState,
  formData: FormData,
): Promise<RoleState> {
  const admin = await assertAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "") as Enums<"app_role">;

  if (!Constants.public.Enums.app_role.includes(role))
    return { error: "Unknown role." };
  if (userId === admin.id) return { error: "You can’t change your own role." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", {
    target_user: userId,
    new_role: role,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/users/");
  return { ok: true };
}
