import assert from 'node:assert/strict';
import { analyzeUrl } from '../src/services/riskEngine.ts';

const cases = [
  {
    name: 'Normal HTTPS URL',
    url: 'https://example.com/products/widget',
    expectedRiskRange: [0, 29],
    expectedLevel: 'Low Risk',
    expectedClassification: 'Low Risk URL',
  },
  {
    name: 'Suspicious URL with one warning',
    url: 'https://example.com/secure',
    expectedRiskRange: [30, 59],
    expectedLevel: 'Medium Risk',
    expectedClassification: 'Medium Risk URL',
  },
  {
    name: 'Multiple high-risk indicators',
    url: 'https://crypto-reward-bonus.example.com/verify-account',
    expectedRiskRange: [60, 100],
    expectedLevel: 'High Risk',
    expectedClassification: 'High Risk URL',
  },
] as const;

for (const testCase of cases) {
  const result = analyzeUrl(testCase.url);
  const riskScore = result.risk_score;
  const trustScore = result.trust_score;
  const [min, max] = testCase.expectedRiskRange;

  assert.equal(trustScore, 100 - riskScore, `${testCase.name}: trust score should equal 100 - risk score`);
  assert.ok(riskScore >= min && riskScore <= max, `${testCase.name}: risk score ${riskScore} did not match expected range ${min}–${max}`);
  assert.equal(result.risk_level, testCase.expectedLevel, `${testCase.name}: expected risk level ${testCase.expectedLevel}, got ${result.risk_level}`);
  assert.equal(result.classification, testCase.expectedClassification, `${testCase.name}: expected classification ${testCase.expectedClassification}, got ${result.classification}`);

  console.log(`${testCase.name}: risk=${riskScore}/100 trust=${trustScore}/100 level=${result.risk_level} classification=${result.classification}`);
}
