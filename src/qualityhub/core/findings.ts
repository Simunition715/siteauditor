import { createHash } from "crypto";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { Finding, Baseline } from "./types.js";

/**
 * Generate a stable fingerprint for a finding
 * Used to track findings across scans for baseline comparison
 */
export function generateFingerprint(finding: Finding): string {
  const data = `${finding.ruleId}:${finding.filePath}:${finding.line}:${
    finding.message || finding.title
  }`;
  return createHash("sha256").update(data).digest("hex").substring(0, 16);
}

/**
 * Load baseline from file
 */
export function loadBaseline(baselinePath: string): Baseline | null {
  try {
    const content = readFileSync(baselinePath, "utf-8");
    const data = JSON.parse(content);
    return {
      fingerprints: new Set(data.fingerprints || []),
      metrics: data.metrics || {},
      timestamp: data.timestamp || "",
    };
  } catch (e) {
    return null;
  }
}

/**
 * Save baseline to file
 */
export function saveBaseline(baseline: Baseline, baselinePath: string): void {
  // Ensure directory exists
  mkdirSync(dirname(baselinePath), { recursive: true });

  const data = {
    fingerprints: Array.from(baseline.fingerprints),
    metrics: baseline.metrics,
    timestamp: baseline.timestamp,
  };

  writeFileSync(baselinePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Determine if a finding is "new" based on baseline
 */
export function isNewFinding(
  finding: Finding,
  baseline: Baseline | null
): boolean {
  if (!baseline) {
    return true; // If no baseline, all findings are "new"
  }

  const fingerprint = generateFingerprint(finding);
  return !baseline.fingerprints.has(fingerprint);
}

/**
 * Create baseline from findings
 */
export function createBaselineFromFindings(
  findings: Finding[],
  metrics: any
): Baseline {
  const fingerprints = new Set<string>();
  for (const finding of findings) {
    fingerprints.add(generateFingerprint(finding));
  }

  return {
    fingerprints,
    metrics: {
      totalLoc: metrics.totalLoc || 0,
      totalComplexity: metrics.totalComplexity || 0,
      duplicationPercentage: metrics.duplicationPercentage || 0,
      coverage: metrics.coverage,
    },
    timestamp: new Date().toISOString(),
  };
}
