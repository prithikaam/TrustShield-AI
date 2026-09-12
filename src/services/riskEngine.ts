// TrustShield AI — Deterministic Demo Risk Engine
//
// IMPORTANT: This is a rule-based heuristic engine, NOT a trained ML model.
// It provides deterministic, explainable risk scores for demonstration purposes.
// When an external AI API is configured, the analysis can be augmented with
// AI-powered insights via the AI service abstraction layer.

import type {
  ProfileInput,
  RiskSignal,
  CategoryScore,
  RiskResult,
  ContentRiskResult,
  UrlRiskResult,
  MediaRiskResult,
  SignalCategory,
  Severity,
} from '@/types';
import {
  scoreToRiskLevel,
  clampScore,
  trustFromRisk,
  getAiRecommendation,
  normalizeCategoryScore,
  normalizeRiskScore,
  rawCategoryScore,
  calculateWeightedRiskScore,
  CATEGORY_MAX_RAW,
  signalContributionScore,
} from '@/lib/risk-utils';

function makeSignal(
  type: SignalCategory,
  name: string,
  description: string,
  severity: Severity,
  contribution: number,
  confidence: number = 0.7,
): RiskSignal {
  return {
    signal_type: type,
    signal_name: name,
    description,
    severity,
    score_contribution: signalContributionScore({ severity, score_contribution: contribution }),
    confidence,
  };
}

// ========================
// PROFILE RISK ANALYSIS
// ========================

export function analyzeProfile(input: ProfileInput): RiskResult {
  const identitySignals = analyzeIdentitySignals(input);
  const behavioralSignals = analyzeBehavioralSignals(input);
  const contentSignals = analyzeContentSignals(input.bio, input.display_name, input.username);
  const urlSignals = analyzeUrlSignals(input.external_links);
  const mediaSignals = analyzeMediaSignals(input.profile_image_url, input.profile_completion);

  const categories: CategoryScore[] = [
    { category: 'identity', score: categoryScore(identitySignals, 'identity'), signals: identitySignals },
    { category: 'behavioral', score: categoryScore(behavioralSignals, 'behavioral'), signals: behavioralSignals },
    { category: 'content', score: categoryScore(contentSignals, 'content'), signals: contentSignals },
    { category: 'url', score: categoryScore(urlSignals, 'url'), signals: urlSignals },
    { category: 'media', score: categoryScore(mediaSignals, 'media'), signals: mediaSignals },
  ];

  const riskScore = calculateWeightedRiskScore(categories);
  const riskLevel = scoreToRiskLevel(riskScore);
  const allSignals = categories.flatMap((c) => c.signals);

  return {
    risk_score: riskScore,
    trust_score: trustFromRisk(riskScore),
    risk_level: riskLevel,
    summary: buildProfileSummary(input, categories, riskLevel),
    signals: allSignals,
    category_scores: categories,
    ai_recommendation: getAiRecommendation(riskLevel),
    is_demo: true,
  };
}

function categoryScore(signals: RiskSignal[], category: SignalCategory): number {
  return normalizeCategoryScore(rawCategoryScore(signals), category);
}

// ========================
// IDENTITY SIGNALS
// ========================

