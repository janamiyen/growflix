-- =========================================================
-- FIX: course-videos storage policy
-- Currently only checks has_active_subscription() but the app
-- uses access_grants for access control.
-- Add access_grants check so paying users can watch videos.
-- =========================================================

-- Drop the existing subscriber-only policy
DROP POLICY IF EXISTS "Active subscribers can view course videos" ON storage.objects;

-- Recreate with access_grants check
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
