import Link from "next/link";
import { AuthSection, AuthTitle } from "@/components/auth/auth-section";
import { RegisterForm } from "@/components/auth/register-form";
import { codePageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return codePageMetadata("user-registration", "User Registration");
}

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
