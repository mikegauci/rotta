export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// First path segments owned by routes in code. Posts live at /<slug>/, so
// they can't take any of these.
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "author",
  "blog",
  "cart",
  "category",
  "checkout",
  "contact-us",
  "directory",
  "events",
  "login",
  "marketplace",
  "my-account",
  "my-business",
  "page",
  "preview",
  "privacy-policy",
  "product",
  "reset-password",
  "shop",
  "tag",
  "update-password",
  "user-registration",
  "watch",
]);
