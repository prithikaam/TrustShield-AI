/*
# Fix remaining recursive staff-read policies

1. Purpose
- Replaces every `EXISTS (SELECT ... FROM user_profiles ...)` staff-access predicate with a direct `auth.jwt() ->> 'role'` check, eliminating all recursion paths that reference `user_profiles` from other tables' policies.

2. Modified tables
- `analyses` — `staff_read_all_analyses`, `staff_update_analyses`
- `analyzed_profiles` — `staff_read_all_profiles`
- `content_analyses` — `staff_read_content_analyses`
- `url_analyses` — `staff_read_url_analyses`
- `media_analyses` — `staff_read_media_analyses`
- `reviews` — `select_reviews`, `staff_insert_reviews`, `staff_update_reviews`
- `identity_relationships` — `staff_read_relationships`
- `trust_history` — `staff_read_trust_history`
- `risk_signals` — `select_risk_signals`

3. Security
- Each owner-scoped policy remains unchanged.
- Staff-wide access now reads the role from `raw_app_meta_data` in the JWT instead of querying `user_profiles`, so there is no self-reference and no recursion.
- A trigger syncs `user_profiles.role` into `auth.users.raw_app_meta_data` so the JWT contains the role.

4. Important notes
- This fully eliminates the "infinite recursion detected in policy for relation user_profiles" error.
- No data is deleted or changed.
*/

-- analyses
DROP POLICY IF EXISTS "staff_read_all_analyses" ON public.analyses;
CREATE POLICY "staff_read_all_analyses" ON public.analyses FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

DROP POLICY IF EXISTS "staff_update_analyses" ON public.analyses;
CREATE POLICY "staff_update_analyses" ON public.analyses FOR UPDATE
  TO authenticated USING (
    (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  ) WITH CHECK (
    (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

-- analyzed_profiles
DROP POLICY IF EXISTS "staff_read_all_profiles" ON public.analyzed_profiles;
CREATE POLICY "staff_read_all_profiles" ON public.analyzed_profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

-- content_analyses
DROP POLICY IF EXISTS "staff_read_content_analyses" ON public.content_analyses;
CREATE POLICY "staff_read_content_analyses" ON public.content_analyses FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

-- url_analyses
DROP POLICY IF EXISTS "staff_read_url_analyses" ON public.url_analyses;
CREATE POLICY "staff_read_url_analyses" ON public.url_analyses FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

-- media_analyses
DROP POLICY IF EXISTS "staff_read_media_analyses" ON public.media_analyses;
CREATE POLICY "staff_read_media_analyses" ON public.media_analyses FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

-- reviews
DROP POLICY IF EXISTS "select_reviews" ON public.reviews;
CREATE POLICY "select_reviews" ON public.reviews FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM analyses a WHERE a.id = reviews.analysis_id AND a.user_id = auth.uid())
    OR (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

DROP POLICY IF EXISTS "staff_insert_reviews" ON public.reviews;
CREATE POLICY "staff_insert_reviews" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (
    (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

DROP POLICY IF EXISTS "staff_update_reviews" ON public.reviews;
CREATE POLICY "staff_update_reviews" ON public.reviews FOR UPDATE
  TO authenticated USING (
    (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  ) WITH CHECK (
    (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

-- identity_relationships
DROP POLICY IF EXISTS "staff_read_relationships" ON public.identity_relationships;
CREATE POLICY "staff_read_relationships" ON public.identity_relationships FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

-- trust_history
DROP POLICY IF EXISTS "staff_read_trust_history" ON public.trust_history;
CREATE POLICY "staff_read_trust_history" ON public.trust_history FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

-- risk_signals
DROP POLICY IF EXISTS "select_risk_signals" ON public.risk_signals;
CREATE POLICY "select_risk_signals" ON public.risk_signals FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM analyses a WHERE a.id = risk_signals.analysis_id AND a.user_id = auth.uid())
    OR (auth.jwt() ->> 'role') IN ('reviewer', 'admin')
  );

-- ============================================================
-- Trigger: sync user_profiles.role into auth.users raw_app_meta_data
-- so auth.jwt() ->> 'role' returns the correct value for staff.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_role ON public.user_profiles;
CREATE TRIGGER trg_sync_user_role
  AFTER INSERT OR UPDATE OF role ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_jwt();