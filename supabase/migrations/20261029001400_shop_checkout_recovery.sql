-- Checkout hardening:
--  * durable Stripe session state, so a timed-out or crashed checkout can be
--    recovered by replaying the same idempotent Stripe request;
--  * reservations carry an expiry, and stale ones are reconciled;
--  * test-mode (Stripe livemode=false) checkouts and orders are marked, hidden
--    from the admin by default and can be purged with stock restored;
--  * product saves (product, variants, gallery) run in one transaction.

alter table public.shop_checkouts
  add column livemode boolean not null default true,
  add column expires_at timestamptz,
  add column stripe_request jsonb,
  add column stripe_session_id text unique,
  add column stripe_session_url text,
  add column last_error text not null default '',
  add column updated_at timestamptz not null default now();
create index shop_checkouts_reconcile_idx on public.shop_checkouts (state, expires_at);
create index shop_checkouts_emails_idx on public.shop_checkouts (state, customer_email_sent, admin_email_sent);
create index shop_checkouts_order_idx on public.shop_checkouts (order_id);
create index shop_checkouts_customer_idx on public.shop_checkouts (customer_id);

alter table public.orders add column livemode boolean not null default true;
create index orders_livemode_idx on public.orders (livemode, created_at desc);

-- Reservations now record the Stripe mode and when they lapse.
drop function public.reserve_shop_checkout(uuid, uuid, jsonb, integer, text, numeric);
create function public.reserve_shop_checkout(
  checkout_id uuid, customer uuid, lines jsonb, shipping integer,
  shipping_label text, vat numeric, live boolean, expires timestamptz)
returns uuid language plpgsql set search_path = '' as $$
declare item jsonb; p public.products; v public.product_variants; amount integer := shipping;
begin
 if jsonb_array_length(lines) < 1 or jsonb_array_length(lines) > 50 or shipping < 0 or vat <> 0.18 then raise exception 'Invalid checkout'; end if;
 if expires is null or expires <= now() or expires > now() + interval '2 hours' then raise exception 'Invalid expiry'; end if;
 -- Lock in a stable order; every checkout locks the parent before variants.
 for item in select value from jsonb_array_elements(lines) order by value->>'product_id', value->>'variant_id' loop
   if (item->>'quantity')::integer not between 1 and 99 then raise exception 'Invalid quantity'; end if;
   select * into strict p from public.products where id=(item->>'product_id')::uuid for update;
   if p.status <> 'published' or p.stock_status = 'out_of_stock' then raise exception 'Product unavailable'; end if;
   if p.manage_stock then
     if coalesce(p.stock_quantity,0) < (item->>'quantity')::integer then raise exception 'Insufficient stock'; end if;
     update public.products set stock_quantity=stock_quantity-(item->>'quantity')::integer where id=p.id;
   end if;
   if nullif(item->>'variant_id','') is not null then
     select * into strict v from public.product_variants where id=(item->>'variant_id')::uuid and product_id=p.id for update;
     if v.stock_status='out_of_stock' or coalesce(v.sale_price_cents,v.price_cents) is distinct from (item->>'unit_price_cents')::integer then raise exception 'Variant unavailable or price changed'; end if;
     if v.manage_stock then
       if coalesce(v.stock_quantity,0) < (item->>'quantity')::integer then raise exception 'Insufficient stock'; end if;
       update public.product_variants set stock_quantity=stock_quantity-(item->>'quantity')::integer where id=v.id;
     end if;
   else
     if exists(select 1 from public.product_variants where product_id=p.id) or coalesce(p.sale_price_cents,p.price_cents) is distinct from (item->>'unit_price_cents')::integer then raise exception 'Choose a variant or refresh price'; end if;
   end if;
   amount := amount + (item->>'unit_price_cents')::integer*(item->>'quantity')::integer;
 end loop;
 insert into public.shop_checkouts(id,customer_id,items,shipping_cents,shipping_method,vat_rate,total_cents,livemode,expires_at)
 values(checkout_id,customer,lines,shipping,shipping_label,vat,amount,live,expires);
 return checkout_id;
end $$;

