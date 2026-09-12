// ===== TrustShield AI — Type Definitions =====

export type RiskLevel =
  | 'Trusted'
  | 'Low Risk'
  | 'Medium Risk'
  | 'High Risk'
  | 'Critical';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type AnalysisType = 'profile' | 'content' | 'url' | 'media' | 'multi';

export type SignalCategory = 'identity' | 'behavioral' | 'content' | 'url' | 'media';

export type ReviewStatus =
  | 'pending'
  | 'under_review'
  | 'confirmed_suspicious'
  | 'marked_safe'
  | 'needs_more_evidence';

export type UserRole = 'user' | 'reviewer' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface AnalyzedProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  account_age_days: number;
  posts_count: number;
  profile_completion: number;
  verification_status: string;
  external_links: string | null;
  profile_image_url: string | null;
  created_at: string;
}

export interface RiskSignal {
  id?: string;
  analysis_id?: string;
  signal_type: SignalCategory;
  signal_name: string;
  description: string;
  severity: Severity;
  score_contribution: number;
  confidence: number;
  created_at?: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  profile_id: string | null;
  analysis_type: AnalysisType;
  identifier: string;
  risk_score: number;
  trust_score: number;
  risk_level: RiskLevel;
  summary: string | null;
  status: string;
  created_at: string;
  analyzed_profiles?: AnalyzedProfile;
  risk_signals?: RiskSignal[];
  reviews?: Review[];
}

export interface ContentAnalysis {
  id: string;
  user_id: string;
  content: string;
  classification: string | null;
  risk_score: number;
  explanation: string | null;
  analysis_id: string | null;
  created_at: string;
}

export interface UrlAnalysis {
  id: string;
  user_id: string;
  url: string;
  risk_score: number;
  classification: string | null;
  explanation: string | null;
  analysis_id: string | null;
  created_at: string;
}

export interface MediaAnalysis {
  id: string;
  user_id: string;
  file_url: string;
  risk_score: number;
  classification: string | null;
  explanation: string | null;
  analysis_id: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  analysis_id: string;
  reviewer_id: string | null;
  status: ReviewStatus;
  comments: string | null;
  ai_recommendation: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdentityRelationship {
  id: string;
  user_id: string;
  source_profile_id: string;
  target_profile_id: string;
  relationship_type: 'same_image' | 'same_domain' | 'similar_username' | 'shared_contact' | 'similar_content';
  confidence: number;
  created_at: string;
}

export interface TrustHistoryEntry {
  id: string;
  user_id: string;
  profile_id: string;
  trust_score: number;
  risk_score: number;
  reason: string | null;
  created_at: string;
}

// ===== Risk Engine Types =====

export interface ProfileInput {
  username: string;
  display_name: string;
  bio: string;
  followers: number;
  following: number;
  account_age_days: number;
  posts_count: number;
  profile_completion: number;
  verification_status: string;
  external_links: string;
  profile_image_url?: string | null;
}

export interface CategoryScore {
  category: SignalCategory;
  score: number;
  signals: RiskSignal[];
}

export interface RiskResult {
  risk_score: number;
  trust_score: number;
  risk_level: RiskLevel;
  summary: string;
  signals: RiskSignal[];
  category_scores: CategoryScore[];
  ai_recommendation: string;
  is_demo: boolean;
}

export interface ContentRiskResult {
  risk_score: number;
  trust_score: number;
  risk_level: RiskLevel;
  classification: string;
  explanation: string;
  signals: RiskSignal[];
  ai_recommendation: string;
  is_demo: boolean;
}

export interface UrlRiskResult {
  risk_score: number;
  trust_score: number;
  risk_level: RiskLevel;
  classification: string;
  explanation: string;
  signals: RiskSignal[];
  ai_recommendation: string;
  is_demo: boolean;
  has_external_intel: boolean;
}

export interface MediaRiskResult {
  risk_score: number;
  trust_score: number;
  risk_level: RiskLevel;
  classification: string;
  explanation: string;
  signals: RiskSignal[];
  ai_recommendation: string;
  is_demo: boolean;
}
