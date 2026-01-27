-- Add admin SELECT policy for access_grants (idempotent)
DO $$ 
BEGIN
  -- Check if admin select policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'access_grants' 
    AND policyname = 'Admins can read all access grants'
  ) THEN
    CREATE POLICY "Admins can read all access grants"
    ON public.access_grants
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Verify payment_claims admin select exists (should already exist, but ensure)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_claims' 
    AND policyname = 'Admins can view all payment claims'
  ) THEN
    CREATE POLICY "Admins can view all payment claims"
    ON public.payment_claims
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;