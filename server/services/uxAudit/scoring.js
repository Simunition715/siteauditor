/**
 * Scoring logic for UX audit
 * Each category is 0-20, total is 0-100
 */

function calculateCategoryScore(issues, category) {
  const categoryIssues = issues.filter((issue) => issue.category === category);
  if (categoryIssues.length === 0) return 20; // Perfect score if no issues

  // Count passed vs failed rules
  const passedCount = categoryIssues.filter((issue) => issue.passed).length;
  const totalCount = categoryIssues.length;

  // Base score: percentage of passed rules, scaled to 0-20
  // Each rule contributes equally (20 / total rules)
  const baseScore = (passedCount / totalCount) * 20;

  // Apply impact-based penalty for failed rules
  let impactPenalty = 0;
  const impactWeights = { High: 1.5, Med: 1.0, Low: 0.5 };

  for (const issue of categoryIssues) {
    if (!issue.passed) {
      const weight = impactWeights[issue.impact] || 1;
      impactPenalty += (weight / totalCount) * 2; // Max 2 points per failed rule
    }
  }

  const score = Math.max(0, Math.min(20, baseScore - impactPenalty));
  return Math.round(score * 10) / 10; // Round to 1 decimal
}

function calculateTotalScore(scores) {
  // Simple average of category scores, scaled to 0-100
  const categories = ["clarity", "direction", "trust", "friction", "mobile"];
  const sum = categories.reduce((acc, cat) => acc + scores[cat], 0);
  return Math.round((sum / categories.length) * 5); // Scale 0-20 to 0-100
}

function aggregateIssuesAcrossPages(allIssues) {
  // Group by issue ID, keep the worst result per issue
  const issueMap = new Map();

  for (const issue of allIssues) {
    const existing = issueMap.get(issue.id);
    if (!existing || !existing.passed) {
      issueMap.set(issue.id, issue);
    }
  }

  return Array.from(issueMap.values());
}

function identifyQuickWins(issues) {
  return issues
    .filter(
      (issue) => issue.impact === "High" && issue.effort === "S" && !issue.passed
    )
    .map((issue) => issue.id)
    .slice(0, 10); // Max 10 quick wins
}

function aggregateScores(pageScores, weights) {
  const categories = ["clarity", "direction", "trust", "friction", "mobile"];
  const aggregated = {};

  for (const category of categories) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < pageScores.length; i++) {
      const score = pageScores[i][category] || 0;
      const weight = weights[i] || 0;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    aggregated[category] =
      totalWeight > 0
        ? Math.round((weightedSum / totalWeight) * 10) / 10
        : 0;
  }

  return aggregated;
}

module.exports = {
  calculateCategoryScore,
  calculateTotalScore,
  aggregateIssuesAcrossPages,
  identifyQuickWins,
  aggregateScores,
};

