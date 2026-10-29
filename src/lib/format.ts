const euro = new Intl.NumberFormat("en-MT", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(cents: number) {
  return euro.format(cents / 100);
}

// "July 22, 2024", as WordPress shows post dates.
export function formatPostDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Europe/Malta",
  }).format(new Date(iso));
}