-- Paid orders inherit the checkout's Stripe mode.
create or replace function public.complete_shop_checkout(checkout_id uuid, session_id text, payment_intent text, email_address text, customer uuid, billing jsonb, shipping_address_input jsonb, paid_total integer)
returns uuid language plpgsql set search_path = '' as $$
declare c public.shop_checkouts; result uuid; item jsonb; late boolean := false;
begin
 select * into strict c from public.shop_checkouts where id=checkout_id for update;
 if c.state='paid' then return c.order_id; end if;
 -- A payment can arrive after the reservation was released (a late webhook
 -- racing the reconciler). The customer has paid, so the order is always
 -- recorded: the stock is taken again, even if that oversells, and the order
 -- gets a note for the admin.
 if c.state='released' then
   for item in select value from jsonb_array_elements(c.items) order by value->>'product_id', value->>'variant_id' loop
     update public.products set stock_quantity=stock_quantity-(item->>'quantity')::integer
       where id=(item->>'product_id')::uuid and manage_stock;
     update public.product_variants set stock_quantity=stock_quantity-(item->>'quantity')::integer
       where id=nullif(item->>'variant_id','')::uuid and manage_stock;
   end loop;
   late := true;
 elsif c.state <> 'reserved' then
   raise exception 'Invalid paid checkout';
 end if;
 if paid_total <> c.total_cents or shipping_address_input->>'country' is distinct from 'MT' then raise exception 'Invalid paid checkout'; end if;
 insert into public.orders(customer_id,email,status,subtotal_cents,shipping_cents,vat_cents,total_cents,billing_address,shipping_address,shipping_method,payment_method,stripe_checkout_session_id,stripe_payment_intent_id,paid_at,livemode)
 values(coalesce(c.customer_id,customer),email_address,'processing',c.total_cents-c.shipping_cents,c.shipping_cents,round(c.total_cents*c.vat_rate/(1+c.vat_rate)),c.total_cents,billing,shipping_address_input,c.shipping_method,'stripe',session_id,payment_intent,now(),c.livemode) returning id into result;
 for item in select value from jsonb_array_elements(c.items) loop
   insert into public.order_items(order_id,product_id,variant_id,name,option_values,sku,quantity,unit_price_cents,total_cents)
   values(result,(item->>'product_id')::uuid,nullif(item->>'variant_id','')::uuid,item->>'name',coalesce(item->'option_values','{}'),item->>'sku',(item->>'quantity')::integer,(item->>'unit_price_cents')::integer,(item->>'quantity')::integer*(item->>'unit_price_cents')::integer);
 end loop;
 if late then
   insert into public.order_notes(order_id,body) values(result,'Paid after the stock reservation had lapsed. Stock was taken again and may now be negative: check availability before shipping, or refund in Stripe.');
 end if;
 update public.shop_checkouts set state='paid',order_id=result,stripe_session_id=coalesce(stripe_session_id,session_id),updated_at=now() where id=c.id;
 return result;
end $$;

create or replace function public.release_shop_checkout(checkout_id uuid)
returns void language plpgsql set search_path = '' as $$
declare c public.shop_checkouts; item jsonb;
begin
 select * into c from public.shop_checkouts where id=checkout_id for update;
 if c.id is null or c.state <> 'reserved' then return; end if;
 for item in select value from jsonb_array_elements(c.items) order by value->>'product_id', value->>'variant_id' loop
   update public.products set stock_quantity=stock_quantity+(item->>'quantity')::integer where id=(item->>'product_id')::uuid and manage_stock;
   update public.product_variants set stock_quantity=stock_quantity+(item->>'quantity')::integer where id=nullif(item->>'variant_id','')::uuid and manage_stock;
 end loop;
 update public.shop_checkouts set state='released',updated_at=now() where id=c.id;
end $$;

-- Deletes every test-mode checkout and order, putting their stock back.
-- Live rows are never touched. Returns the number of test orders removed.
create function public.purge_test_shop_checkouts()
returns integer language plpgsql set search_path = '' as $$
declare c public.shop_checkouts; item jsonb; removed integer;
begin
 for c in select * from public.shop_checkouts where not livemode order by id for update loop
   if c.state in ('reserved','paid') then
     for item in select value from jsonb_array_elements(c.items) order by value->>'product_id', value->>'variant_id' loop
       update public.products set stock_quantity=stock_quantity+(item->>'quantity')::integer where id=(item->>'product_id')::uuid and manage_stock;
       update public.product_variants set stock_quantity=stock_quantity+(item->>'quantity')::integer where id=nullif(item->>'variant_id','')::uuid and manage_stock;
     end loop;
   end if;
 end loop;
 delete from public.shop_checkouts where not livemode;
 delete from public.orders where not livemode;
 get diagnostics removed = row_count;
 return removed;
end $$;

