export type NavItem = { label: string; href: string };

// Marketplace is intentionally left out of the menus (pages stay reachable by URL).
export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Directory", href: "/directory/" },
  { label: "Watch", href: "/watch/" },
  { label: "Events", href: "/events/" },
  { label: "Shop", href: "/shop/" },
  { label: "Blog", href: "/blog/" },
  { label: "Contact Us", href: "/contact-us/" },
];

export const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/rottamedia/" },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCnAE_OMHV3VxcbrXq4_v-7g",
  },
  { label: "Instagram", href: "https://www.instagram.com/rottamedia/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/rottamedia/" },
] as const;

export function isActive(pathname: string, href: string) {
  const normalise = (p: string) => p.replace(/\/+$/, "") || "/";
  const path = normalise(pathname);
  const target = normalise(href);
  return target === "/"
    ? path === "/"
    : path === target || path.startsWith(`${target}/`);
}

export function siteNavigation(lines?: string): NavItem[] {
  const items = (lines || "")
    .split("\n")
    .map((line) => {
      const [label, href] = line.split("|").map((s) => s.trim());
      return { label, href };
    })
    .filter((item) => item.label && /^\/(?!\/)[^\s]*$/.test(item.href));
  return items.length ? items : primaryNav;
}
