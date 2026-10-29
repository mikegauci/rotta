import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthSection, AuthTitle } from "@/components/auth/auth-section";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <AuthSection>
      <AuthTitle>Log in</AuthTitle>
      <p className="mt-2 text-base">
        or{" "}
        <Link
          href="/user-registration/"
          className="hover:text-brand text-white"
        >
          create an account
        </Link>
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthSection>
  );
}
