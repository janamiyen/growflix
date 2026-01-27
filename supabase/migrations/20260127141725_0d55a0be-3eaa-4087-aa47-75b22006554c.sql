-- =============================================
-- IDEMPOTENT MIGRATION: access_grants table with proper RLS
-- =============================================

-- Create table if not exists (idempotent)
CREATE TABLE IF NOT EXISTS public.access_grants (
    email text PRIMARY KEY,
    status text NOT NULL DEFAULT 'active',
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraint for status values (drop first if exists for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'access_grants_status_check'
    ) THEN
        ALTER TABLE public.access_grants 
        ADD CONSTRAINT access_grants_status_check 
        CHECK (status IN ('active', 'revoked'));
    END IF;
END $$;

-- Create or replace trigger for updated_at
DROP TRIGGER IF EXISTS update_access_grants_updated_at ON public.access_grants;
CREATE TRIGGER update_access_grants_updated_at
    BEFORE UPDATE ON public.access_grants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins manage access grants" ON public.access_grants;
DROP POLICY IF EXISTS "Users can read own access grant" ON public.access_grants;
DROP POLICY IF EXISTS "Users can read own access grant by email" ON public.access_grants;

-- Policy: Admins can do everything
CREATE POLICY "Admins manage access grants"
ON public.access_grants
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Users can only read their own ACTIVE and NON-EXPIRED grant
-- Using JWT email claim with proper normalization
CREATE POLICY "Users can read own access grant by email"
ON public.access_grants
FOR SELECT
USING (
    lower(trim(email)) = lower(trim((auth.jwt() ->> 'email')))
    AND status = 'active'
    AND expires_at > now()
);