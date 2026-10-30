-- Owners may remove only their own listing. Existing admin delete access remains.
-- Terms cascade with the listing; media and the account are retained.
create policy "Owners delete their listing"
on public.businesses for delete
to authenticated
using (owner_id = (select auth.uid()));
