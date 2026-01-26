import chalk from "chalk";
import type { ScanResult, Finding } from "../core/types.js";
import type { Reporter } from "../core/reporter.js";
import { isNewFinding } from "../core/findings.js";
import type { Baseline } from "../core/types.js";

export class ConsoleReporter implements Reporter {
  private baseline: Baseline | null;

  constructor(baseline: Baseline | null = null) {
    this.baseline = baseline;
  }

  report(result: ScanResult): void {
    console.log("\n" + chalk.bold.blue("=".repeat(60)));
    console.log(chalk.bold.blue("QualityHub Scan Report"));
    console.log(chalk.bold.blue("=".repeat(60)) + "\n");

    // Summary
    console.log(chalk.bold("Summary:"));
    console.log(
      `  Total Findings: ${chalk.bold(result.summary.totalFindings.toString())}`
    );
    if (this.baseline) {
      console.log(
        `  New Findings: ${chalk.bold.yellow(
          result.summary.newFindings.toString()
        )}`
      );
    }
    console.log(`  Total LOC: ${result.summary.totalLoc}`);
    console.log(
      `  Duplication: ${result.summary.duplicationPercentage.toFixed(1)}%`
    );
    if (result.summary.coverage) {
      console.log(
        `  Coverage: ${result.summary.coverage.lines.percent.toFixed(1)}%`
      );
    }
    console.log("");

    // By category
    console.log(chalk.bold("By Category:"));
    console.log(
      `  Bugs: ${chalk.red(result.summary.byCategory.BUG.toString())}`
    );
    console.log(
      `  Vulnerabilities: ${chalk.magenta(
        result.summary.byCategory.VULNERABILITY.toString()
      )}`
    );
    console.log(
      `  Code Smells: ${chalk.yellow(
        result.summary.byCategory.CODE_SMELL.toString()
      )}`
    );
    console.log("");

    // By severity
    console.log(chalk.bold("By Severity:"));
    const severities: Array<[string, number]> = [
      ["BLOCKER", result.summary.bySeverity.BLOCKER],
      ["CRITICAL", result.summary.bySeverity.CRITICAL],
      ["MAJOR", result.summary.bySeverity.MAJOR],
      ["MINOR", result.summary.bySeverity.MINOR],
      ["INFO", result.summary.bySeverity.INFO],
    ];

    for (const [severity, count] of severities) {
      if (count > 0) {
        const color =
          severity === "BLOCKER" || severity === "CRITICAL"
            ? chalk.red
            : severity === "MAJOR"
            ? chalk.yellow
            : chalk.gray;
        console.log(`  ${severity}: ${color(count.toString())}`);
      }
    }
    console.log("");

    // Top issues
    const topIssues = result.findings
      .sort((a, b) => {
        const severityOrder: Record<string, number> = {
          BLOCKER: 0,
          CRITICAL: 1,
          MAJOR: 2,
          MINOR: 3,
          INFO: 4,
        };
        return (
          severityOrder[a.severity] - severityOrder[b.severity] ||
          a.line - b.line
        );
      })
      .slice(0, 20);

    if (topIssues.length > 0) {
      console.log(chalk.bold("Top Issues:"));
      console.log("");

      for (const finding of topIssues) {
        const isNew = this.baseline
          ? isNewFinding(finding, this.baseline)
          : false;
        const newLabel = isNew ? chalk.yellow(" [NEW]") : "";
        const severityColor =
          finding.severity === "BLOCKER" || finding.severity === "CRITICAL"
            ? chalk.red
            : finding.severity === "MAJOR"
            ? chalk.yellow
            : chalk.gray;

        console.log(
          `  ${severityColor(finding.severity)} ${chalk.bold(finding.id)}: ${
            finding.title
          }${newLabel}`
        );
        console.log(`    ${chalk.gray(`${finding.filePath}:${finding.line}`)}`);
        if (finding.description) {
          console.log(
            `    ${chalk.gray(finding.description.substring(0, 80))}...`
          );
        }
        console.log("");
      }
    }

    console.log(chalk.bold.blue("=".repeat(60)) + "\n");
  }
}
