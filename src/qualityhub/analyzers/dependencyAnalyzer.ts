import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import type { Finding } from "../core/types.js";

/**
 * Run npm/pnpm audit and convert to findings
 */
export async function analyzeDependencies(): Promise<Finding[]> {
  const findings: Finding[] = [];

  // Detect package manager
  const hasPnpm = existsSync(join(process.cwd(), "pnpm-lock.yaml"));
  const hasNpm = existsSync(join(process.cwd(), "package-lock.json"));
  const hasYarn = existsSync(join(process.cwd(), "yarn.lock"));

  let auditCommand: string | null = null;
  if (hasPnpm) {
    auditCommand = "pnpm audit --json";
  } else if (hasNpm) {
    auditCommand = "npm audit --json";
  } else if (hasYarn) {
    auditCommand = "yarn audit --json";
  }

  if (!auditCommand) {
    return findings; // No package manager detected
  }

  try {
    const output = execSync(auditCommand, {
      encoding: "utf-8",
      stdio: "pipe",
      cwd: process.cwd(),
    });

    // Parse audit output
    const lines = output.split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.type === "auditAdvisory" || data.type === "auditSummary") {
          if (data.data?.advisory) {
            const advisory = data.data.advisory;
            const severity = mapSeverity(advisory.severity);
            findings.push({
              id: `DEP-${advisory.id || advisory.cves?.[0] || "UNKNOWN"}`,
              ruleId: `DEP-${advisory.id || advisory.cves?.[0] || "UNKNOWN"}`,
              title: advisory.title || "Dependency vulnerability",
              description: advisory.overview || advisory.title || "",
              remediation:
                advisory.recommendation ||
                `Update ${advisory.module_name} to a secure version`,
              filePath: "package.json",
              line: 1,
              category: "VULNERABILITY",
              severity,
              effortMinutes: 30,
              tags: ["dependency", "security", advisory.module_name || ""],
              fingerprint: "",
              message: advisory.title,
            });
          }
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
  } catch (e: any) {
    // Audit might fail if there are vulnerabilities or no audit available
    // This is okay - we'll just return empty findings
    if (e.status !== 1) {
      // Status 1 means vulnerabilities found, which is expected
      console.warn(`Dependency audit skipped: ${e.message}`);
    }
  }

  return findings;
}

function mapSeverity(severity: string): Finding["severity"] {
  const lower = severity.toLowerCase();
  if (lower === "critical") return "CRITICAL";
  if (lower === "high") return "MAJOR";
  if (lower === "moderate" || lower === "medium") return "MINOR";
  if (lower === "low") return "INFO";
  return "MINOR";
}
