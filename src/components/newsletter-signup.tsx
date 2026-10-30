import { FiArrowRight } from "react-icons/fi";

import { Container } from "@/components/layout/container";

// Shown above the footer on home, directory, watch, blog and contact pages.
// The form is not wired up yet (newsletter is the last item in the plan).
export function NewsletterSignup() {
  return (
    <section className="bg-ink py-[50px] text-center">
      <Container className="max-w-[1140px]">
        <h2 className="mb-[15px] text-[45px] leading-[1.1] font-black text-white">
          Don’t miss out
        </h2>
        <p className="text-muted text-base">
          Subscribe and keep updated with the latest uploads
        </p>
        <form
          className="mx-auto my-5 flex w-full max-w-[426px] min-w-0"
          action="#"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            placeholder="Email"
            className="h-12 min-w-0 flex-1 bg-white/15 p-3 text-base font-semibold text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Subscribe"
            className="flex h-12 w-12 shrink-0 items-center justify-center bg-white text-black"
          >
            <FiArrowRight className="size-5" aria-hidden="true" />
          </button>
        </form>
      </Container>
    </section>
  );
}
