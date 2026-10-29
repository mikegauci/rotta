import { CartPage } from "@/components/shop/cart-page";
export const metadata = { title: "Cart", robots: { index: false } };
export default function Page() {
  return <CartPage checkout={false} />;
}
