-- Create access_grants table for email-based access
CREATE TABLE public.access_grants (
    email text PRIMARY KEY,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add updated_at trigger
CREATE TRIGGER update_access_grants_updated_at
    BEFORE UPDATE ON public.access_grants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all access grants
CREATE POLICY "Admins manage access grants"
    ON public.access_grants
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policy: Users can read their own access grant by email
CREATE POLICY "Users can read own access grant by email"
    ON public.access_grants
    FOR SELECT
    USING (auth.jwt() ->> 'email' = email);