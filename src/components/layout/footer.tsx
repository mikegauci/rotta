import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { Container } from "@/components/layout/container";
import { primaryNav, socialLinks } from "@/lib/navigation";

const socialIcons = {
  Facebook: FaFacebook,
  YouTube: FaYoutube,
  Instagram: FaInstagram,
  LinkedIn: FaLinkedin,
};

export type FooterPost = { title: string; href: string };

export function Footer({ recentPosts }: { recentPosts: FooterPost[] }) {
  return (
    <footer className="bg-ink text-white">
      <div className="py-[70px]">
        <Container>
          <div className="grid gap-10 md:-mx-5 md:grid-cols-4 md:gap-0">
            <div className="md:px-5">
              <Image
                src="/brand/logo-footer.png"
                alt="Rotta"
                width={600}
                height={196}
                className="mb-[23px] h-auto w-[110px]"
              />
              <p>
                Celebrating the local automotive culture by ‘Sharing a Passion’
                for art in motion.
              </p>
            </div>

            <FooterColumn title="Quick Links">
              <ul>
                {primaryNav.map((item) => (
                  <li key={item.href}>
                    <FooterLink href={item.href}>{item.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </FooterColumn>

            <FooterColumn title="Recent Posts">
              <ul>
                {recentPosts.map((post) => (
                  <li key={post.href}>
                    <FooterLink href={post.href}>{post.title}</FooterLink>
                  </li>
                ))}
              </ul>
            </FooterColumn>

            <FooterColumn title="Follow Us">
              <div className="flex">
                {socialLinks.map(({ label, href }) => {
                  const Icon = socialIcons[label];
                  return (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="text-footer hover:text-brand mr-2 transition-colors"
                    >
                      <Icon className="size-[25px]" aria-hidden />
                    </a>
                  );
                })}
              </div>
            </FooterColumn>
          </div>
        </Container>
      </div>

      <div className="text-footer-muted py-5 leading-[27px]">
        <Container>
          Rotta Media <CopyrightYear /> © All rights reserved
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="md:px-5">
      <h2 className="text-footer mb-5 text-[20px] leading-[30px]">{title}</h2>
      {children}
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-footer hover:text-brand transition-colors duration-300"
    >
      {children}
    </Link>
  );
}

// Cached so the footer can still be prerendered; refreshes daily.
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
