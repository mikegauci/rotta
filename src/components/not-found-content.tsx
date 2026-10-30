import Link from "next/link";

const routes = [
  {
    label: "Directory",
    href: "/directory/",
    text: "Find garages, parts and services",
  },
  { label: "Watch", href: "/watch/", text: "Stories from Malta's car scene" },
  { label: "Events", href: "/events/", text: "Meets, shows and drives" },
  { label: "Shop", href: "/shop/", text: "Official Rotta merchandise" },
  { label: "Blog", href: "/blog/", text: "Features and news" },
];

// The 404 body. Rendered inside a SiteShell by app/not-found.tsx (unmatched
// URLs) and by (plain)/not-found.tsx, whose layout already supplies the shell.
export function NotFoundContent() {
  return (
    <div className="desk:pt-14 mx-auto max-w-[1240px] px-5 pt-10 pb-20">
      <section className="bg-ink desk:pt-20 desk:pb-36 relative overflow-hidden rounded-[20px] px-6 pt-14 pb-28 text-center text-white">
        <p
          aria-hidden
          className="desk:text-[340px] pointer-events-none absolute inset-x-0 top-1/2 -translate-y-[60%] text-[160px] leading-none font-black tracking-tighter text-white/[0.04] select-none"
        >
          404
        </p>

        <div className="relative">
          <span className="bg-brand mb-6 inline-block rounded-full px-4 py-1 text-xs font-bold tracking-[0.2em] text-black uppercase">
            Error 404
          </span>
          <h1 className="desk:text-[56px] mx-auto mb-4 max-w-[720px] text-[34px] leading-[1.1] font-extrabold">
            Looks like you took a{" "}
            <span className="text-brand">wrong turn.</span>
          </h1>
          <p className="text-footer-muted mx-auto mb-9 max-w-[520px] text-base">
            The page you&rsquo;re after has moved, been renamed or never
            existed. Let&rsquo;s get you back on the road.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="bg-brand rounded-[10px] px-6 py-3 text-base font-bold text-black transition-colors hover:bg-white"
            >
              Back to the homepage
            </Link>
            <Link
              href="/contact-us/"
              className="hover:border-brand hover:text-brand rounded-[10px] border border-white/30 px-6 py-3 text-base font-semibold transition-colors"
            >
              Contact us
            </Link>
          </div>
        </div>

        {/* The road: asphalt strip with a dashed centre line. */}
        <div
          aria-hidden
          className="desk:h-20 absolute inset-x-0 bottom-0 h-16 border-t border-white/10 bg-[#111]"
        >
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-[repeating-linear-gradient(90deg,var(--color-brand)_0_36px,transparent_36px_72px)] opacity-80" />
        </div>
      </section>

      <nav aria-label="Popular sections" className="mt-12">
        <h2 className="text-heading mb-5 text-center text-lg font-semibold">
          Or pick a route
        </h2>
        <ul className="desk:grid-cols-5 grid gap-3 sm:grid-cols-2">
          {routes.map((route) => (
            <li key={route.href}>
              <Link
                href={route.href}
                className="group hover:border-brand block h-full rounded-[14px] border border-[#e5e5e5] p-5 transition-colors"
              >
                <span className="text-heading mb-1 flex items-center justify-between font-bold">
                  {route.label}
                  <span
                    aria-hidden
                    className="text-brand transition-transform group-hover:translate-x-1"
                  >
                    &rarr;
                  </span>
                </span>
                <span className="text-muted text-sm">{route.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
