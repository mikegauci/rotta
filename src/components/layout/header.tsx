"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { Container } from "@/components/layout/container";
import { CartLink } from "@/components/layout/cart-link";
import { isActive, primaryNav, type NavItem } from "@/lib/navigation";

export type HeaderVariant = "transparent" | "solid";

// Transparent: overlays the page hero with the light logo (home, directory, watch...).
// Solid: white bar with the dark logo (events, shop, posts, legal pages...).
// The URL is runtime data, so the prerendered shell shows the header without
// an active link and the highlighted version streams in.
export function Header({
  variant,
  navigation = primaryNav,
}: {
  variant: HeaderVariant;
  navigation?: NavItem[];
}) {
  return (
    <Suspense
      fallback={
        <HeaderView variant={variant} navigation={navigation} pathname={null} />
      }
    >
      <HeaderWithPath variant={variant} navigation={navigation} />
    </Suspense>
  );
}

function HeaderWithPath({
  variant,
  navigation,
}: {
  variant: HeaderVariant;
  navigation: NavItem[];
}) {
  return (
    <HeaderView
      variant={variant}
      navigation={navigation}
      pathname={usePathname()}
    />
  );
}

function HeaderView({
  variant,
  pathname,
  navigation,
}: {
  variant: HeaderVariant;
  pathname: string | null;
  navigation: NavItem[];
}) {
  // Remember which page the menu was opened on so navigating closes it.
  // Without a pathname (the prerendered fallback) the menu is always closed.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = pathname !== null && openOn === pathname;
  const transparent = variant === "transparent";

  const linkColour = transparent ? "text-white/75" : "text-body";

  return (
    <header
      className={
        transparent ? "absolute inset-x-0 top-0 z-40" : "relative z-40"
      }
    >
      <div className={`py-4 ${transparent ? "" : "bg-white"}`}>
        <Container className="flex items-center">
          <Link href="/" className="shrink-0" aria-label="Rotta home">
            {transparent ? (
              <Image
                src="/brand/logo-light.png"
                alt="Rotta"
                width={430}
                height={278}
                priority
                className="desk:w-[85px] h-auto w-[100px]"
              />
            ) : (
              <Image
                src="/brand/logo-dark.png"
                alt="Rotta"
                width={430}
                height={144}
                priority
                className="h-auto w-[85px]"
              />
            )}
          </Link>

          <nav
            aria-label="Main"
            className="desk:flex ml-auto hidden items-center"
          >
            <ul className="flex items-center">
              {navigation.map((item) => {
                const active = pathname ? isActive(pathname, item.href) : false;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`hover:text-brand block px-5 leading-[64px] transition-colors ${
                        active ? "text-brand font-black" : linkColour
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="leading-[64px]">
                <CartLink />
              </li>
            </ul>
          </nav>

          <div className="desk:ml-0 desk:leading-[64px] ml-auto px-4 leading-[48px]">
            <MyBusinessButton />
          </div>

          <button
            type="button"
            className={`desk:hidden px-2.5 text-[20px] ${
              transparent ? "text-white" : "text-black"
            }`}
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            <span className="sr-only">Main Menu</span>
            <MenuIcon open={open} />
          </button>
        </Container>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="desk:hidden bg-[#f9f9f9]"
        >
          <ul>
            {navigation.map((item) => {
              const active = pathname ? isActive(pathname, item.href) : false;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`hover:text-brand block border-b border-[#ddd] px-5 leading-[44px] ${
                      active ? "text-brand font-black" : "text-black"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="border-b border-[#ddd] px-5 leading-[44px]">
              <CartLink />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function MyBusinessButton() {
  return (
    <Link
      href="/my-business/"
      className="bg-brand hover:text-brand rounded-[10px] px-3.5 py-1 text-base font-bold whitespace-nowrap text-black transition-colors hover:bg-black"
    >
      My Business
    </Link>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="currentColor">
      {open ? (
        <path d="M14.95 6.46 11.41 10l3.54 3.54-1.41 1.41L10 11.42l-3.53 3.53-1.42-1.42L8.58 10 5.05 6.47l1.42-1.42L10 8.58l3.54-3.53z" />
      ) : (
        <path d="M0 3h20v2H0zm0 6h20v2H0zm0 6h20v2H0z" />
      )}
    </svg>
  );
}
