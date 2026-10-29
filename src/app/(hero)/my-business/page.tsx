import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { signOut } from "@/lib/auth/actions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My Business" };

// Reads the session on every request, so skip instant-navigation validation.
export const instant = false;

// Placeholder: the listing form and owner dashboard arrive with the Directory PR.
export default function MyBusinessPage() {
  return (
    <section className="bg-[#131a1d] pt-[180px] pb-[100px] text-white">
      <Container>
        <Suspense>
          <Dashboard />
        </Suspense>
      </Container>
    </section>
  );
}

async function Dashboard() {
  const user = await requireRole(["business_owner", "admin"], "/my-business/");
  return (
    <>
      <h1 className="text-[28px] font-black">My Business</h1>
      <p className="mt-2">
        Signed in as {user.fullName ?? user.username ?? user.email}.
      </p>
      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="bg-brand hover:text-brand rounded-[5px] px-5 py-2.5 font-bold text-white hover:bg-black"
        >
          Log out
        </button>
      </form>
    </>
  );
}