function analyzeIdentitySignals(input: ProfileInput): RiskSignal[] {
  const signals: RiskSignal[] = [];

  // Username pattern: random numbers/suffixes indicate potential fake
  const usernameLower = input.username.toLowerCase();
  const hasRandomNumbers = /\d{3,}/.test(usernameLower);
  const hasSuspiciousKeywords = /(fake|shop|store|deal|offer|official|free|giveaway|prize)/.test(usernameLower);
  if (hasRandomNumbers && hasSuspiciousKeywords) {
    signals.push(makeSignal('identity', 'Suspicious Username Pattern',
      'Username combines commercial keywords with random numeric suffixes, a common pattern in fraudulent accounts.',
      'high', 18, 0.75));
  } else if (hasRandomNumbers) {
    signals.push(makeSignal('identity', 'Random Numeric Suffix',
      'Username contains random numeric sequences which may indicate auto-generated accounts.',
      'medium', 10, 0.6));
  } else if (hasSuspiciousKeywords) {
    signals.push(makeSignal('identity', 'Commercial Username Keywords',
      'Username contains commercial keywords (shop, store, deal, offer) that are common in scam profiles.',
      'medium', 8, 0.65));
  }

  // Display name consistency
  if (input.display_name && input.username) {
    const dn = input.display_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const un = input.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dn && un && dn !== un) {
      const similarity = stringSimilarity(dn, un);
      if (similarity < 0.3) {
        signals.push(makeSignal('identity', 'Name Inconsistency',
          'Display name differs significantly from username, which can indicate impersonation or identity masking.',
          'medium', 8, 0.55));
      }
    }
  }

  // Profile completeness
  if (input.profile_completion < 40) {
    signals.push(makeSignal('identity', 'Low Profile Completeness',
      `Profile is only ${input.profile_completion}% complete. Incomplete profiles are a weak identity signal.`,
      'low', 5, 0.5));
  } else if (input.profile_completion >= 80) {
    signals.push(makeSignal('identity', 'High Profile Completeness',
      'Profile is well-completed, which is a positive trust indicator.',
      'low', 0, 0.5));
  }

  // Verification status
  if (input.verification_status === 'verified') {
    signals.push(makeSignal('identity', 'Verified Account',
      'Account carries a verified badge, which is a positive trust indicator.',
      'low', 0, 0.8));
  } else if (input.verification_status === 'unverified') {
    signals.push(makeSignal('identity', 'Unverified Account',
      'Account is not verified. This alone is not suspicious but contributes to overall identity assessment.',
      'low', 3, 0.4));
  }

  return signals;
}

// ========================
// BEHAVIORAL SIGNALS
// ========================

function analyzeBehavioralSignals(input: ProfileInput): RiskSignal[] {
  const signals: RiskSignal[] = [];

  // Account age
  if (input.account_age_days <= 7) {
    signals.push(makeSignal('behavioral', 'Newly Created Account',
      `Account is only ${input.account_age_days} day(s) old. New accounts have had less time to establish trust.`,
      'high', 20, 0.75));
  } else if (input.account_age_days <= 30) {
    signals.push(makeSignal('behavioral', 'Recent Account',
      `Account is ${input.account_age_days} days old. Relatively new with limited history.`,
      'medium', 12, 0.6));
  } else if (input.account_age_days <= 90) {
    signals.push(makeSignal('behavioral', 'Young Account',
      `Account is ${input.account_age_days} days old. Some history exists but still relatively new.`,
      'low', 5, 0.5));
  }

  // Followers/following ratio
  const ratio = input.followers > 0 ? input.following / input.followers : input.following > 0 ? 999 : 0;
  if (ratio > 50) {
    signals.push(makeSignal('behavioral', 'Extreme Following-to-Follower Ratio',
      `Following ${input.following} with only ${input.followers} followers (ratio: ${ratio.toFixed(1)}:1). This extreme imbalance is common in bot/fake accounts.`,
      'high', 18, 0.75));
  } else if (ratio > 10) {
    signals.push(makeSignal('behavioral', 'High Following-to-Follower Ratio',
      `Following ${input.following} vs ${input.followers} followers (ratio: ${ratio.toFixed(1)}:1). Unusual following pattern.`,
      'medium', 12, 0.65));
  } else if (ratio > 3) {
    signals.push(makeSignal('behavioral', 'Elevated Following-to-Follower Ratio',
      `Following/follower ratio is ${ratio.toFixed(1)}:1, slightly above typical patterns.`,
      'low', 5, 0.5));
  }

  // Posts/activity
  if (input.posts_count <= 3 && input.account_age_days > 7) {
    signals.push(makeSignal('behavioral', 'Very Low Activity',
      `Only ${input.posts_count} post(s) despite account age. Low engagement can indicate dormant or throwaway accounts.`,
      'medium', 8, 0.55));
  } else if (input.posts_count <= 2) {
    signals.push(makeSignal('behavioral', 'Minimal Posts',
      `Only ${input.posts_count} post(s). New accounts with minimal content may not have established legitimacy.`,
      'low', 5, 0.5));
  }

  // Unusual activity: high following + very low posts + new account
  if (input.following > 1000 && input.posts_count < 5 && input.account_age_days < 30) {
    signals.push(makeSignal('behavioral', 'Coordinated Activity Pattern',
      'High following count combined with minimal posts and recent creation suggests possible automated or coordinated behavior.',
      'critical', 15, 0.7));
  }

  return signals;
}

// ========================
// CONTENT SIGNALS
// ========================

