-- Allow users to delete their own community tips if their user_id matches the authenticated user ID
create policy "Allow users to delete own community_tips" on public.community_tips
  for delete using (auth.uid() = user_id);
