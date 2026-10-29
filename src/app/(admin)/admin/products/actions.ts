"use server";
import { assertAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { updateTag, revalidatePath } from "next/cache";
import type { Enums, Json, Tables } from "@/lib/supabase/database.types";
export type ProductInput = {
  id: string | null;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  sku: string | null;
  price_cents: number | null;
  sale_price_cents: number | null;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: Enums<"stock_status">;
  options: { name: string; values: string[] }[];
  featured_media_id: string | null;
  status: Enums<"publish_status">;
  sort_order: number;
  seo: { title?: string; description?: string; noindex?: boolean };
  gallery: string[];
  variants: Pick<
    Tables<"product_variants">,
    | "id"
    | "option_values"
    | "sku"
    | "price_cents"
    | "sale_price_cents"
    | "manage_stock"
    | "stock_quantity"
    | "stock_status"
    | "image_media_id"
  >[];
};
export async function saveProduct(
  input: ProductInput,
): Promise<{ error: string } | { id: string }> {
  await assertAdmin();
  const db = await createClient();
  const slug = slugify(input.slug || input.name);
  if (!input.name.trim() || !slug)
    return { error: "Add a product name and URL." };
  if (
    !["draft", "published"].includes(input.status) ||
    !["in_stock", "out_of_stock", "on_backorder"].includes(input.stock_status)
  )
    return { error: "Invalid status." };
  const stock = [input, ...input.variants];
  for (const p of stock) {
    if (!["in_stock", "out_of_stock", "on_backorder"].includes(p.stock_status))
      return { error: "Invalid stock status." };
    if (
      p.manage_stock &&
      (!Number.isInteger(p.stock_quantity) || p.stock_quantity! < 0)
    )
      return { error: "Stock must be a non-negative whole number." };
    for (const n of [p.price_cents, p.sale_price_cents])
      if (n !== null && (!Number.isSafeInteger(n) || n < 0 || n > 10000000))
        return { error: "Prices must be valid euro cents." };
    if (
      p.sale_price_cents !== null &&
      (p.price_cents === null || p.sale_price_cents > p.price_cents)
    )
      return { error: "Sale price must be no higher than regular price." };
  }
  if (!input.variants.length && input.price_cents === null)
    return { error: "Add a price." };
  if (
    input.options.some(
      (o) =>
        !o.name.trim() ||
        !o.values.length ||
        new Set(o.values).size !== o.values.length,
    ) ||
    new Set(input.options.map((o) => o.name)).size !== input.options.length
  )
    return { error: "Option names and values must be unique and nonempty." };
  const combinations = new Set<string>();
  for (const v of input.variants) {
    const values = v.option_values as Record<string, string>;
    if (
      !values ||
      Array.isArray(values) ||
      typeof values !== "object" ||
      Object.keys(values).length !== input.options.length ||
      input.options.some(
        (o) => values[o.name] !== "" && !o.values.includes(values[o.name]),
      )
    )
      return { error: "Each variant must choose a value for every option." };
    const combination = JSON.stringify(
      input.options.map((o) => values[o.name]),
    );
    if (combinations.has(combination))
      return { error: "Duplicate variant combination." };
    combinations.add(combination);
  }
  if (input.options.length && !input.variants.length)
    return { error: "Add variants for the product options." };
  const { id, gallery, variants, ...row } = input;
  const previous = id
    ? (await db.from("products").select("slug,status").eq("id", id).single())
        .data
    : null;
  if (id && !previous) return { error: "Product not found." };
  // Check new products too: upsert must never reparent an existing variant.
  for (const v of variants) {
    const other = await db
      .from("product_variants")
      .select("product_id")
      .eq("id", v.id)
      .maybeSingle();
    if (other.error) return { error: "Could not validate variant ownership." };
    if (other.data && other.data.product_id !== id)
      return { error: "Invalid variant." };
  }
  const saved = id
    ? await db
        .from("products")
        .update({
          ...row,
          slug,
          name: row.name.trim(),
          options: row.options as Json,
        })
        .eq("id", id)
        .select("id")
        .single()
    : await db
        .from("products")
        .insert({
          ...row,
          slug,
          name: row.name.trim(),
          options: row.options as Json,
        })
        .select("id")
        .single();
  if (saved.error) return { error: saved.error.message };
  const productId = saved.data.id;
  if (variants.length) {
    const result = await db.from("product_variants").upsert(
      variants.map((v, i) => ({
        ...v,
        product_id: productId,
        sort_order: i,
      })),
    );
    if (result.error) return { error: result.error.message };
  }
  const existing = await db
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  if (existing.error) return { error: existing.error.message };
  const removed = (existing.data ?? []).filter(
    (v) => !variants.some((n) => n.id === v.id),
  );
  if (removed.length) {
    const r = await db
      .from("product_variants")
      .delete()
      .in(
        "id",
        removed.map((v) => v.id),
      );
    if (r.error) return { error: r.error.message };
  }
  const cleared = await db
    .from("product_media")
    .delete()
    .eq("product_id", productId);
  if (cleared.error) return { error: cleared.error.message };
  if (gallery.length) {
    const result = await db.from("product_media").insert(
      [...new Set(gallery)].map((media_id, sort_order) => ({
        product_id: productId,
        media_id,
        sort_order,
      })),
    );
    if (result.error) return { error: result.error.message };
  }
  if (previous && previous.slug !== slug && previous.status === "published") {
    const r = await db.from("redirects").upsert(
      {
        source: `/product/${previous.slug}/`,
        destination: `/product/${slug}/`,
      },
      { onConflict: "source" },
    );
    if (r.error) return { error: r.error.message };
    await db.from("redirects").delete().eq("source", `/product/${slug}/`);
  }
  updateTag("products");
  updateTag(`product:${slug}`);
  if (previous) updateTag(`product:${previous.slug}`);
  revalidatePath("/admin/products/");
  return { id: productId };
}
