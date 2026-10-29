import "server-only";
import { Resend } from "resend";
import { renderLayout, type EmailContent } from "./layout";

const FROM = process.env.EMAIL_FROM ?? "Rotta <noreply@rotta.mt>";

let client: Resend | null = null;

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

export type SendEmailInput = EmailContent & {
  to: string | string[];
  subject: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export type SendEmailResult =
  { ok: true; id: string } | { ok: false; error: string };

// Sends a transactional email with the Rotta layout. Without RESEND_API_KEY
// (local dev) it logs the email instead of sending it.
export async function sendEmail({
  to,
  subject,
  replyTo,
  idempotencyKey,
  ...content
}: SendEmailInput): Promise<SendEmailResult> {
  const { html, text } = renderLayout(content);
  const api = resend();

  if (!api) {
    console.info(
      `[email] RESEND_API_KEY not set; not sending "${subject}" to ${to}\n${text}`,
    );
    return { ok: true, id: "dev-noop" };
  }

  const { data, error } = await api.emails.send(
    {
      from: FROM,
      to,
      subject,
      html,
      text,
      replyTo,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (error || !data) {
    console.error("[email] send failed", error);
    return { ok: false, error: error?.message ?? "Unknown email error" };
  }
  return { ok: true, id: data.id };
}
