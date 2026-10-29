"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";

export type StepOption = { label: string; slug: string; icon: string | null };

export type Step = {
  param: string; // URL parameter, e.g. "vehicles"
  nav: string; // "Vehicle", "Era"...
  number: string; // "Step 01"
  prompt: string; // "I drive..."
  options: StepOption[];
};

// Small print under an option, as on the live form.
const HINTS: Record<string, string> = { classic: "+30 years old" };

function Ad() {
  return (
    <Link href="/contact-us/" className="block">
      <Image
        src="/directory/rotta-ad-2.webp"
        alt="Advertise with us"
        width={222}
        height={340}
        className="h-auto w-full"
      />
    </Link>
  );
}

// The four-step "Find exactly what you need!" filter. Each step picks one
// option; the last one opens the results page with the choices as labels.
export function StepFilter({ steps }: { steps: Step[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>(() =>
    steps.map((s) => s.options[0]?.label ?? ""),
  );
  const step = steps[index];
  const last = index === steps.length - 1;

  function submit() {
    const params = new URLSearchParams();
    steps.forEach((s, i) => params.set(s.param, picked[i]));
    router.push(`/directory/search-results/?${params}`);
  }

  return (
    <div className="desk:grid-cols-12 grid gap-x-[2%] gap-y-6 px-5 lg:px-0">
      <nav
        aria-label="Search steps"
        className="desk:col-span-8 desk:col-start-3 flex flex-wrap justify-center gap-x-[30px] text-[17px] text-black"
      >
        {steps.map((s, i) => (
          <span key={s.param} className={i === index ? "font-bold" : ""}>
            {s.nav}
          </span>
        ))}
      </nav>

      <div className="desk:col-span-2 desk:col-start-1 font-bold text-black">
        <p className="text-[15px] leading-[22.5px]">{step.number}</p>
        <p className="text-[30px] leading-[45px]">{step.prompt}</p>
      </div>

      <fieldset className="desk:col-span-8 desk:col-start-3">
        <legend className="sr-only">{step.nav}</legend>
        <div className="flex flex-wrap justify-center gap-5">
          {step.options.map((option) => {
            const checked = picked[index] === option.label;
            return (
              <label key={option.slug} className="relative block w-[145px]">
                <input
                  type="radio"
                  name={step.param}
                  value={option.label}
                  checked={checked}
                  onChange={() =>
                    setPicked((p) =>
                      p.map((v, i) => (i === index ? option.label : v)),
                    )
                  }
                  className="peer sr-only"
                />
                <span
                  className={`border-brand hover:bg-brand peer-focus-visible:ring-ink relative flex h-[155px] cursor-pointer flex-col items-center rounded-[15px] border-[3px] transition-all duration-300 peer-focus-visible:ring-2 ${
                    checked ? "bg-brand" : ""
                  }`}
                >
                  {option.icon && (
                    <Image
                      src={option.icon}
                      alt=""
                      width={125}
                      height={125}
                      unoptimized
                      className="relative bottom-2.5 size-[125px] p-5"
                    />
                  )}
                  <span className="absolute bottom-0 w-full p-2.5 text-center text-[13px] leading-[16.9px] font-bold text-[#3a3a3a]">
                    {option.label}
                  </span>
                </span>
                {checked && (
                  <FaCheckCircle
                    aria-hidden
                    className="text-ink absolute -top-2.5 -left-2.5 size-5 rounded-full bg-white"
                  />
                )}
                {HINTS[option.slug] && (
                  <span className="mt-1 block text-center text-sm">
                    {HINTS[option.slug]}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="desk:col-span-2 desk:col-start-11 desk:block desk:h-0 hidden space-y-[72px]">
        <Ad />
        {step.param === "services" && <Ad />}
      </div>

      <div className="desk:col-span-12 desk:mt-[100px] flex justify-center gap-0.5">
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex(index - 1)}
            className="my-2.5 h-[43px] w-[130px] rounded-[5px] bg-[#333] text-[15px] font-bold text-white"
          >
            Previous
          </button>
        )}
        <button
          type="button"
          onClick={() => (last ? submit() : setIndex(index + 1))}
          className="bg-brand my-2.5 h-[43px] w-[130px] rounded-[5px] text-[15px] font-bold text-black"
        >
          {last ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
}
