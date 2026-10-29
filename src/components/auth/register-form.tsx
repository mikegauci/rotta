"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/auth/actions";
import { AuthInput, FormMessage, SubmitButton } from "@/components/auth/fields";

export function RegisterForm() {
  const [state, action] = useActionState(signUp, undefined);

  return (
    <form
      key={JSON.stringify(state?.fields)}
      action={action}
      className="mt-8 space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthInput
          label="First*"
          name="first_name"
          defaultValue={state?.fields?.first_name}
          autoComplete="given-name"
          required
        />
        <AuthInput
          label="Last*"
          name="last_name"
          defaultValue={state?.fields?.last_name}
          autoComplete="family-name"
          required
        />
      </div>
      <div>
        <AuthInput
          label="Username*"
          name="username"
          defaultValue={state?.fields?.username}
          autoComplete="username"
          pattern="[a-z0-9]{3,32}"
          required
        />
        <p className="mt-1.5 text-xs text-white/70">
          Only lower case letters (a-z) and numbers (0-9) are allowed.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthInput
          label="Email Address*"
          name="email"
          defaultValue={state?.fields?.email}
          type="email"
          autoComplete="email"
          required
        />
        <AuthInput
          label="Confirm Email*"
          name="email_confirm"
          defaultValue={state?.fields?.email_confirm}
          type="email"
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthInput
          label="Enter Password*"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <AuthInput
          label="Confirm Password*"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <p className="text-sm text-white/70">
        By clicking ‘Register’ you read and understood our{" "}
        <Link href="/privacy-policy/" className="text-brand hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <SubmitButton>Register</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