revoke all on function public.reserve_shop_checkout(uuid,uuid,jsonb,integer,text,numeric,boolean,timestamptz) from public, anon, authenticated;
revoke all on function public.complete_shop_checkout(uuid,text,text,text,uuid,jsonb,jsonb,integer) from public, anon, authenticated;
revoke all on function public.release_shop_checkout(uuid) from public, anon, authenticated;
revoke all on function public.purge_test_shop_checkouts() from public, anon, authenticated;
grant execute on function public.reserve_shop_checkout(uuid,uuid,jsonb,integer,text,numeric,boolean,timestamptz) to service_role;
grant execute on function public.complete_shop_checkout(uuid,text,text,text,uuid,jsonb,jsonb,integer) to service_role;
grant execute on function public.release_shop_checkout(uuid) to service_role;
grant execute on function public.purge_test_shop_checkouts() to service_role;

-- Atomic product save for the admin editor. Runs as the caller, so the
-- admin-only RLS policies still apply; input is validated in the Server
-- Action first. Returns the product id.
create function public.admin_save_product(target_id uuid, product jsonb, variants jsonb, gallery uuid[])
returns uuid language plpgsql set search_path = '' as $$
declare saved uuid; v jsonb; keep uuid[];
begin
 if not (select private.is_admin()) then raise exception 'Admins only'; end if;
 if target_id is null then
   insert into public.products(slug,name,short_description,description,sku,price_cents,sale_price_cents,manage_stock,stock_quantity,stock_status,options,featured_media_id,status,sort_order,seo)
   values(product->>'slug',product->>'name',coalesce(product->>'short_description',''),coalesce(product->>'description',''),nullif(product->>'sku',''),(product->>'price_cents')::integer,(product->>'sale_price_cents')::integer,(product->>'manage_stock')::boolean,(product->>'stock_quantity')::integer,(product->>'stock_status')::public.stock_status,coalesce(product->'options','[]'),(product->>'featured_media_id')::uuid,(product->>'status')::public.publish_status,coalesce((product->>'sort_order')::integer,0),coalesce(product->'seo','{}'))
   returning id into saved;
 else
   update public.products set slug=product->>'slug',name=product->>'name',short_description=coalesce(product->>'short_description',''),description=coalesce(product->>'description',''),sku=nullif(product->>'sku',''),price_cents=(product->>'price_cents')::integer,sale_price_cents=(product->>'sale_price_cents')::integer,manage_stock=(product->>'manage_stock')::boolean,stock_quantity=(product->>'stock_quantity')::integer,stock_status=(product->>'stock_status')::public.stock_status,options=coalesce(product->'options','[]'),featured_media_id=(product->>'featured_media_id')::uuid,status=(product->>'status')::public.publish_status,sort_order=coalesce((product->>'sort_order')::integer,0),seo=coalesce(product->'seo','{}')
   where id=target_id returning id into saved;
   if saved is null then raise exception 'Product not found'; end if;
 end if;

 -- A variant id may only belong to this product (never reparent).
 if exists(select 1 from jsonb_array_elements(variants) x
           join public.product_variants pv on pv.id=(x.value->>'id')::uuid
           where pv.product_id <> saved) then
   raise exception 'Invalid variant';
 end if;
 select coalesce(array_agg((x.value->>'id')::uuid),'{}') into keep from jsonb_array_elements(variants) x;
 delete from public.product_variants where product_variants.product_id=saved and not (id = any(keep));
 -- Clear option combinations first so reordered/swapped values don't collide.
 update public.product_variants set option_values=jsonb_build_object('_pending',id::text) where product_variants.product_id=saved;
 for v in select value from jsonb_array_elements(variants) with ordinality as t(value, n) order by n loop
   insert into public.product_variants(id,product_id,option_values,sku,price_cents,sale_price_cents,manage_stock,stock_quantity,stock_status,image_media_id,sort_order)
   values((v->>'id')::uuid,saved,coalesce(v->'option_values','{}'),nullif(v->>'sku',''),(v->>'price_cents')::integer,(v->>'sale_price_cents')::integer,(v->>'manage_stock')::boolean,(v->>'stock_quantity')::integer,(v->>'stock_status')::public.stock_status,(v->>'image_media_id')::uuid,(v->>'sort_order')::integer)
   on conflict (id) do update set option_values=excluded.option_values,sku=excluded.sku,price_cents=excluded.price_cents,sale_price_cents=excluded.sale_price_cents,manage_stock=excluded.manage_stock,stock_quantity=excluded.stock_quantity,stock_status=excluded.stock_status,image_media_id=excluded.image_media_id,sort_order=excluded.sort_order;
 end loop;

 delete from public.product_media where product_media.product_id=saved;
 insert into public.product_media(product_id,media_id,sort_order)
 select saved, m, n - 1 from unnest(gallery) with ordinality as g(m, n);
 return saved;
end $$;
revoke all on function public.admin_save_product(uuid,jsonb,jsonb,uuid[]) from public, anon;
grant execute on function public.admin_save_product(uuid,jsonb,jsonb,uuid[]) to authenticated;
