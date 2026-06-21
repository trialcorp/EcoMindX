-- Phase 2.2: Restrict community_tips insert policy to authenticated users
-- The previous policy allowed any anonymous user to insert tips, creating a spam vector.
-- We now require the user to be authenticated or at least have a valid device_id constraint.
-- Actually, the best approach for this app is requiring authenticated users to post, 
-- or anonymous users must provide a device_id that exists in entries (though user_id is safer).
-- The app currently doesn't mandate auth to post tips, but requires an author_name.
-- To prevent total spam, we will only allow authenticated users to post.

DROP POLICY IF EXISTS "Allow authenticated/anon insert community_tips" ON public.community_tips;

CREATE POLICY "Authenticated users can insert tips"
ON public.community_tips
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Wait, the client allows anonymous tips. If we enforce this, anonymous users can't post.
-- Let's check the client code: `saveTip(..., userId?)`. It passes userId if available.
-- If we want to allow anonymous tips but restrict spam, we can enforce that anonymous 
-- tips cannot set `user_id`, while authenticated tips MUST set `user_id`.
-- The original problem statement mentioned "Anyone (even unauthenticated) can insert tips — opens spam vector"
-- We will enforce that only authenticated users can insert.

-- Alternative: If anonymous tips are a feature, we could add a rate limit trigger, but 
-- requiring authentication is the standard fix for "opens spam vector" in this context.
