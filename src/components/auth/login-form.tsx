"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signIn } from "@/lib/auth/actions";
import { AuthInput, FormMessage, SubmitButton } from "@/components/auth/fields";

export function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useActionState(signIn, undefined);
  const linkError =
    params.get("error") === "link"
      ? { error: "That link is invalid or has expired." }
      : undefined;

  return (
    <form action={action} className="mt-12 space-y-[30px]">
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      <AuthInput
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <AuthInput
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <div className="flex items-center gap-8">
        <SubmitButton>Login</SubmitButton>
        <Link
          href="/reset-password/"
          className="text-brand text-sm hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
      <FormMessage state={state ?? linkError} />
    </form>
  );
}
