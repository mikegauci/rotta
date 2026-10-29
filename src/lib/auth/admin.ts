import "server-only";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";

// For Server Actions: re-check the session instead of trusting the page gate.
export async function assertAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") throw new Error("Not authorised");
  return user;
}
