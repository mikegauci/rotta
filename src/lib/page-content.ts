// Existing imported HTML is retained until an editor explicitly enables it.
export const PAGE_CONTENT_AREAS: Record<string, string> = {
  "": "Homepage sections, above the contact form",
  blog: "Blog introduction, above the post grid",
  "contact-us": "Contact introduction, above the contact form",
  directory: "Directory introduction, above the search tools",
  events: "Introduction, above the events calendar",
  watch: "Watch introduction, above the video series",
  marketplace: "Marketplace introduction, above the vehicles",
  shop: "Introduction, above the product catalogue",
};
export function pageContentMode(path: string) {
  if (path in PAGE_CONTENT_AREAS) return "section";
  if (
    [
      "cart",
      "checkout",
      "login",
      "my-business",
      "reset-password",
      "user-registration",
      "update-password",
      "my-account",
    ].includes(path)
  )
    return "seo";
  return "page";
}
export function hasManagedContent(seo: unknown): boolean {
  return Boolean(
    seo &&
    typeof seo === "object" &&
    "managed_content" in seo &&
    seo.managed_content === true,
  );
}
