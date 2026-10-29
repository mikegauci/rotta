"use client";
import { useActionState } from "react";
import { updateOrder } from "@/app/(admin)/admin/orders/actions";
import { Constants, type Enums } from "@/lib/supabase/database.types";
export function OrderForm({
  id,
  status,
}: {
  id: string;
  status: Enums<"order_status">;
}) {
  const [state, action, pending] = useActionState(updateOrder, { message: "" });
  return (
    <form action={action} className="mt-6 space-y-4 rounded bg-white p-5">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        Status
        <select
          name="status"
          defaultValue={status}
          className="ml-4 border border-black/20 p-2"
        >
          {Constants.public.Enums.order_status.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label className="block">
        Add note
        <textarea
          name="note"
          maxLength={10000}
          className="mt-2 block w-full border border-black/20 p-3"
        />
      </label>
      <label className="flex gap-2">
        <input type="checkbox" name="visible" />
        Email note to customer
      </label>
      <p className="text-muted text-sm">
        Changing status does not issue a refund or restore stock. Manage refunds
        in Stripe and adjust returned stock in Products.
      </p>
      <button disabled={pending} className="shop-button">
        Save
      </button>
      <p role="status">{state.message}</p>
    </form>
  );
}
