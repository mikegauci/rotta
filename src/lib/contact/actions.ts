"use server";

import { sendEmail } from "@/lib/email/send";

export type ContactState =
  | {
      ok?: boolean;
      error?: string;
      fields?: { name: string; email: string; message: string };
    }
  | undefined;

// The "Get in Touch" form shown on the directory pages (and later contact).
export async function sendContactMessage(
  _: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const fields = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };
  // Hidden field that only bots fill in.
  if (formData.get("website")) return { ok: true };
  if (!fields.name || !fields.email)
    return { error: "Please fill in your name and email.", fields };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    return { error: "Please enter a valid email address.", fields };
  if (fields.message.length > 5000)
    return { error: "Your message is too long.", fields };

  const to = process.env.EMAIL_ADMIN_TO;
  if (!to) return { error: "The form is not set up yet.", fields };

  const result = await sendEmail({
    to,
    replyTo: fields.email,
    subject: `Website enquiry from ${fields.name}`,
    heading: "New message from the website",
    paragraphs: fields.message ? fields.message.split(/\n{2,}/) : [],
    rows: [
      { label: "Name", value: fields.name },
      { label: "Email", value: fields.email },
    ],
  });
  if (!result.ok)
    return {
      error: "Your message could not be sent. Please try again.",
      fields,
    };
  return { ok: true };
}
