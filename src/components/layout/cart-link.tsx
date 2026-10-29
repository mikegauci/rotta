"use client";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/shop/cart";
export function CartLink() {
  const { items, open } = useCart();
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  return (
    <button
      onClick={open}
      className="text-brand inline-flex items-center gap-1.5 text-base"
      aria-label={`Cart, subtotal ${formatPrice(subtotal)}`}
    >
      <HiOutlineShoppingBag className="size-[1.1em]" aria-hidden />
      <span>{formatPrice(subtotal)}</span>
    </button>
  );
}
