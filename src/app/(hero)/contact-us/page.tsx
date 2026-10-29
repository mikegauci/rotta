import type { Metadata } from "next";
import { ContactForm } from "@/components/get-in-touch";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { Container } from "@/components/layout/container";
import { mediaUrl } from "@/lib/media";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Leave us a message with any questions you have.",
};

export default function ContactPage() {
  return (
    <>
      <section
        className="bg-ink relative overflow-hidden px-5 py-[180px] text-white"
        style={{
          backgroundImage: `linear-gradient(rgb(0 0 0 / 35%), rgb(0 0 0 / 35%)), url(${mediaUrl("wp/2021/01/Ferrari-250GT-1-1024x669-1.webp")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative mx-auto max-w-[1140px]">
          <h1 className="mb-[15px] text-[40px] leading-[1.3] font-black">
            Get In Touch
          </h1>
          <p className="text-base leading-6">
            Leave us a message with any questions you have.
          </p>
        </div>
      </section>
      <Container className="max-w-[1210px] py-[50px]">
        <ContactForm />
      </Container>
      <NewsletterSignup />
    </>
  );
}
