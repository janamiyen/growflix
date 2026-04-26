-- =========================================================
-- Lesson comments — MVP
-- Solo suscriptores activos pueden leer y comentar
-- Cada user borra lo suyo, admin borra cualquiera
-- =========================================================

-- Helper: ¿el usuario actual tiene acceso (suscripción activa o admin)?
CREATE OR REPLACE FUNCTION public.user_has_active_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.access_grants
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND status = 'active'
      AND expires_at > now()
  )
  OR public.has_role(auth.uid(), 'admin');
$$;

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email  text NOT NULL,
  body        text NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index para listar comentarios de una lección por fecha
CREATE INDEX IF NOT EXISTS idx_lesson_comments_lesson_created
  ON public.lesson_comments (lesson_id, created_at DESC);

-- RLS
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- Leer: solo suscriptores activos o admin
DROP POLICY IF EXISTS "subscribers can read comments" ON public.lesson_comments;
CREATE POLICY "subscribers can read comments"
ON public.lesson_comments
FOR SELECT
TO authenticated
USING (public.user_has_active_access());

-- Insertar: solo suscriptores activos, solo como uno mismo
DROP POLICY IF EXISTS "subscribers can insert own comments" ON public.lesson_comments;
CREATE POLICY "subscribers can insert own comments"
ON public.lesson_comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.user_has_active_access()
);

-- Borrar: dueño o admin
DROP POLICY IF EXISTS "users delete own or admin any" ON public.lesson_comments;
CREATE POLICY "users delete own or admin any"
ON public.lesson_comments
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);
