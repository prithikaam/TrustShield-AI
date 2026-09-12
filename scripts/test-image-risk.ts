import assert from 'node:assert/strict';
import { analyzeMedia } from '../src/services/riskEngine.ts';

const cases = [
  {
    name: 'Normal image',
    url: 'https://images.example.com/users/jane/portrait-2026.jpg',
    expectedRange: [0, 29],
    expectedLevel: 'Low Risk',
    expectedClassification: 'Low Risk Media',
  },
  {
    name: 'Suspicious image',
    url: 'https://cdn.example.com/generated/default-avatar-template-final-v2.png',
    expectedRange: [60, 100],
    expectedLevel: 'High Risk',
    expectedClassification: 'High Risk Media',
  },
] as const;

for (const testCase of cases) {
  const result = analyzeMedia(testCase.url);
  const riskScore = result.risk_score;
  const trustScore = result.trust_score;
  const [min, max] = testCase.expectedRange;

  assert.equal(trustScore, 100 - riskScore, `${testCase.name}: trust score should equal 100 - risk score`);
  assert.ok(riskScore >= min && riskScore <= max, `${testCase.name}: risk score ${riskScore} did not match expected range ${min}–${max}`);
  assert.equal(result.risk_level, testCase.expectedLevel, `${testCase.name}: expected risk level ${testCase.expectedLevel}, got ${result.risk_level}`);
  assert.equal(result.classification, testCase.expectedClassification, `${testCase.name}: expected classification ${testCase.expectedClassification}, got ${result.classification}`);

  console.log(`${testCase.name}: risk=${riskScore}/100 trust=${trustScore}/100 level=${result.risk_level} classification=${result.classification}`);
}
