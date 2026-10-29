import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminHome() {
  const user = await getCurrentUser();
  return (
    <div>
      <h1 className="text-ink text-2xl font-black">Dashboard</h1>
      <p className="mt-2">Welcome, {user?.username ?? user?.email}.</p>
    </div>
  );
}