const SCAM_PATTERNS = [
  { regex: /(won|win|winner|congratulations|prize|lottery|jackpot)/gi, name: 'Unrealistic Reward', desc: 'Content references winning prizes or rewards, a common social engineering tactic.', severity: 'high' as Severity, score: 18 },
  { regex: /(pay|payment|fee|charge|deposit|transfer|send.*money|wire)/gi, name: 'Financial Request', desc: 'Content requests payment or money transfer.', severity: 'high' as Severity, score: 18 },
  { regex: /(urgent|immediately|now|right now|limited time|act fast|hurry|expires?|deadline)/gi, name: 'Urgency Language', desc: 'Content uses urgency-based language to pressure quick action.', severity: 'medium' as Severity, score: 12 },
  { regex: /(click.*link|click here|visit.*link|tap.*link|go to.*link)/gi, name: 'Link Solicitation', desc: 'Content directs users to click a link, potentially leading to phishing sites.', severity: 'medium' as Severity, score: 10 },
  { regex: /(claim|reward|bonus|cash|money|gift|free|giveaway)/gi, name: 'Financial Lure', desc: 'Content offers financial rewards or free items as incentive.', severity: 'medium' as Severity, score: 10 },
  { regex: /(password|otp|pin|code|verify.*account|confirm.*identity|login credential)/gi, name: 'Credential Request', desc: 'Content may request sensitive credentials or verification codes.', severity: 'critical' as Severity, score: 25 },
  { regex: /(bank|account.*detail|card.*number|cvv|ssn|social security)/gi, name: 'Sensitive Information Request', desc: 'Content references sensitive financial or personal information.', severity: 'critical' as Severity, score: 22 },
  { regex: /(official|verified|authorized|legitimate|genuine|trusted)/gi, name: 'False Authority Claim', desc: 'Content claims official or verified status without evidence.', severity: 'medium' as Severity, score: 8 },
  { regex: /(whatsapp|telegram|signal|dm me|pm me|contact.*privately)/gi, name: 'Off-Platform Solicitation', desc: 'Content redirects communication to private channels, bypassing platform safeguards.', severity: 'medium' as Severity, score: 10 },
  { regex: /(investment|crypto|bitcoin|forex|trading|double your|roi|returns?|profit)/gi, name: 'Investment Scheme Language', desc: 'Content uses investment-related language common in financial scams.', severity: 'high' as Severity, score: 15 },
];

export function analyzeContentSignals(
  text: string,
  displayName?: string,
  username?: string,
): RiskSignal[] {
  const signals: RiskSignal[] = [];
  if (!text || text.trim().length === 0) return signals;

  const lowerText = text.toLowerCase();

  for (const pattern of SCAM_PATTERNS) {
    if (pattern.regex.test(text)) {
      signals.push(makeSignal('content', pattern.name, pattern.desc, pattern.severity, pattern.score, 0.7));
      pattern.regex.lastIndex = 0;
    }
  }

  // Impersonation indicators
  if (displayName && username) {
    if (/official|verified|real|the.*official/i.test(displayName) && input_verificationStatus(username)) {
      signals.push(makeSignal('content', 'Potential Impersonation',
        'Display name claims official/verified status. This is a common impersonation tactic.',
        'high', 15, 0.65));
    }
  }

  // Excessive capitalization (shouting)
  const upperChars = text.replace(/[^A-Z]/g, '').length;
  const letterChars = text.replace(/[^a-zA-Z]/g, '').length;
  if (letterChars > 10 && upperChars / letterChars > 0.5) {
    signals.push(makeSignal('content', 'Excessive Capitalization',
      'Content uses excessive capitalization, a manipulation tactic to create urgency and attention.',
      'low', 5, 0.5));
  }

  // Excessive exclamation marks
  const exclaimCount = (text.match(/!/g) || []).length;
  if (exclaimCount >= 3) {
    signals.push(makeSignal('content', 'Excessive Punctuation',
      'Content uses multiple exclamation marks, common in scam and spam messages.',
      'low', 4, 0.45));
  }

  return signals;
}

function input_verificationStatus(username: string): boolean {
  return !username.toLowerCase().includes('verified');
}

// ========================
// URL SIGNALS
// ========================

