-- =========================================================
-- access_grants: table + updated_at trigger + RLS policies
-- Idempotent migration
-- =========================================================

-- 1) Table
CREATE TABLE IF NOT EXISTS public.access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active | revoked
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Ensure updated_at trigger exists (uses existing function public.update_updated_at_column())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_access_grants_updated_at'
  ) THEN
    CREATE TRIGGER update_access_grants_updated_at
    BEFORE UPDATE ON public.access_grants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Enable RLS
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- 4) Drop policies if exist (to be fully idempotent)
DROP POLICY IF EXISTS "Users can read own access grant by email" ON public.access_grants;
DROP POLICY IF EXISTS "Admins can insert access grants" ON public.access_grants;
DROP POLICY IF EXISTS "Admins can update access grants" ON public.access_grants;
DROP POLICY IF EXISTS "Admins can delete access grants" ON public.access_grants;

-- 5) RLS Policies (ownership-only for SELECT, admin-only for write)

-- SELECT: ownership-only (NO status/expiry validation in RLS)
CREATE POLICY "Users can read own access grant by email"
ON public.access_grants
FOR SELECT
USING (
  lower(trim(email)) = lower(trim((auth.jwt() ->> 'email')))
);

-- INSERT: admin-only
CREATE POLICY "Admins can insert access grants"
ON public.access_grants
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- UPDATE: admin-only
CREATE POLICY "Admins can update access grants"
ON public.access_grants
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DELETE: admin-only
CREATE POLICY "Admins can delete access grants"
ON public.access_grants
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));