"use server";
import { assertAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Constants, type Enums } from "@/lib/supabase/database.types";
import { sendEmail } from "@/lib/email/send";
export async function updateOrder(
  _previous: { message: string },
  form: FormData,
) {
  await assertAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status")) as Enums<"order_status">;
  const note = String(form.get("note") ?? "").trim();
  const visible = form.get("visible") === "on";
  if (!Constants.public.Enums.order_status.includes(status))
    return { message: "Invalid status." };
  if (note.length > 10000) return { message: "Note is too long." };
  const db = await createClient();
  const { data: before, error: lookup } = await db
    .from("orders")
    .select("number,email,status")
    .eq("id", id)
    .single();
  if (lookup) return { message: lookup.message };
  const { error } = await db.from("orders").update({ status }).eq("id", id);
  if (error) return { message: error.message };
  if (note) {
    const r = await db
      .from("order_notes")
      .insert({ order_id: id, body: note, customer_visible: visible });
    if (r.error) return { message: r.error.message };
    if (visible) {
      const sent = await sendEmail({
        to: before.email,
        subject: `Rotta order #${before.number} update`,
        heading: `Order #${before.number}`,
        paragraphs: [note],
      });
      if (!sent.ok) return { message: "Saved, but the customer email failed." };
    }
  }
  if (status === "completed" && before.status !== "completed") {
    const sent = await sendEmail({
      to: before.email,
      subject: `Rotta order #${before.number} completed`,
      heading: "Your order is complete",
      paragraphs: [
        `Order #${before.number} has been completed. Thank you for shopping with Rotta.`,
      ],
      idempotencyKey: `order-${id}-completed`,
    });
    if (!sent.ok) return { message: "Saved, but the completion email failed." };
  }
  revalidatePath(`/admin/orders/${id}/`);
  revalidatePath("/admin/orders/");
  return {
    message:
      "Saved. Status changes do not issue a Stripe refund; handle refunds in Stripe.",
  };
}