export function analyzeUrlSignals(urls: string): RiskSignal[] {
  const signals: RiskSignal[] = [];
  if (!urls || urls.trim().length === 0) return signals;

  const urlList = urls.split(/[,\s]+/).filter((u) => u.trim().length > 0);

  for (const rawUrl of urlList) {
    const url = rawUrl.trim();
    let parsed: URL | null = null;
    try {
      parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      signals.push(makeSignal('url', 'Malformed URL',
        `"${url}" is not a valid URL. Invalid URLs are a risk indicator.`,
        'high', 15, 0.8));
      continue;
    }

    if (!parsed) continue;
    const hostname = parsed.hostname;

    // HTTP (not HTTPS)
    if (parsed.protocol === 'http:') {
      signals.push(makeSignal('url', 'Unencrypted HTTP URL',
        'URL uses HTTP instead of HTTPS. Data transmitted over this connection is not encrypted.',
        'medium', 10, 0.7));
    }

    // IP-based URL
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      signals.push(makeSignal('url', 'IP-Based URL',
        'URL uses a raw IP address instead of a domain name. This is a common phishing indicator.',
        'high', 18, 0.75));
    }

    // URL shortening services
    const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorturl.at'];
    if (shorteners.some((s) => hostname === s || hostname.endsWith(`.${s}`))) {
      signals.push(makeSignal('url', 'URL Shortener Detected',
        'URL uses a shortening service which obscures the destination. Shortened URLs are common in phishing.',
        'high', 15, 0.7));
    }

    // Suspicious keywords in URL
    const suspiciousKeywords = ['login', 'verify', 'account', 'update', 'secure', 'bank', 'paypal', 'wallet', 'claim', 'reward', 'free', 'gift', 'prize'];
    const urlLower = url.toLowerCase();
    const matchedKeywords = suspiciousKeywords.filter((k) => urlLower.includes(k));
    if (matchedKeywords.length >= 2) {
      signals.push(makeSignal('url', 'Suspicious URL Keywords',
        `URL contains multiple sensitive keywords: ${matchedKeywords.join(', ')}. This pattern is common in phishing URLs.`,
        'high', 15, 0.65));
    } else if (matchedKeywords.length === 1) {
      signals.push(makeSignal('url', 'Sensitive URL Keyword',
        `URL contains keyword "${matchedKeywords[0]}" which may be used in phishing attempts.`,
        'medium', 8, 0.55));
    }

    // Excessive subdomains
    const subdomainParts = hostname.split('.').filter((p) => p.length > 0);
    if (subdomainParts.length > 4) {
      signals.push(makeSignal('url', 'Excessive Subdomains',
        `URL has ${subdomainParts.length} domain parts. Excessive subdomain nesting can indicate obfuscation.`,
        'medium', 10, 0.6));
    }

    // Suspicious TLD
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.xyz', '.click', '.country'];
    if (suspiciousTlds.some((tld) => hostname.endsWith(tld))) {
      signals.push(makeSignal('url', 'Suspicious TLD',
        `URL uses TLD "${hostname.split('.').pop()}" which is frequently associated with malicious activity.`,
        'medium', 10, 0.55));
    }

    // Suspicious path patterns
    if (/\/(login|signin|verify|account|update|confirm)/i.test(parsed.pathname)) {
      signals.push(makeSignal('url', 'Credential Harvesting Path',
        'URL path contains credential-related terms, potentially leading to a phishing login page.',
        'high', 12, 0.6));
    }

    // @ symbol in URL (obfuscation)
    if (parsed.href.includes('@') && !parsed.href.includes('@') === false) {
      if (url.includes('@') && !url.startsWith('mailto:')) {
        signals.push(makeSignal('url', 'URL Obfuscation Character',
          'URL contains "@" character which can be used to obscure the actual destination.',
          'medium', 8, 0.5));
      }
    }
  }

  return signals;
}

// ========================
// MEDIA SIGNALS
// ========================

