/**
 * Unit tests for scoring logic
 */

const { describe, test, expect } = require('vitest');
const {
  calculateCategoryScore,
  calculateTotalScore,
  identifyQuickWins,
} = require('./scoring');

describe('Scoring Logic', () => {
  test('calculateCategoryScore - all passed should return 20', () => {
    const issues = [
      { category: 'clarity', passed: true, impact: 'High' },
      { category: 'clarity', passed: true, impact: 'Med' },
    ];
    const score = calculateCategoryScore(issues, 'clarity');
    expect(score).toBe(20);
  });

  test('calculateCategoryScore - some failed should reduce score', () => {
    const issues = [
      { category: 'clarity', passed: true, impact: 'High' },
      { category: 'clarity', passed: false, impact: 'High' },
      { category: 'clarity', passed: true, impact: 'Med' },
    ];
    const score = calculateCategoryScore(issues, 'clarity');
    expect(score).toBeLessThan(20);
    expect(score).toBeGreaterThan(0);
  });

  test('calculateTotalScore - should scale 0-20 to 0-100', () => {
    const scores = {
      clarity: 20,
      direction: 20,
      trust: 20,
      friction: 20,
      mobile: 20,
    };
    const total = calculateTotalScore(scores);
    expect(total).toBe(100);
  });

  test('identifyQuickWins - should return High impact + Small effort issues', () => {
    const issues = [
      { id: 'ISSUE_1', impact: 'High', effort: 'S', passed: false },
      { id: 'ISSUE_2', impact: 'High', effort: 'M', passed: false },
      { id: 'ISSUE_3', impact: 'Med', effort: 'S', passed: false },
      { id: 'ISSUE_4', impact: 'High', effort: 'S', passed: false },
    ];
    const quickWins = identifyQuickWins(issues);
    expect(quickWins).toContain('ISSUE_1');
    expect(quickWins).toContain('ISSUE_4');
    expect(quickWins).not.toContain('ISSUE_2');
    expect(quickWins).not.toContain('ISSUE_3');
  });
});

