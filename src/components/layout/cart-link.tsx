import Link from "next/link";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { formatPrice } from "@/lib/format";

// The subtotal is wired to the real cart in the Shop PR.
export function CartLink({ subtotalCents = 0 }: { subtotalCents?: number }) {
  return (
    <Link
      href="/cart/"
      className="text-brand hover:text-brand inline-flex items-center gap-1.5 text-base"
      aria-label={`Cart, subtotal ${formatPrice(subtotalCents)}`}
    >
      <HiOutlineShoppingBag className="size-[1.1em]" aria-hidden />
      <span>{formatPrice(subtotalCents)}</span>
    </Link>
  );
}
