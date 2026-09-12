/*
# TrustShield AI — Full Database Schema

## Overview
Creates the complete database schema for the TrustShield AI Digital Trust & Risk Analysis Platform.
This includes tables for profiles, analyses, risk signals, content/url/media analyses, reviews,
identity relationships, trust history, and user metadata.

## New Tables
1. user_profiles — stores app-level user metadata (name, role) linked to auth.users
2. analyzed_profiles — digital profiles submitted for risk analysis
3. analyses — top-level analysis records (risk_score, trust_score, risk_level, summary)
4. risk_signals — individual risk factors contributing to an analysis score
5. content_analyses — standalone content/text analyses
6. url_analyses — standalone URL analyses
7. media_analyses — standalone image/media analyses
8. reviews — human review records on analyses
9. identity_relationships — relationships between profiles (shared image, domain, etc.)
10. trust_history — trust score changes over time per profile

## Security
- RLS enabled on ALL tables.
- Owner-scoped policies: users can CRUD their own analyses, profiles, content/url/media analyses.
- Reviewers/admins get additional access to the review queue (read all analyses, update reviews).
- Reviews table: reviewers/admins can insert/update; users can read their own reviews.
- Identity relationships and trust history: owner-scoped via profile ownership.
*/

-- ============================================================
-- 1. USER PROFILES (app-level metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','reviewer','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_profile" ON user_profiles;
CREATE POLICY "select_own_user_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_profile" ON user_profiles;
CREATE POLICY "insert_own_user_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_profile" ON user_profiles;
CREATE POLICY "update_own_user_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reviewers/admins can read all user profiles
DROP POLICY IF EXISTS "staff_read_all_user_profiles" ON user_profiles;
CREATE POLICY "staff_read_all_user_profiles" ON user_profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

-- ============================================================
-- 2. ANALYZED PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS analyzed_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text,
  bio text,
  followers integer DEFAULT 0,
  following integer DEFAULT 0,
  account_age_days integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  profile_completion integer DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('verified','unverified','pending')),
  external_links text,
  profile_image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analyzed_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profiles" ON analyzed_profiles;
CREATE POLICY "select_own_profiles" ON analyzed_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profiles" ON analyzed_profiles;
CREATE POLICY "insert_own_profiles" ON analyzed_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profiles" ON analyzed_profiles;
CREATE POLICY "update_own_profiles" ON analyzed_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profiles" ON analyzed_profiles;
CREATE POLICY "delete_own_profiles" ON analyzed_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Reviewers/admins can read all profiles
DROP POLICY IF EXISTS "staff_read_all_profiles" ON analyzed_profiles;
CREATE POLICY "staff_read_all_profiles" ON analyzed_profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

CREATE INDEX IF NOT EXISTS idx_analyzed_profiles_user_id ON analyzed_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_analyzed_profiles_username ON analyzed_profiles(username);

-- ============================================================
-- 3. ANALYSES
-- ============================================================
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES analyzed_profiles(id) ON DELETE CASCADE,
  analysis_type text NOT NULL CHECK (analysis_type IN ('profile','content','url','media','multi')),
  identifier text NOT NULL,
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  trust_score integer NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  risk_level text NOT NULL DEFAULT 'Low Risk',
  summary text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','pending','reviewed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_analyses" ON analyses;
CREATE POLICY "select_own_analyses" ON analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analyses" ON analyses;
CREATE POLICY "insert_own_analyses" ON analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_analyses" ON analyses;
CREATE POLICY "update_own_analyses" ON analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_analyses" ON analyses;
CREATE POLICY "delete_own_analyses" ON analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Reviewers/admins can read all analyses (for review queue)
DROP POLICY IF EXISTS "staff_read_all_analyses" ON analyses;
CREATE POLICY "staff_read_all_analyses" ON analyses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

