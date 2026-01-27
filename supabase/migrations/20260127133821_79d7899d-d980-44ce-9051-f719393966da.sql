-- Drop the old policy
DROP POLICY IF EXISTS "Users can read own access grant by email" ON public.access_grants;

-- Create new policy using auth.email()
CREATE POLICY "Users can read own access grant by email"
    ON public.access_grants
    FOR SELECT
    USING (lower(auth.email()) = email);