export function analyzeMediaSignals(
  imageUrl: string | null | undefined,
  profileCompletion: number = 50,
): RiskSignal[] {
  const signals: RiskSignal[] = [];

  if (!imageUrl) {
    signals.push(makeSignal('media', 'No Profile Image',
      'No profile image uploaded. Missing media is a minor identity signal.',
      'low', 5, 0.4));
    return signals;
  }

  signals.push(makeSignal('media', 'Image Present',
    'Image is present. Demo heuristic analysis applied — no AI image model configured.',
    'low', 0, 0.3));

  const lowerUrl = imageUrl.toLowerCase();
  const filename = lowerUrl.split('/').pop() || lowerUrl;

  const hasDefaultStyle = /(default|avatar|placeholder|sample|stock|generic|template|mock|dummy)/i.test(filename)
    || /(default|avatar|placeholder|sample|stock|generic|template|mock|dummy)/i.test(lowerUrl);
  if (hasDefaultStyle) {
    signals.push(makeSignal('media', 'Potential Stock/Default Image',
      'Image file name or URL pattern suggests a generic, default, or stock image rather than a unique personal photo.',
      'medium', 12, 0.55));
  }

  const duplicateIndicators = /(copy|duplicate|reuse|same|template|final-v|v2|v3|avatar-final)/i.test(filename)
    || /(copy|duplicate|reuse|same|template|final-v|v2|v3|avatar-final)/i.test(lowerUrl);
  if (duplicateIndicators) {
    signals.push(makeSignal('media', 'Reused/Duplicate Image Pattern',
      'The file name or URL suggests reuse or duplication across multiple profiles or contexts, which can reduce authenticity confidence.',
      'high', 18, 0.7));
  }

  const suspiciousParams = /(download=|cache=|token=|preview=|thumbnail=|temp=|auto=|generated)/i.test(lowerUrl);
  if (suspiciousParams) {
    signals.push(makeSignal('media', 'Suspicious Image URL Parameters',
      'The image URL includes unusual query parameters or generated markers that may indicate synthetic or templated assets.',
      'medium', 11, 0.55));
  }

  // Missing EXIF/metadata is a measurable but weak heuristic. It should not be enough by itself to declare an image as high risk.
  const missingMetadata = profileCompletion < 50 || (!lowerUrl.includes('metadata') && !lowerUrl.includes('exif'));
  if (missingMetadata && (hasDefaultStyle || duplicateIndicators || suspiciousParams)) {
    signals.push(makeSignal('media', 'Missing EXIF/Metadata',
      'The image lacks clear metadata or EXIF provenance. This is a weak forensic signal and should be interpreted alongside other indicators.',
      'low', 6, 0.5));
  }

  if (/(avatar|profile|logo|banner|cover)/i.test(filename)) {
    signals.push(makeSignal('media', 'Generic Image Asset Pattern',
      'The file naming pattern resembles a generic identity asset or template rather than a unique personal image.',
      'low', 7, 0.45));
  }

  if (profileCompletion < 50) {
    signals.push(makeSignal('media', 'Limited Media Metadata',
      'Unable to extract complete metadata for the image, which limits forensic confidence in the assessment.',
      'low', 6, 0.4));
  }

  return signals;
}

// ========================
// CONTENT ANALYZER (standalone)
// ========================

export function analyzeContent(text: string): ContentRiskResult {
  const signals = analyzeContentSignals(text);
  const rawScore = rawCategoryScore(signals);
  const riskScore = normalizeRiskScore(rawScore, CATEGORY_MAX_RAW.content);
  const riskLevel = scoreToRiskLevel(riskScore);

  let classification = 'Benign Content';
  if (riskScore >= 81) classification = 'Potential Scam / Phishing';
  else if (riskScore >= 61) classification = 'High-Risk Content';
  else if (riskScore >= 41) classification = 'Suspicious Content';
  else if (riskScore >= 21) classification = 'Low-Risk Content';

  const topSignals = signals.filter((s) => s.severity === 'high' || s.severity === 'critical');
  const explanation = topSignals.length > 0
    ? `Content was flagged due to: ${topSignals.map((s) => s.signal_name.toLowerCase()).join(', ')}. ` +
      `These indicators are commonly associated with social engineering and fraudulent messaging. ` +
      `This is an AI-assisted assessment for decision support, not a definitive classification.`
    : 'No significant risk indicators detected in this content. The text appears to be routine communication.';

  return {
    risk_score: riskScore,
    trust_score: trustFromRisk(riskScore),
    risk_level: riskLevel,
    classification,
    explanation,
    signals,
    ai_recommendation: getAiRecommendation(riskLevel),
    is_demo: true,
  };
}

// ========================
// URL ANALYZER (standalone)
// ========================

