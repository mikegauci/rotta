import { CartPage } from "@/components/shop/cart-page";
export const metadata = { title: "Checkout", robots: { index: false } };
export default function Page() {
  return <CartPage checkout={true} />;
}
