import Link from "next/link";
import { FaPenNib, FaUser } from "react-icons/fa";
import { Container } from "@/components/layout/container";
import { signOut } from "@/lib/auth/actions";

const button =
  "bg-brand inline-block rounded-[5px] px-5 py-3 text-lg font-black text-black transition-colors hover:bg-black hover:text-brand";

export function BusinessDashboard({
  listing,
}: {
  listing: { slug: string; status: "draft" | "published" };
}) {
  return (
    <section className="desk:pt-[240px] min-h-[85vh] bg-[#131a1d] pt-[180px] pb-[100px] text-white">
      <Container className="desk:grid-cols-3 desk:gap-16 grid items-start gap-8">
        <div>
          <h1 className="mb-6 text-[52px] leading-none font-black md:text-[65px]">
            My
            <br />
            Business
          </h1>
          <form action={signOut}>
            <button type="submit" className={button}>
              Logout
            </button>
          </form>
        </div>
        <div className="text-ink flex min-h-[260px] flex-col items-center justify-center gap-5 rounded-[20px] bg-white p-8 text-center">
          <FaUser className="size-10" aria-hidden />
          {listing.status === "published" ? (
            <Link href={`/directory/${listing.slug}/`} className={button}>
              Visit your page
            </Link>
          ) : (
            <p>
              Your listing is hidden from the directory at the moment. Please
              contact us if you think this is a mistake.
            </p>
          )}
        </div>
        <div className="text-ink flex min-h-[260px] flex-col items-center justify-center gap-5 rounded-[20px] bg-white p-8 text-center">
          <FaPenNib className="size-10" aria-hidden />
          <Link href="/my-business/?edit=1" className={button}>
            Edit your page
          </Link>
        </div>
      </Container>
    </section>
  );
}
