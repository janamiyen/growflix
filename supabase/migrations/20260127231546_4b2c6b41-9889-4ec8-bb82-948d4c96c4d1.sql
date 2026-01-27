-- 0) Asegurar RLS
ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;

-- 1) Borrar policy pública de INSERT si existe
DROP POLICY IF EXISTS "Anyone can create payment claims" ON public.payment_claims;

-- 2) SOLO admins pueden leer
DROP POLICY IF EXISTS "Admins can view all payment claims" ON public.payment_claims;
CREATE POLICY "Admins can view all payment claims"
ON public.payment_claims
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Admins pueden gestionar (update)
DROP POLICY IF EXISTS "Admins can manage payment claims" ON public.payment_claims;
CREATE POLICY "Admins can manage payment claims"
ON public.payment_claims
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Admins pueden borrar
DROP POLICY IF EXISTS "Admins can delete payment claims" ON public.payment_claims;
CREATE POLICY "Admins can delete payment claims"
ON public.payment_claims
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5) RPC segura para insertar claims (sin policy pública)
CREATE OR REPLACE FUNCTION public.create_payment_claim(
  _name text,
  _email text,
  _whatsapp text,
  _receipt_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO public.payment_claims (name, email, whatsapp, receipt_url, status)
  VALUES (
    nullif(trim(_name), ''),
    lower(trim(_email)),
    nullif(trim(_whatsapp), ''),
    _receipt_url,
    'pending'
  )
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- 6) Permitir ejecutar RPC a anon/auth
REVOKE ALL ON FUNCTION public.create_payment_claim(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_payment_claim(text,text,text,text) TO anon, authenticated;