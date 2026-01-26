import { describe, it, expect } from "vitest";
import { generateFingerprint, isNewFinding } from "./findings.js";
import type { Finding, Baseline } from "./types.js";

describe("findings", () => {
  it("should generate stable fingerprints", () => {
    const finding: Finding = {
      id: "TS001",
      ruleId: "TS001",
      title: "Test finding",
      description: "Test",
      remediation: "Fix it",
      filePath: "test.ts",
      line: 10,
      category: "BUG",
      severity: "MAJOR",
      effortMinutes: 15,
      tags: [],
      fingerprint: "",
    };

    const fp1 = generateFingerprint(finding);
    const fp2 = generateFingerprint(finding);

    expect(fp1).toBe(fp2);
    expect(fp1.length).toBe(16);
  });

  it("should detect new findings", () => {
    const finding: Finding = {
      id: "TS001",
      ruleId: "TS001",
      title: "Test finding",
      description: "Test",
      remediation: "Fix it",
      filePath: "test.ts",
      line: 10,
      category: "BUG",
      severity: "MAJOR",
      effortMinutes: 15,
      tags: [],
      fingerprint: "",
    };

    const fingerprint = generateFingerprint(finding);
    finding.fingerprint = fingerprint;

    const baseline: Baseline = {
      fingerprints: new Set([fingerprint]),
      metrics: {
        totalLoc: 0,
        totalComplexity: 0,
        duplicationPercentage: 0,
      },
      timestamp: new Date().toISOString(),
    };

    expect(isNewFinding(finding, baseline)).toBe(false);

    const newFinding: Finding = {
      ...finding,
      line: 20,
    };
    newFinding.fingerprint = generateFingerprint(newFinding);

    expect(isNewFinding(newFinding, baseline)).toBe(true);
  });
});
