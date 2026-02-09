import { ESLint } from "eslint";
import type { Finding } from "../core/types.js";
import type { FileInfo } from "../core/fileWalker.js";

function isConfigLoadError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("Failed to load config") ||
    msg.includes("to extend from") ||
    msg.includes("Cannot find module")
  );
}

/** Fallback config when project's .eslintrc extends missing packages (e.g. airbnb-base). */
function createFallbackESLint(): ESLint {
  return new ESLint({
    useEslintrc: false,
    overrideConfig: {
      env: { es2022: true, node: true },
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
      extends: ["eslint:recommended"],
      rules: {},
    },
  });
}

function processLintResults(
  result: ESLint.LintResult,
  file: FileInfo,
  findings: Finding[]
): void {
  for (const message of result.messages) {
    // Skip parsing errors - these are configuration issues, not code issues
    if (!message.ruleId || message.ruleId === null) {
      continue;
    }

    const ruleId = message.ruleId;
    const messageText = message.message.toLowerCase();

    const isParsingError =
      messageText.includes("parsing error") ||
      messageText.includes("the keyword") ||
      messageText.includes("unexpected token") ||
      messageText.includes("unexpected") ||
      messageText.includes("reserved") ||
      ruleId === "UNKNOWN" ||
      ruleId === "";

    if (isParsingError) continue;

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
    if (styleOnlyRules.some((styleRule) => ruleBase.includes(styleRule))) {
      continue;
    }

    let severity: Finding["severity"] = "MINOR";
    if (message.severity === 2) severity = "MAJOR";
    else if (message.severity === 1) severity = "MINOR";

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
      ruleId.includes("no-constant-condition") ||
      ruleId.includes("no-duplicate-case") ||
      ruleId.includes("no-fallthrough") ||
      ruleId.includes("no-unused-labels") ||
      ruleId.includes("no-useless-return")
    ) {
      category = "BUG";
    }

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
      fingerprint: "",
      message: message.message,
    });
  }
}

export async function analyzeWithESLint(files: FileInfo[]): Promise<Finding[]> {
  const findings: Finding[] = [];

  const jsFiles = files.filter(
    (f) =>
      f.extension === "js" ||
      f.extension === "jsx" ||
      f.extension === "ts" ||
      f.extension === "tsx"
  );

  if (jsFiles.length === 0) return findings;

  let eslint: ESLint;
  try {
    eslint = new ESLint({
      useEslintrc: true,
      overrideConfig: { rules: {} },
    });
  } catch {
    console.warn("ESLint analyzer skipped (ESLint not available)");
    return findings;
  }

  const runWith = async (engine: ESLint): Promise<void> => {
    let processed = 0;
    for (const file of jsFiles) {
      try {
        if (processed % 10 === 0 && processed > 0) {
          console.log(
            `    [ESLint] Processed ${processed}/${jsFiles.length} files...`
          );
        }
        const results = await engine.lintText(file.content, {
          filePath: file.path,
        });
        processed++;
        if (processed === jsFiles.length) {
          console.log(`    [ESLint] Completed processing ${processed} files`);
        }
        for (const result of results) {
          processLintResults(result, file, findings);
        }
      } catch (e) {
        if (processed === 0 && isConfigLoadError(e)) {
          // Project config failed to load (e.g. missing airbnb-base) - use fallback once
          console.warn(
            "ESLint: Project config could not be loaded (missing extend?). Using eslint:recommended for this scan."
          );
          const fallback = createFallbackESLint();
          findings.length = 0;
          await runWith(fallback);
          return;
        }
        console.warn(`ESLint could not process ${file.path}: ${e}`);
      }
    }
  };

  await runWith(eslint);
  return findings;
}