-- Reviewers/admins can update analysis status
DROP POLICY IF EXISTS "staff_update_analyses" ON analyses;
CREATE POLICY "staff_update_analyses" ON analyses FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_risk_score ON analyses(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_type ON analyses(analysis_type);

-- ============================================================
-- 4. RISK SIGNALS
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  signal_name text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  score_contribution integer NOT NULL DEFAULT 0,
  confidence numeric DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE risk_signals ENABLE ROW LEVEL SECURITY;

-- Users can read signals for their own analyses; reviewers can read all
DROP POLICY IF EXISTS "select_risk_signals" ON risk_signals;
CREATE POLICY "select_risk_signals" ON risk_signals FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM analyses a WHERE a.id = risk_signals.analysis_id AND a.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

DROP POLICY IF EXISTS "insert_risk_signals" ON risk_signals;
CREATE POLICY "insert_risk_signals" ON risk_signals FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM analyses a WHERE a.id = risk_signals.analysis_id AND a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_risk_signals" ON risk_signals;
CREATE POLICY "delete_risk_signals" ON risk_signals FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM analyses a WHERE a.id = risk_signals.analysis_id AND a.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_risk_signals_analysis_id ON risk_signals(analysis_id);

-- ============================================================
-- 5. CONTENT ANALYSES
-- ============================================================
CREATE TABLE IF NOT EXISTS content_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  classification text,
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  explanation text,
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_content_analyses" ON content_analyses;
CREATE POLICY "select_own_content_analyses" ON content_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_content_analyses" ON content_analyses;
CREATE POLICY "insert_own_content_analyses" ON content_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_content_analyses" ON content_analyses;
CREATE POLICY "delete_own_content_analyses" ON content_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Staff can read all
DROP POLICY IF EXISTS "staff_read_content_analyses" ON content_analyses;
CREATE POLICY "staff_read_content_analyses" ON content_analyses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

CREATE INDEX IF NOT EXISTS idx_content_analyses_user_id ON content_analyses(user_id);

-- ============================================================
-- 6. URL ANALYSES
-- ============================================================
CREATE TABLE IF NOT EXISTS url_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  classification text,
  explanation text,
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE url_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_url_analyses" ON url_analyses;
CREATE POLICY "select_own_url_analyses" ON url_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_url_analyses" ON url_analyses;
CREATE POLICY "insert_own_url_analyses" ON url_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_url_analyses" ON url_analyses;
CREATE POLICY "delete_own_url_analyses" ON url_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff_read_url_analyses" ON url_analyses;
CREATE POLICY "staff_read_url_analyses" ON url_analyses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

CREATE INDEX IF NOT EXISTS idx_url_analyses_user_id ON url_analyses(user_id);

-- ============================================================
-- 7. MEDIA ANALYSES
-- ============================================================
CREATE TABLE IF NOT EXISTS media_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  classification text,
  explanation text,
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_media_analyses" ON media_analyses;
CREATE POLICY "select_own_media_analyses" ON media_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_media_analyses" ON media_analyses;
CREATE POLICY "insert_own_media_analyses" ON media_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_media_analyses" ON media_analyses;
CREATE POLICY "delete_own_media_analyses" ON media_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff_read_media_analyses" ON media_analyses;
CREATE POLICY "staff_read_media_analyses" ON media_analyses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

CREATE INDEX IF NOT EXISTS idx_media_analyses_user_id ON media_analyses(user_id);

-- ============================================================
-- 8. REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','confirmed_suspicious','marked_safe','needs_more_evidence')),
  comments text,
  ai_recommendation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can read reviews on their own analyses
DROP POLICY IF EXISTS "select_reviews" ON reviews;
CREATE POLICY "select_reviews" ON reviews FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM analyses a WHERE a.id = reviews.analysis_id AND a.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

-- Reviewers/admins can insert and update reviews
DROP POLICY IF EXISTS "staff_insert_reviews" ON reviews;
CREATE POLICY "staff_insert_reviews" ON reviews FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

DROP POLICY IF EXISTS "staff_update_reviews" ON reviews;
CREATE POLICY "staff_update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

CREATE INDEX IF NOT EXISTS idx_reviews_analysis_id ON reviews(analysis_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ============================================================
-- 9. IDENTITY RELATIONSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS identity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  source_profile_id uuid NOT NULL REFERENCES analyzed_profiles(id) ON DELETE CASCADE,
  target_profile_id uuid NOT NULL REFERENCES analyzed_profiles(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('same_image','same_domain','similar_username','shared_contact','similar_content')),
  confidence numeric DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE identity_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_relationships" ON identity_relationships;
CREATE POLICY "select_own_relationships" ON identity_relationships FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_relationships" ON identity_relationships;
CREATE POLICY "insert_own_relationships" ON identity_relationships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_relationships" ON identity_relationships;
CREATE POLICY "delete_own_relationships" ON identity_relationships FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff_read_relationships" ON identity_relationships;
CREATE POLICY "staff_read_relationships" ON identity_relationships FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

CREATE INDEX IF NOT EXISTS idx_identity_rel_source ON identity_relationships(source_profile_id);
CREATE INDEX IF NOT EXISTS idx_identity_rel_target ON identity_relationships(target_profile_id);

-- ============================================================
-- 10. TRUST HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS trust_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES analyzed_profiles(id) ON DELETE CASCADE,
  trust_score integer NOT NULL DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trust_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trust_history" ON trust_history;
CREATE POLICY "select_own_trust_history" ON trust_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trust_history" ON trust_history;
CREATE POLICY "insert_own_trust_history" ON trust_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trust_history" ON trust_history;
CREATE POLICY "delete_own_trust_history" ON trust_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff_read_trust_history" ON trust_history;
CREATE POLICY "staff_read_trust_history" ON trust_history FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('reviewer','admin'))
  );

CREATE INDEX IF NOT EXISTS idx_trust_history_profile_id ON trust_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_trust_history_created_at ON trust_history(created_at DESC);
