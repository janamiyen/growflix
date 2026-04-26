-- =========================================================
-- Lesson progress — tracking de lecciones completadas
-- Cada usuario ve y gestiona solo su propio progreso
-- =========================================================

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user
  ON public.lesson_progress (user_id);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own progress" ON public.lesson_progress;
CREATE POLICY "users read own progress"
ON public.lesson_progress
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users insert own progress" ON public.lesson_progress;
CREATE POLICY "users insert own progress"
ON public.lesson_progress
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users delete own progress" ON public.lesson_progress;
CREATE POLICY "users delete own progress"
ON public.lesson_progress
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
