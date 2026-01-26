import type {
  QualityGateConfig,
  GateResult,
  ScanResult,
  Finding,
  Baseline,
} from "./types.js";
import { isNewFinding } from "./findings.js";

export function evaluateGate(
  result: ScanResult,
  config: QualityGateConfig,
  baseline: Baseline | null
): GateResult {
  const failures: string[] = [];
  const warnings: string[] = [];

  // Separate new and overall findings
  const newFindings = result.findings.filter((f) => isNewFinding(f, baseline));
  const overallFindings = result.findings;

  // Count by category and severity
  function countByCategory(findings: Finding[]) {
    const counts = {
      BUG: 0,
      VULNERABILITY: 0,
      CODE_SMELL: 0,
    };
    for (const finding of findings) {
      counts[finding.category]++;
    }
    return counts;
  }

  const newCounts = countByCategory(newFindings);
  const overallCounts = countByCategory(overallFindings);

  // Check severity-based failures
  for (const finding of overallFindings) {
    if (config.failOnSeverities.includes(finding.severity)) {
      const scope = isNewFinding(finding, baseline) ? "new" : "existing";
      failures.push(
        `${finding.severity} ${finding.category} in ${finding.filePath}:${finding.line} (${scope})`
      );
    }
  }

  // Check new code limits
  if (config.mode === "new-code" || config.mode === "overall") {
    if (newCounts.BUG > config.maxNew.BUG) {
      failures.push(`New bugs: ${newCounts.BUG} (max ${config.maxNew.BUG})`);
    }
    if (newCounts.VULNERABILITY > config.maxNew.VULNERABILITY) {
      failures.push(
        `New vulnerabilities: ${newCounts.VULNERABILITY} (max ${config.maxNew.VULNERABILITY})`
      );
    }
    if (newCounts.CODE_SMELL > config.maxNew.CODE_SMELL) {
      failures.push(
        `New code smells: ${newCounts.CODE_SMELL} (max ${config.maxNew.CODE_SMELL})`
      );
    }
  }

  // Check overall limits
  if (config.mode === "overall") {
    if (overallCounts.BUG > config.maxOverall.BUG) {
      failures.push(
        `Overall bugs: ${overallCounts.BUG} (max ${config.maxOverall.BUG})`
      );
    }
    if (overallCounts.VULNERABILITY > config.maxOverall.VULNERABILITY) {
      failures.push(
        `Overall vulnerabilities: ${overallCounts.VULNERABILITY} (max ${config.maxOverall.VULNERABILITY})`
      );
    }
    if (overallCounts.CODE_SMELL > config.maxOverall.CODE_SMELL) {
      failures.push(
        `Overall code smells: ${overallCounts.CODE_SMELL} (max ${config.maxOverall.CODE_SMELL})`
      );
    }
  }

  // Check coverage
  if (config.coverage?.required && result.summary.coverage) {
    const overallCoverage = result.summary.coverage.lines.percent;
    if (overallCoverage < config.coverage.minOverallPct) {
      failures.push(
        `Coverage: ${overallCoverage.toFixed(1)}% (min ${
          config.coverage.minOverallPct
        }%)`
      );
    }

    // New code coverage (approximate - would need git diff for accuracy)
    // For MVP, we'll skip this check or use a heuristic
  }

  // Check duplication
  if (config.duplication) {
    if (
      result.summary.duplicationPercentage > config.duplication.maxDupPctOverall
    ) {
      warnings.push(
        `Duplication: ${result.summary.duplicationPercentage.toFixed(
          1
        )}% (max ${config.duplication.maxDupPctOverall}%)`
      );
    }
  }

  // Check complexity
  if (config.complexity) {
    const avgComplexity =
      result.summary.totalComplexity / Math.max(result.metrics.length, 1);
    if (avgComplexity > config.complexity.maxAvgPerFile) {
      warnings.push(
        `Average complexity: ${avgComplexity.toFixed(1)} (max ${
          config.complexity.maxAvgPerFile
        })`
      );
    }

    // Check individual function complexity
    for (const fileMetrics of result.metrics) {
      for (const fn of fileMetrics.metrics.functions) {
        if (fn.complexity > config.complexity.maxCyclomaticPerFn) {
          failures.push(
            `Complexity: ${fileMetrics.filePath}:${fn.line} function ${fn.name}() cyclomatic ${fn.complexity} (max ${config.complexity.maxCyclomaticPerFn})`
          );
        }
      }
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
  };
}
