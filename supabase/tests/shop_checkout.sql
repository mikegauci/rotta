-- Rollback-only integration tests. No imported rows are modified.
begin;
do $$
declare
 p uuid := gen_random_uuid(); c uuid := gen_random_uuid(); c2 uuid := gen_random_uuid();
 lines jsonb; result uuid; duplicate uuid; rejected boolean;
begin
 if has_function_privilege('anon','public.reserve_shop_checkout(uuid,uuid,jsonb,integer,text,numeric)','execute')
 or has_function_privilege('authenticated','public.complete_shop_checkout(uuid,text,text,text,uuid,jsonb,jsonb,integer)','execute')
 or has_table_privilege('anon','public.shop_checkouts','select') then raise exception 'Public checkout access'; end if;
 insert into public.products(id,slug,name,price_cents,status,manage_stock,stock_quantity)
 values(p,'checkout-test-'||p,'Checkout integration test',999,'published',true,3);
 lines := jsonb_build_array(jsonb_build_object('product_id',p,'variant_id',null,'name','Checkout integration test','quantity',2,'unit_price_cents',999,'option_values','{}'::jsonb));
 perform public.reserve_shop_checkout(c,null,lines,300,'Malta delivery',0.18);
 if (select stock_quantity from public.products where id=p) <> 1 then raise exception 'Reservation stock'; end if;
 rejected := false;
 begin
   perform public.reserve_shop_checkout(c2,null,lines,300,'Malta delivery',0.18);
 exception when others then rejected := true;
 end;
 if not rejected then raise exception 'Overselling accepted'; end if;
 perform public.release_shop_checkout(c);
 perform public.release_shop_checkout(c);
 if (select stock_quantity from public.products where id=p) <> 3 then raise exception 'Release not idempotent'; end if;
 rejected := false;
 begin
   perform public.reserve_shop_checkout(c2,null,jsonb_set(lines,'{0,unit_price_cents}','1'),300,'Malta delivery',0.18);
 exception when others then rejected := true;
 end;
 if not rejected then raise exception 'Client price trusted'; end if;
 perform public.reserve_shop_checkout(c2,null,lines,300,'Malta delivery',0.18);
 rejected := false;
 begin
   perform public.complete_shop_checkout(c2,'test-'||c2,null,'test@example.invalid',null,'{}','{"country":"IT"}',2298);
 exception when others then rejected := true;
 end;
 if not rejected then raise exception 'Foreign address accepted'; end if;
 rejected := false;
 begin
   perform public.complete_shop_checkout(c2,'test-'||c2,null,'test@example.invalid',null,'{}','{"country":"MT"}',1);
 exception when others then rejected := true;
 end;
 if not rejected then raise exception 'Wrong payment accepted'; end if;
 result := public.complete_shop_checkout(c2,'test-'||c2,null,'test@example.invalid',null,'{}','{"country":"MT"}',2298);
 duplicate := public.complete_shop_checkout(c2,'test-'||c2,null,'test@example.invalid',null,'{}','{"country":"MT"}',2298);
 if result <> duplicate then raise exception 'Duplicate order'; end if;
 if (select count(*) from public.order_items where order_id=result) <> 1 then raise exception 'Duplicate lines'; end if;
 if (select vat_cents from public.orders where id=result) <> 351 then raise exception 'VAT rounding'; end if;
 perform public.release_shop_checkout(c2);
 if (select stock_quantity from public.products where id=p) <> 1 then raise exception 'Paid checkout released'; end if;
end $$;
rollback;
