import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { formatPrice } from "@/lib/format";
import { revalidateTag } from "next/cache";
import type { Json } from "@/lib/supabase/database.types";
function address(
  detail:
    | {
        name?: string | null;
        address?: Stripe.Address | null;
        phone?: string | null;
      }
    | null
    | undefined,
) {
  const parts = (detail?.name ?? "").split(" ");
  return {
    first_name: parts.shift() ?? "",
    last_name: parts.join(" "),
    address_1: detail?.address?.line1 ?? "",
    address_2: detail?.address?.line2 ?? "",
    city: detail?.address?.city ?? "",
    postcode: detail?.address?.postal_code ?? "",
    country: detail?.address?.country ?? "",
    phone: detail?.phone ?? "",
  };
}
export async function POST(request: Request) {
  if (!env.stripeWebhookSecret)
    return new Response("Webhook unavailable", { status: 503 });
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      env.stripeWebhookSecret,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  const db = createAdminClient();
  if (!db) return new Response("Webhook unavailable", { status: 503 });
  try {
    if (
      ![
        "checkout.session.completed",
        "checkout.session.expired",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type)
    )
      return Response.json({ received: true });
    const eventSession = event.data.object as Stripe.Checkout.Session;
    const id = eventSession.metadata?.checkout_id;
    if (!id) return Response.json({ received: true });
    if (event.type === "checkout.session.expired") {
      const r = await db.rpc("release_shop_checkout", { checkout_id: id });
      if (r.error) throw r.error;
      revalidateTag("products", "max");
      return Response.json({ received: true });
    }
    const session = await stripe.checkout.sessions.retrieve(eventSession.id);
    if (session.payment_status !== "paid")
      return Response.json({ received: true });
    const email = session.customer_details?.email;
    if (!email || session.currency !== "eur")
      throw new Error("Invalid payment");
    const delivery = address(session.collected_information?.shipping_details);
    const billing = address(session.customer_details);
    if (delivery.country !== "MT")
      throw new Error("Unsupported delivery country");
    const { data: existing, error: lookupError } = await db
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) throw lookupError;
    let customer = existing?.id ?? null;
    if (!customer) {
      const created = await db.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          account_type: "customer",
          first_name: billing.first_name,
          last_name: billing.last_name,
        },
      });
      if (created.error) {
        const retry = await db
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (!retry.data) throw created.error;
        customer = retry.data.id;
      } else customer = created.data.user.id;
    }
    const result = await db.rpc("complete_shop_checkout", {
      checkout_id: id,
      session_id: session.id,
      payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      email_address: email,
      customer,
      billing: billing as Json,
      shipping_address_input: delivery as Json,
      paid_total: session.amount_total ?? -1,
    });
    if (result.error) throw result.error;
    revalidateTag("products", "max");
    const { data: order, error } = await db
      .from("orders")
      .select("*,items:order_items(*)")
      .eq("id", result.data)
      .single();
    if (error) throw error;
    const { data: receipt, error: receiptError } = await db
      .from("shop_checkouts")
      .select("customer_email_sent,admin_email_sent")
      .eq("id", id)
      .single();
    if (receiptError) throw receiptError;
    const content = {
      heading: `Order #${order.number}`,
      paragraphs: [
        "Thank you for your order. We have received your payment.",
        order.shipping_method,
      ],
      rows: [
        ...order.items.map((i) => ({
          label: `${i.quantity} × ${i.name} ${Object.values(i.option_values ?? {}).join(" / ")}`,
          value: formatPrice(i.total_cents),
        })),
        { label: "Delivery", value: formatPrice(order.shipping_cents) },
        {
          label: "Total (includes 18% VAT)",
          value: formatPrice(order.total_cents),
        },
        { label: "VAT included", value: formatPrice(order.vat_cents) },
        {
          label: "Delivery address",
          value: Object.values(delivery).filter(Boolean).join(", "),
        },
      ],
    };
    if (!receipt.customer_email_sent) {
      const sent = await sendEmail({
        to: email,
        subject: `Rotta order #${order.number}`,
        idempotencyKey: `order-${order.id}-customer`,
        ...content,
      });
      if (!sent.ok) throw new Error("Customer email failed");
      const saved = await db
        .from("shop_checkouts")
        .update({ customer_email_sent: true })
        .eq("id", id);
      if (saved.error) throw saved.error;
    }
    if (!receipt.admin_email_sent && process.env.EMAIL_ADMIN_TO) {
      const sent = await sendEmail({
        to: process.env.EMAIL_ADMIN_TO,
        subject: `New order #${order.number}`,
        idempotencyKey: `order-${order.id}-admin`,
        ...content,
        action: {
          label: "View order",
          href: `${env.siteUrl}/admin/orders/${order.id}/`,
        },
      });
      if (!sent.ok) throw new Error("Admin email failed");
      const saved = await db
        .from("shop_checkouts")
        .update({ admin_email_sent: true })
        .eq("id", id);
      if (saved.error) throw saved.error;
    }
    return Response.json({ received: true });
  } catch {
    console.error("Stripe fulfillment failed", event.id);
    return new Response("Please retry", { status: 500 });
  }
}
