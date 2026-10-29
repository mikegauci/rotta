"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { safeNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string } | undefined;

async function origin() {
  return (await headers()).get("origin") ?? env.siteUrl;
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function signIn(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password." };

  redirect(safeNext(formData.get("next"), "/my-business/"));
}

export async function signUp(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const firstName = field(formData, "first_name");
  const lastName = field(formData, "last_name");
  const username = field(formData, "username").toLowerCase();
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!firstName || !lastName || !username || !email || !password)
    return { error: "Please fill in all required fields." };
  if (!/^[a-z0-9]{3,32}$/.test(username))
    return {
      error: "Only lower case letters (a-z) and numbers (0-9) are allowed.",
    };
  if (email.toLowerCase() !== field(formData, "email_confirm").toLowerCase())
    return { error: "Email addresses do not match." };
  if (password !== String(formData.get("password_confirm") ?? ""))
    return { error: "Passwords do not match." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data: available } = await supabase.rpc("username_available", {
    candidate: username,
  });
  if (available === false) return { error: "That username is already taken." };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await origin()}/auth/callback?next=/my-business/`,
      data: {
        first_name: firstName,
        last_name: lastName,
        username,
        account_type: "business",
      },
    },
  });
  if (error) return { error: error.message };

  return { message: "Check your email to confirm your account." };
}

export async function requestPasswordReset(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, "email");
  if (!email) return { error: "Enter your email address." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/update-password/`,
  });
  return {
    message:
      "If that email has an account, you will receive a link to create a new password.",
  };
}

export async function updatePassword(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  if (password !== String(formData.get("password_confirm") ?? ""))
    return { error: "Passwords do not match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error)
    return { error: "Your reset link has expired. Request a new one." };

  redirect("/my-business/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
