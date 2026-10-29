-- Split the admin "for all" policies into insert/update/delete so each
-- table has one SELECT policy per role (fixes the multiple_permissive_policies
-- advisor). Every SELECT policy already lets admins read everything.

do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('post_categories', 'Admins can manage'),
      ('post_tags', 'Admins can manage'),
      ('post_category_links', 'Admins can manage'),
      ('post_tag_links', 'Admins can manage'),
      ('directory_terms', 'Admins can manage'),
      ('vehicle_media', 'Admins can manage'),
      ('redirects', 'Admins can manage'),
      ('settings', 'Admins can manage'),
      ('product_categories', 'Admins can manage'),
      ('product_tags', 'Admins can manage'),
      ('product_variants', 'Admins can manage'),
      ('product_media', 'Admins can manage'),
      ('product_category_links', 'Admins can manage'),
      ('product_tag_links', 'Admins can manage'),
      ('products', 'Admins can manage products'),
      ('orders', 'Admins manage orders'),
      ('order_items', 'Admins manage order items'),
      ('order_notes', 'Admins manage order notes')
    ) as v(tbl, policy)
  loop
    execute format('drop policy %I on public.%I', t.policy, t.tbl);
    execute format('create policy "Admins can insert" on public.%I for insert to authenticated with check ((select private.is_admin()))', t.tbl);
    execute format('create policy "Admins can update" on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t.tbl);
    execute format('create policy "Admins can delete" on public.%I for delete to authenticated using ((select private.is_admin()))', t.tbl);
  end loop;
end $$;

-- business_terms: one public SELECT policy, owner/admin writes split out.
drop policy "Owners and admins manage listing terms" on public.business_terms;

create policy "Owners and admins add listing terms"
  on public.business_terms for insert
  to authenticated
  with check (
    (select private.is_admin())
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  );

create policy "Owners and admins remove listing terms"
  on public.business_terms for delete
  to authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  );

-- media inserts: merge the admin and business-logo rules into one policy.
drop policy "Admins can add media" on public.media;
drop policy "Business owners record their logo" on public.media;

create policy "Admins and logo uploads can add media"
  on public.media for insert
  to authenticated
  with check (
    (select private.is_admin())
    or (
      uploaded_by = (select auth.uid())
      and path like 'business/' || (select auth.uid())::text || '/%'
    )
  );
