-- Server-only stock reservations and atomic, idempotent Stripe fulfillment.
create table public.shop_checkouts (
 id uuid primary key,
 customer_id uuid references public.profiles(id) on delete set null,
 items jsonb not null,
 shipping_cents integer not null check (shipping_cents >= 0),
 shipping_method text not null,
 vat_rate numeric not null,
 total_cents integer not null,
 state text not null default 'reserved' check (state in ('reserved','released','paid')),
 order_id uuid references public.orders(id),
 customer_email_sent boolean not null default false,
 admin_email_sent boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.shop_checkouts enable row level security;
revoke all on public.shop_checkouts from anon, authenticated;
grant all on public.shop_checkouts to service_role;

create function public.reserve_shop_checkout(checkout_id uuid, customer uuid, lines jsonb, shipping integer, shipping_label text, vat numeric)
returns uuid language plpgsql set search_path = '' as $$
declare item jsonb; p public.products; v public.product_variants; amount integer := shipping;
begin
 if jsonb_array_length(lines) < 1 or jsonb_array_length(lines) > 50 or shipping < 0 or vat <> 0.18 then raise exception 'Invalid checkout'; end if;
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
 insert into public.shop_checkouts(id,customer_id,items,shipping_cents,shipping_method,vat_rate,total_cents) values(checkout_id,customer,lines,shipping,shipping_label,vat,amount);
 return checkout_id;
end $$;

create function public.release_shop_checkout(checkout_id uuid)
returns void language plpgsql set search_path = '' as $$
declare c public.shop_checkouts; item jsonb;
begin
 select * into c from public.shop_checkouts where id=checkout_id for update;
 if c.id is null or c.state <> 'reserved' then return; end if;
 for item in select value from jsonb_array_elements(c.items) order by value->>'product_id', value->>'variant_id' loop
   update public.products set stock_quantity=stock_quantity+(item->>'quantity')::integer where id=(item->>'product_id')::uuid and manage_stock;
   update public.product_variants set stock_quantity=stock_quantity+(item->>'quantity')::integer where id=nullif(item->>'variant_id','')::uuid and manage_stock;
 end loop;
 update public.shop_checkouts set state='released' where id=c.id;
end $$;

create function public.complete_shop_checkout(checkout_id uuid, session_id text, payment_intent text, email_address text, customer uuid, billing jsonb, shipping_address_input jsonb, paid_total integer)
returns uuid language plpgsql set search_path = '' as $$
declare c public.shop_checkouts; result uuid; item jsonb;
begin
 select * into strict c from public.shop_checkouts where id=checkout_id for update;
 if c.state='paid' then return c.order_id; end if;
 if c.state <> 'reserved' or paid_total <> c.total_cents or shipping_address_input->>'country' is distinct from 'MT' then raise exception 'Invalid paid checkout'; end if;
 insert into public.orders(customer_id,email,status,subtotal_cents,shipping_cents,vat_cents,total_cents,billing_address,shipping_address,shipping_method,payment_method,stripe_checkout_session_id,stripe_payment_intent_id,paid_at)
 values(coalesce(c.customer_id,customer),email_address,'processing',c.total_cents-c.shipping_cents,c.shipping_cents,round(c.total_cents*c.vat_rate/(1+c.vat_rate)),c.total_cents,billing,shipping_address_input,c.shipping_method,'stripe',session_id,payment_intent,now()) returning id into result;
 for item in select value from jsonb_array_elements(c.items) loop
   insert into public.order_items(order_id,product_id,variant_id,name,option_values,sku,quantity,unit_price_cents,total_cents)
   values(result,(item->>'product_id')::uuid,nullif(item->>'variant_id','')::uuid,item->>'name',coalesce(item->'option_values','{}'),item->>'sku',(item->>'quantity')::integer,(item->>'unit_price_cents')::integer,(item->>'quantity')::integer*(item->>'unit_price_cents')::integer);
 end loop;
 update public.shop_checkouts set state='paid',order_id=result where id=c.id;
 return result;
end $$;

revoke all on function public.reserve_shop_checkout(uuid,uuid,jsonb,integer,text,numeric) from public, anon, authenticated;
revoke all on function public.release_shop_checkout(uuid) from public, anon, authenticated;
revoke all on function public.complete_shop_checkout(uuid,text,text,text,uuid,jsonb,jsonb,integer) from public, anon, authenticated;
grant execute on function public.reserve_shop_checkout(uuid,uuid,jsonb,integer,text,numeric) to service_role;
grant execute on function public.release_shop_checkout(uuid) to service_role;
grant execute on function public.complete_shop_checkout(uuid,text,text,text,uuid,jsonb,jsonb,integer) to service_role;

