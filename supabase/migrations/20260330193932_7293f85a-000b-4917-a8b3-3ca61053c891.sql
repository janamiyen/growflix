
-- =========================================================
-- Security fixes: lessons RLS, user_roles escalation, 
-- create_payment_claim validation, storage upload restriction
-- =========================================================

-- 1) FIX: Lessons RLS — also check access_grants
DROP POLICY IF EXISTS "Active subscribers can view all lessons" ON public.lessons;
CREATE POLICY "Active subscribers can view all lessons"
ON public.lessons FOR SELECT
TO public
USING (
  public.has_active_subscription(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.access_grants
    WHERE lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
      AND status = 'active'
      AND expires_at > now()
  )
);

-- 2) FIX: user_roles privilege escalation — replace ALL with specific commands
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO public
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) FIX: create_payment_claim — add server-side validation
CREATE OR REPLACE FUNCTION public.create_payment_claim(
  _name text, _email text, _whatsapp text, _receipt_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _id uuid;
  _clean_email text;
  _clean_whatsapp text;
  _clean_name text;
BEGIN
  -- Validate email format
  _clean_email := lower(trim(_email));
  IF _clean_email !~ '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  IF char_length(_clean_email) > 255 THEN
    RAISE EXCEPTION 'Email too long';
  END IF;

  -- Validate whatsapp (digits, spaces, +, -, 8-20 meaningful digits)
  _clean_whatsapp := nullif(trim(_whatsapp), '');
  IF _clean_whatsapp IS NOT NULL THEN
    IF char_length(_clean_whatsapp) > 30 THEN
      RAISE EXCEPTION 'WhatsApp number too long';
    END IF;
    -- Must contain at least 8 digits
    IF length(regexp_replace(_clean_whatsapp, '[^0-9]', '', 'g')) < 8 THEN
      RAISE EXCEPTION 'WhatsApp number too short';
    END IF;
  END IF;

  -- Validate name length
  _clean_name := nullif(trim(_name), '');
  IF _clean_name IS NOT NULL AND char_length(_clean_name) > 100 THEN
    RAISE EXCEPTION 'Name too long';
  END IF;

  INSERT INTO public.payment_claims (name, email, whatsapp, receipt_url, status)
  VALUES (
    _clean_name,
    _clean_email,
    _clean_whatsapp,
    _receipt_url,
    'pending'
  )
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_payment_claim(text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_payment_claim(text,text,text,text) TO anon, authenticated;

-- 4) FIX: Restrict payment-receipts uploads to authenticated users
DROP POLICY IF EXISTS "Anyone can upload payment receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-receipts');
