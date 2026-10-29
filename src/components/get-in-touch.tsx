"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Container } from "@/components/layout/container";
import { sendContactMessage } from "@/lib/contact/actions";

const field =
  "block w-full border border-[#ddd] bg-transparent p-3 text-base leading-6 text-[#666] placeholder:text-[#666] focus:border-brand focus:outline-none";

// "Get in Touch" form next to the "Sharing a Passion" slogan.
export function GetInTouch() {
  const [state, action, pending] = useActionState(
    sendContactMessage,
    undefined,
  );

  return (
    <Container className="max-w-[1250px] py-[50px]">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-ink mb-[15px] text-[45px] leading-none font-black md:text-[65px]">
            Get in Touch
          </h2>
          {state?.ok ? (
            <p role="status" className="text-body">
              Thank you for your message. It has been sent.
            </p>
          ) : (
            <form action={action} className="space-y-0">
              <input
                name="name"
                required
                placeholder="Ayrton Senna"
                aria-label="Name"
                defaultValue={state?.fields?.name}
                className={field}
              />
              <input
                name="email"
                type="email"
                required
                placeholder="contact@company.com"
                aria-label="Email"
                defaultValue={state?.fields?.email}
                className={field}
              />
              <textarea
                name="message"
                rows={4}
                placeholder="Write your message here"
                aria-label="Message"
                defaultValue={state?.fields?.message}
                className={`${field} h-[125px]`}
              />
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="hidden"
              />
              <button
                type="submit"
                disabled={pending}
                className="bg-ink hover:bg-brand mt-[3px] h-11 w-full px-10 text-xs font-black tracking-[1px] text-white transition-colors hover:text-black disabled:opacity-60"
              >
                {pending ? "Sending…" : "Send"}
              </button>
              {state?.error && (
                <p role="alert" className="text-coral pt-2 text-sm">
                  {state.error}
                </p>
              )}
            </form>
          )}
        </div>
        <Image
          src="/directory/slogan.webp"
          alt="Rotta Slogan - Sharing a Passion"
          width={1921}
          height={1081}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="h-auto w-full"
        />
      </div>
    </Container>
  );
}
