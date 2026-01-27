-- =============================================
-- IDEMPOTENT: access_grants table + RLS ownership-only
-- =============================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.access_grants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'active',
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at (idempotent)
DROP TRIGGER IF EXISTS update_access_grants_updated_at ON public.access_grants;
CREATE TRIGGER update_access_grants_updated_at
    BEFORE UPDATE ON public.access_grants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES (ownership-only for SELECT)
-- =============================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own access grant" ON public.access_grants;
DROP POLICY IF EXISTS "Users can read own access grant by email" ON public.access_grants;
DROP POLICY IF EXISTS "Admins manage access grants" ON public.access_grants;
DROP POLICY IF EXISTS "Admins can insert access grants" ON public.access_grants;
DROP POLICY IF EXISTS "Admins can update access grants" ON public.access_grants;
DROP POLICY IF EXISTS "Admins can delete access grants" ON public.access_grants;

-- SELECT: Ownership only (no status/expiry check in RLS)
-- The app validates status='active' AND expires_at > now()
CREATE POLICY "Users can read own access grant by email"
ON public.access_grants
FOR SELECT
USING (
    lower(trim(email)) = lower(trim((auth.jwt() ->> 'email')))
);

-- INSERT: Admin only
CREATE POLICY "Admins can insert access grants"
ON public.access_grants
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- UPDATE: Admin only
CREATE POLICY "Admins can update access grants"
ON public.access_grants
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DELETE: Admin only
CREATE POLICY "Admins can delete access grants"
ON public.access_grants
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));