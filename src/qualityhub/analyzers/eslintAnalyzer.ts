import { ESLint } from "eslint";
import type { Finding } from "../core/types.js";
import type { FileInfo } from "../core/fileWalker.js";

export async function analyzeWithESLint(files: FileInfo[]): Promise<Finding[]> {
  const findings: Finding[] = [];

  try {
    const eslint = new ESLint({
      useEslintrc: true, // Use existing ESLint config if available
      overrideConfig: {
        rules: {
          // Enable some common rules if no config exists
        },
      },
    });

    // Filter to JS/TS files
    const jsFiles = files.filter(
      (f) =>
        f.extension === "js" ||
        f.extension === "jsx" ||
        f.extension === "ts" ||
        f.extension === "tsx"
    );

    let processed = 0;
    for (const file of jsFiles) {
      try {
        if (processed % 10 === 0 && processed > 0) {
          console.log(
            `    [ESLint] Processed ${processed}/${jsFiles.length} files...`
          );
        }
        const results = await eslint.lintText(file.content, {
          filePath: file.path,
        });
        processed++;
        if (processed === jsFiles.length) {
          console.log(`    [ESLint] Completed processing ${processed} files`);
        }

        for (const result of results) {
          for (const message of result.messages) {
            // Skip parsing errors - these are configuration issues, not code issues
            if (!message.ruleId || message.ruleId === null) {
              // Parsing errors don't have rule IDs - skip them
              continue;
            }

            const ruleId = message.ruleId;
            const messageText = message.message.toLowerCase();

            // Filter out common false positives and parsing errors
            const isParsingError =
              messageText.includes("parsing error") ||
              messageText.includes("the keyword") ||
              messageText.includes("unexpected token") ||
              messageText.includes("unexpected") ||
              messageText.includes("reserved") ||
              ruleId === "UNKNOWN" ||
              ruleId === "";

            if (isParsingError) {
              continue; // Skip parsing errors - not actionable code issues
            }

            // Skip style-only rules that aren't meaningful (optional - can be configured)
            const styleOnlyRules = [
              "quotes",
              "semi",
              "comma-dangle",
              "indent",
              "linebreak-style",
              "max-len",
              "no-trailing-spaces",
              "eol-last",
            ];

            const ruleBase = ruleId.split("/").pop() || ruleId;
            if (
              styleOnlyRules.some((styleRule) => ruleBase.includes(styleRule))
            ) {
              continue; // Skip style-only rules - not meaningful issues
            }

            // Map ESLint severity to QualityHub severity
            let severity: Finding["severity"] = "MINOR";
            if (message.severity === 2) {
              severity = "MAJOR";
            } else if (message.severity === 1) {
              severity = "MINOR";
            }

            // Map to category based on rule name - only meaningful categories
            let category: Finding["category"] = "CODE_SMELL";
            if (
              ruleId.includes("security") ||
              ruleId.includes("no-eval") ||
              ruleId.includes("no-implied-eval") ||
              ruleId.includes("xss") ||
              ruleId.includes("injection")
            ) {
              category = "VULNERABILITY";
            } else if (
              ruleId.includes("no-unused") ||
              ruleId.includes("no-undef") ||
              ruleId.includes("no-unreachable") ||
              ruleId.includes("no-unused-vars") ||
              ruleId.includes("no-undef") ||
              ruleId.includes("no-unreachable") ||
              ruleId.includes("no-constant-condition") ||
              ruleId.includes("no-duplicate-case") ||
              ruleId.includes("no-fallthrough") ||
              ruleId.includes("no-unused-labels") ||
              ruleId.includes("no-useless-return")
            ) {
              category = "BUG";
            }

            // Only include findings that are actually meaningful
            findings.push({
              id: `ESLINT-${ruleId}`,
              ruleId: `ESLINT-${ruleId}`,
              title: message.message,
              description: message.message,
              remediation: `Fix ESLint rule: ${ruleId}. Check ESLint documentation for this rule.`,
              filePath: file.path,
              line: message.line || 1,
              column: message.column,
              category,
              severity,
              effortMinutes: 15,
              tags: ["eslint", ruleId.split("/")[0] || "general"],
              fingerprint: "", // Will be set by caller
              message: message.message,
            });
          }
        }
      } catch (e) {
        // Skip files that ESLint can't process
        console.warn(`ESLint could not process ${file.path}: ${e}`);
      }
    }
  } catch (e) {
    // ESLint might not be configured - that's okay
    console.warn("ESLint analyzer skipped (no ESLint config found)");
  }

  return findings;
}
