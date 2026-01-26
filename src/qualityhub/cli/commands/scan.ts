import { loadConfigAsync } from "../../core/config.js";
import { findFiles } from "../../core/fileWalker.js";
import { analyzeWithESLint } from "../../analyzers/eslintAnalyzer.js";
import { analyzeWithTSAST } from "../../analyzers/tsAstAnalyzer.js";
import { analyzeMetrics } from "../../analyzers/metricsAnalyzer.js";
import { analyzeDuplication } from "../../analyzers/duplicationAnalyzer.js";
import { analyzeCoverage } from "../../analyzers/coverageAnalyzer.js";
import { analyzeDependencies } from "../../analyzers/dependencyAnalyzer.js";
import { generateFingerprint, loadBaseline } from "../../core/findings.js";
import { CompositeReporter } from "../../core/reporter.js";
import { ConsoleReporter } from "../../reporters/consoleReporter.js";
import { JsonReporter } from "../../reporters/jsonReporter.js";
import { HtmlReporter } from "../../reporters/htmlReporter.js";
import type { ScanResult, Finding, FileMetrics } from "../../core/types.js";

export async function runScan(): Promise<ScanResult> {
  console.log("Starting QualityHub scan...\n");

  const config = await loadConfigAsync();
  const baseline = loadBaseline(config.baselineFile);

  // Find files
  console.log("Discovering files...");
  const files = await findFiles(config);
  console.log(`Found ${files.length} files\n`);

  // Run analyzers
  console.log("Running analyzers...");

  const findings: Finding[] = [];
  const fileMetrics: FileMetrics[] = [];

  // ESLint
  console.log("  - ESLint analyzer...");
  console.log(
    `    Processing ${
      files.filter((f) => ["js", "jsx", "ts", "tsx"].includes(f.extension))
        .length
    } files...`
  );
  const eslintFindings = await analyzeWithESLint(files);
  console.log(`    Found ${eslintFindings.length} ESLint issues`);
  findings.push(...eslintFindings);

  // TypeScript AST
  console.log("  - TypeScript AST analyzer...");
  console.log(
    `    Processing ${
      files.filter((f) => ["ts", "tsx"].includes(f.extension)).length
    } TypeScript files...`
  );
  const tsFindings = await analyzeWithTSAST(files);
  console.log(`    Found ${tsFindings.length} TypeScript issues`);
  findings.push(...tsFindings);

  // Metrics
  console.log("  - Metrics analyzer...");
  console.log(`    Calculating metrics for ${files.length} files...`);
  const metrics = await analyzeMetrics(files);
  console.log(`    Calculated metrics for ${metrics.length} files`);
  fileMetrics.push(...metrics);

  // Duplication
  console.log("  - Duplication analyzer...");
  console.log(`    Analyzing duplication in ${files.length} files...`);
  const dupResult = analyzeDuplication(files);
  console.log(`    Found ${dupResult.blocks.length} duplicate blocks`);
  // Update metrics with duplication data
  const totalLines = dupResult.totalLines;
  const dupPercentage =
    totalLines > 0 ? (dupResult.duplicatedLines / totalLines) * 100 : 0;

  // Coverage
  console.log("  - Coverage analyzer...");
  const coverage = analyzeCoverage();

  // Dependencies
  console.log("  - Dependency analyzer...");
  const depFindings = await analyzeDependencies();
  findings.push(...depFindings);

  // Generate fingerprints
  for (const finding of findings) {
    finding.fingerprint = generateFingerprint(finding);
  }

  // Calculate summary
  const summary = calculateSummary(
    findings,
    fileMetrics,
    dupPercentage,
    baseline,
    coverage
  );

  const result: ScanResult = {
    findings,
    metrics: fileMetrics,
    summary,
    timestamp: new Date().toISOString(),
  };

  // Generate reports
  console.log("\nGenerating reports...");
  const reporters: any[] = [];

  if (config.reporters.console) {
    reporters.push(new ConsoleReporter(baseline));
  }

  if (config.reporters.json) {
    reporters.push(new JsonReporter(config.reporters.json.outFile));
  }

  if (config.reporters.html) {
    reporters.push(new HtmlReporter(config.reporters.html.outDir, baseline));
  }

  const compositeReporter = new CompositeReporter(reporters);
  await compositeReporter.report(result);

  console.log("\nScan complete!\n");

  return result;
}

function calculateSummary(
  findings: Finding[],
  fileMetrics: FileMetrics[],
  duplicationPercentage: number,
  baseline: any,
  coverage: any
): ScanResult["summary"] {
  const byCategory = {
    BUG: 0,
    VULNERABILITY: 0,
    CODE_SMELL: 0,
  };

  const bySeverity = {
    INFO: 0,
    MINOR: 0,
    MAJOR: 0,
    CRITICAL: 0,
    BLOCKER: 0,
  };

  let newFindings = 0;

  for (const finding of findings) {
    byCategory[finding.category]++;
    bySeverity[finding.severity]++;

    if (baseline) {
      const fingerprint = generateFingerprint(finding);
      if (!baseline.fingerprints.has(fingerprint)) {
        newFindings++;
      }
    } else {
      newFindings++;
    }
  }

  const totalLoc = fileMetrics.reduce((sum, fm) => sum + fm.metrics.loc, 0);

  const totalComplexity = fileMetrics.reduce(
    (sum, fm) => sum + fm.metrics.fileComplexity,
    0
  );

  return {
    totalFindings: findings.length,
    byCategory,
    bySeverity,
    newFindings,
    totalLoc,
    totalComplexity,
    duplicationPercentage,
    coverage,
  };
}
