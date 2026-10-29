import type { Metadata } from "next";
import { AuthSection, AuthTitle } from "@/components/auth/auth-section";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <AuthSection>
      <AuthTitle>Reset Password</AuthTitle>
      <ResetPasswordForm />
    </AuthSection>
  );
}
