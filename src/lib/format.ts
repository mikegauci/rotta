const euro = new Intl.NumberFormat("en-MT", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(cents: number) {
  return euro.format(cents / 100);
}