export function analyzeUrl(url: string): UrlRiskResult {
  const signals = analyzeUrlSignals(url);
  const rawScore = rawCategoryScore(signals);
  const riskScore = normalizeRiskScore(rawScore, CATEGORY_MAX_RAW.url);
  const riskLevel = scoreToRiskLevel(riskScore);

  let classification = 'Low Risk URL';
  if (riskScore >= 60) classification = 'High Risk URL';
  else if (riskScore >= 30) classification = 'Medium Risk URL';

  const topSignals = signals.filter((s) => s.severity === 'high' || s.severity === 'critical');
  const explanation = topSignals.length > 0
    ? `URL was flagged due to: ${topSignals.map((s) => s.signal_name.toLowerCase()).join(', ')}. ` +
      `External reputation intelligence unavailable — heuristic analysis only. ` +
      `This is an AI-assisted assessment for decision support.`
    : 'No significant URL risk indicators detected. URL structure appears normal. External reputation intelligence unavailable — heuristic analysis only.';

  return {
    risk_score: riskScore,
    trust_score: trustFromRisk(riskScore),
    risk_level: riskLevel,
    classification,
    explanation,
    signals,
    ai_recommendation: getAiRecommendation(riskLevel),
    is_demo: true,
    has_external_intel: false,
  };
}

// ========================
// MEDIA ANALYZER (standalone)
// ========================

export function analyzeMedia(fileUrl: string): MediaRiskResult {
  const signals = analyzeMediaSignals(fileUrl, 50);
  const rawScore = rawCategoryScore(signals);
  const riskScore = normalizeRiskScore(rawScore, CATEGORY_MAX_RAW.media);
  const riskLevel = scoreToRiskLevel(riskScore);

  let classification = 'Low Risk Media';
  if (riskScore >= 60) classification = 'High Risk Media';
  else if (riskScore >= 30) classification = 'Medium Risk Media';

  const topSignals = signals.filter((s) => s.severity === 'high' || s.severity === 'critical');
  const explanation = topSignals.length > 0
    ? `Media analysis (demo heuristic): ${topSignals.map((s) => s.signal_name.toLowerCase()).join(', ')}. ` +
      `Multiple image signals were detected, including default/templated asset patterns and duplicate-style indicators. ` +
      `No AI image model configured — this is a heuristic assessment only and does not confirm AI generation, deepfakes, or manipulation.`
    : signals.length > 0
      ? `Media analysis (demo heuristic): ${signals.map((s) => s.signal_name.toLowerCase()).join(', ')}. ` +
        `No AI image model configured — results are based on basic forensic heuristics only.`
      : 'No media risk indicators detected. Demo heuristic analysis — no AI image model configured.';

  return {
    risk_score: riskScore,
    trust_score: trustFromRisk(riskScore),
    risk_level: riskLevel,
    classification,
    explanation,
    signals,
    ai_recommendation: getAiRecommendation(riskLevel),
    is_demo: true,
  };
}

// ========================
// HELPERS
// ========================

function buildProfileSummary(
  input: ProfileInput,
  categories: CategoryScore[],
  riskLevel: string,
): string {
  const highCategories = categories.filter((c) => c.score >= 40);
  if (highCategories.length === 0) {
    return `Profile "@${input.username}" shows low risk indicators across all signal categories. ` +
      `No single signal or combination suggests elevated risk. This is an AI-assisted assessment for decision support.`;
  }

  const reasons = highCategories.map((c) => {
    const topSignal = c.signals[0];
    return topSignal ? topSignal.signal_name.toLowerCase() : c.category;
  });

  return `Profile "@${input.username}" was assessed as ${riskLevel.toUpperCase()}. ` +
    `Multiple signals contributed to this assessment: ${reasons.join(', ')}. ` +
    `This is an AI-assisted risk assessment for decision support — it does not definitively classify this identity. ` +
    `Human review is recommended for profiles scoring above 60.`;
}

export function stringSimilarity(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  let intersection = 0;
  for (const char of setA) {
    if (setB.has(char)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

// Export the demo sample profile for the hackathon demo
export const DEMO_PROFILE: ProfileInput = {
  username: 'fake_shop_9281',
  display_name: 'Official Store',
  bio: 'Best offers. Contact us. Congratulations! You won ₹50,000. Pay ₹999 immediately to claim your reward. Click this link now.',
  followers: 42,
  following: 1840,
  account_age_days: 4,
  posts_count: 2,
  profile_completion: 35,
  verification_status: 'unverified',
  external_links: 'https://example.com/claim-reward',
  profile_image_url: null,
};

export const DEMO_CONTENT = 'Congratulations! You have won ₹50,000. Pay ₹999 immediately to claim your reward. Click this link now.';

export const DEMO_URL = 'https://example.com/claim-reward';
