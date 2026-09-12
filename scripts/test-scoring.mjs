import { analyzeProfile, DEMO_PROFILE } from '../src/services/riskEngine.ts';

const cryptoProfile = {
  username: 'crypto_invest_pro_777',
  display_name: 'Crypto Investment Support',
  bio: 'Official crypto investment support. Guaranteed 300% returns in 24 hours! Limited offer — send your USDT now. Contact us through the link below.',
  followers: 87,
  following: 1270,
  account_age_days: 8,
  posts_count: 0,
  profile_completion: 50,
  verification_status: 'unverified',
  external_links: 'https://crypto-reward-bonus.example.com',
  profile_image_url: null,
};

const healthyProfile = {
  username: 'jane_doe',
  display_name: 'Jane Doe',
  bio: 'Photography enthusiast. Love hiking and coffee.',
  followers: 450,
  following: 320,
  account_age_days: 730,
  posts_count: 156,
  profile_completion: 85,
  verification_status: 'verified',
  external_links: '',
  profile_image_url: 'https://example.com/photo.jpg',
};

const moderateProfile = {
  username: 'tech_blogger',
  display_name: 'Tech Blogger',
  bio: 'Sharing thoughts on software development.',
  followers: 120,
  following: 180,
  account_age_days: 120,
  posts_count: 45,
  profile_completion: 70,
  verification_status: 'unverified',
  external_links: 'https://myblog.example.com',
  profile_image_url: 'https://example.com/avatar.jpg',
};

function printResult(label, result) {
  console.log(`\n=== ${label} ===`);
  console.log(`Risk Score: ${result.risk_score}/100`);
  console.log(`Trust Score: ${result.trust_score}/100`);
  console.log(`Risk Level: ${result.risk_level}`);
  console.log('Category scores:');
  for (const c of result.category_scores) {
    if (c.signals.length > 0) {
      console.log(`  ${c.category}: ${c.score}/100 (${c.signals.length} signals, raw ${c.signals.reduce((s, x) => s + x.score_contribution, 0)})`);
    }
  }
  console.log('Top signals:', result.signals.map((s) => `${s.signal_name} +${s.score_contribution}`).join(', '));
}

printResult('Crypto Investment (expect High Risk >= 60)', analyzeProfile(cryptoProfile));
printResult('Healthy Profile (expect Low Risk <= 29)', analyzeProfile(healthyProfile));
printResult('Moderate Profile (expect Low Risk <= 29)', analyzeProfile(moderateProfile));
printResult('Demo Profile (expect High Risk >= 60)', analyzeProfile(DEMO_PROFILE));
