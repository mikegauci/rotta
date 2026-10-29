import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/lib/auth/actions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s - Rotta Admin" },
  robots: { index: false, follow: false },
};

// Reads the session on every request, so skip instant-navigation validation.
export const instant = false;

// Admin area shell. The full CMS navigation comes with PR 6.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f5f5f5]">
      <header className="bg-ink flex items-center justify-between px-6 py-4 text-white">
        <Link href="/admin/" className="font-black">
          Rotta Admin
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="text-footer hover:text-brand text-sm"
          >
            Log out
          </button>
        </form>
      </header>
      <main className="flex-1 p-6">
        <Suspense fallback={<p>Loading…</p>}>
          <AdminOnly>{children}</AdminOnly>
        </Suspense>
      </main>
    </div>
  );
}

async function AdminOnly({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"], "/admin/");
  return children;
}
