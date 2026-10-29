import type { Metadata } from "next";
import Link from "next/link";
import { AuthSection, AuthTitle } from "@/components/auth/auth-section";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "User Registration" };

export default function RegistrationPage() {
  return (
    <AuthSection>
      <AuthTitle>Register</AuthTitle>
      <p className="mt-2 text-base">
        or{" "}
        <Link href="/login/" className="hover:text-brand text-white">
          log in
        </Link>
      </p>
      <RegisterForm />
    </AuthSection>
  );
}
