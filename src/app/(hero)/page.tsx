import { Container } from "@/components/layout/container";
import { NewsletterSignup } from "@/components/newsletter-signup";

// Placeholder hero; the real homepage is built in PR 12.
export default function Home() {
  return (
    <>
      <section className="bg-ink flex min-h-[80vh] items-center pt-[98px] text-white">
        <Container>
          <h1 className="text-[40px] leading-[1.3] font-black capitalize">
            Celebrating Malta&apos;s Automotive Community
          </h1>
          <p className="mt-4">Rebuild in progress.</p>
        </Container>
      </section>
      <NewsletterSignup />
    </>
  );
}
