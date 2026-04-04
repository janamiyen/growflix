-- =========================================================
-- COMBINED MIGRATION: Final desired state for green-flix-hub
-- Generated from 12 incremental migrations (20260127 - 20260404)
-- Run on a fresh Supabase database.
-- =========================================================


-- =========================================================
-- 1. ENUMS
-- =========================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TYPE public.subscription_status AS ENUM ('none', 'pending', 'active', 'expired');

CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected');


-- =========================================================
-- 2. TABLES
-- =========================================================

-- User roles (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- User profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    whatsapp TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    status subscription_status NOT NULL DEFAULT 'none',
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment claims (insert via RPC only, admin manages)
CREATE TABLE public.payment_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    name TEXT,
    receipt_url TEXT,
    status claim_status NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Courses
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    cover_image_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lessons
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_preview BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Access grants (email-based access control)
CREATE TABLE public.access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =========================================================
-- 3. FUNCTIONS
-- =========================================================

-- Check if a user has a specific role (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if a user has an active subscription (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Generic trigger function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Auto-create profile, role, and subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    INSERT INTO public.subscriptions (user_id, status)
    VALUES (NEW.id, 'none');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Secure RPC to create payment claims (replaces public INSERT policy)
-- Includes server-side validation for email, whatsapp, and name
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

-- Grant RPC execution to anon and authenticated roles
REVOKE ALL ON FUNCTION public.create_payment_claim(text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_payment_claim(text,text,text,text) TO anon, authenticated;


-- =========================================================
-- 4. TRIGGERS
-- =========================================================

-- updated_at triggers for all tables that have updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_claims_updated_at
    BEFORE UPDATE ON public.payment_claims
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_access_grants_updated_at
    BEFORE UPDATE ON public.access_grants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================================================
-- 5. ROW LEVEL SECURITY (enable + policies)
-- =========================================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- user_roles policies
-- ---------------------------------------------------------

-- Users can see their own roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can see all roles
CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert roles (split from ALL to prevent escalation)
CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update roles
CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------
-- subscriptions policies
-- ---------------------------------------------------------

CREATE POLICY "Users can view their own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
    ON public.subscriptions FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------
-- payment_claims policies
-- NOTE: No public INSERT policy. Insert goes through create_payment_claim RPC.
-- ---------------------------------------------------------

CREATE POLICY "Admins can view all payment claims"
    ON public.payment_claims FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage payment claims"
    ON public.payment_claims FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payment claims"
    ON public.payment_claims FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------
-- courses policies
-- ---------------------------------------------------------

CREATE POLICY "Anyone can view published courses"
    ON public.courses FOR SELECT
    USING (is_published = true);

CREATE POLICY "Admins can view all courses"
    ON public.courses FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage courses"
    ON public.courses FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------
-- lessons policies
-- ---------------------------------------------------------

-- Anyone can view preview lessons
CREATE POLICY "Anyone can view preview lessons"
    ON public.lessons FOR SELECT
    USING (is_preview = true);

-- Active subscribers OR users with valid access_grants can view all lessons
CREATE POLICY "Active subscribers can view all lessons"
    ON public.lessons FOR SELECT
    USING (
      public.has_active_subscription(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.access_grants
        WHERE lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
          AND status = 'active'
          AND expires_at > now()
      )
    );

CREATE POLICY "Admins can view all lessons"
    ON public.lessons FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage lessons"
    ON public.lessons FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------
-- access_grants policies
-- ---------------------------------------------------------

-- Users can read their own grant (ownership by email, no status/expiry check in RLS)
CREATE POLICY "Users can read own access grant by email"
    ON public.access_grants FOR SELECT
    USING (
      lower(trim(email)) = lower(trim((auth.jwt() ->> 'email')))
    );

-- Admins can read all access grants
CREATE POLICY "Admins can read all access grants"
    ON public.access_grants FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert access grants
CREATE POLICY "Admins can insert access grants"
    ON public.access_grants FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update access grants
CREATE POLICY "Admins can update access grants"
    ON public.access_grants FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete access grants
CREATE POLICY "Admins can delete access grants"
    ON public.access_grants FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));


-- =========================================================
-- 6. STORAGE BUCKETS
-- =========================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('course-covers', 'course-covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false);


-- =========================================================
-- 7. STORAGE POLICIES
-- =========================================================

-- ---------------------------------------------------------
-- course-covers (public bucket: anyone can read, admins manage)
-- ---------------------------------------------------------

CREATE POLICY "Anyone can view course covers"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'course-covers');

CREATE POLICY "Admins can upload course covers"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'course-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update course covers"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'course-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete course covers"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'course-covers' AND public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------
-- course-videos (private: admins manage, subscribers + access_grants can view)
-- ---------------------------------------------------------

-- Admins full access
CREATE POLICY "Admins can manage course videos"
    ON storage.objects FOR ALL
    USING (bucket_id = 'course-videos' AND public.has_role(auth.uid(), 'admin'));

-- Subscribers OR users with valid access_grants can view (fixed in 20260404)
CREATE POLICY "Active subscribers can view course videos"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'course-videos'
      AND (
        public.has_active_subscription(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.access_grants
          WHERE lower(trim(email)) = lower(trim((auth.jwt() ->> 'email')))
            AND status = 'active'
            AND expires_at > now()
        )
      )
    );

-- ---------------------------------------------------------
-- payment-receipts (private: authenticated upload, admins manage/view)
-- ---------------------------------------------------------

-- Authenticated users can upload (restricted from "anyone" in 20260330 fix)
CREATE POLICY "Authenticated users can upload payment receipts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Admins can view payment receipts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage payment receipts"
    ON storage.objects FOR ALL
    USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
