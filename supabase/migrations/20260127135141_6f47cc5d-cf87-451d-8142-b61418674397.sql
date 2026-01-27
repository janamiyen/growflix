-- Drop existing policy that uses auth.email()
DROP POLICY IF EXISTS "Users can read own access grant by email" ON public.access_grants;

-- Create new policy using JWT
CREATE POLICY "Users can read own access grant by email"
ON public.access_grants
FOR SELECT
USING (lower((auth.jwt() ->> 'email')) = email);