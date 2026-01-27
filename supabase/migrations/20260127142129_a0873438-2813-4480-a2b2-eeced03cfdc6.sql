-- =============================================
-- FIX: access_grants RLS - SELECT should only check email ownership
-- The status/expiry validation happens in application code
-- =============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can read own access grant by email" ON public.access_grants;

-- Create corrected SELECT policy - only checks email ownership
-- Status and expiry validation happens in useAccessGrant hook
CREATE POLICY "Users can read own access grant by email"
ON public.access_grants
FOR SELECT
USING (
    lower(trim(email)) = lower(trim((auth.jwt() ->> 'email')))
);