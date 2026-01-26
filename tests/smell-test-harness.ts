/**
 * Test harness for smell rule validation
 *
 * Usage: npm run test:smells
 *
 * This script runs the QualityHub analyzer on test fixtures and validates
 * that findings match expected results.
 */

import { analyzeWithTSAST } from "../src/qualityhub/analyzers/tsAstAnalyzer.js";
import { findFiles } from "../src/qualityhub/core/fileWalker.js";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

interface TestCase {
  file: string;
  expectedFindings: string[]; // Array of expected rule IDs
  description: string;
}

interface TestResult {
  file: string;
  expected: string[];
  actual: string[];
  passed: boolean;
  description: string;
}

const FIXTURES_DIR = join(process.cwd(), "tests", "fixtures", "smells");

async function loadTestCases(): Promise<Map<string, TestCase[]>> {
  const testCases = new Map<string, TestCase[]>();

  // Scan fixture directories
  const smellDirs = readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const smellId of smellDirs) {
    const smellDir = join(FIXTURES_DIR, smellId);
    const files = readdirSync(smellDir)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
      .map((f) => join(smellDir, f));

    const cases: TestCase[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const fileName = file.split(/[/\\]/).pop() || "";

      // Determine expected findings from filename
      let expectedFindings: string[] = [];
      if (fileName.includes("true-positive")) {
        expectedFindings = [smellId];
      } else if (
        fileName.includes("true-negative") ||
        fileName.includes("with-suppression")
      ) {
        expectedFindings = [];
      }

      // Extract description from comment
      const descriptionMatch = content.match(/\/\/\s*(.+)/);
      const description = descriptionMatch ? descriptionMatch[1] : fileName;

      cases.push({
        file,
        expectedFindings,
        description,
      });
    }

    testCases.set(smellId, cases);
  }

  return testCases;
}

async function runTests(): Promise<void> {
  console.log("🧪 Running Smell Rule Test Harness\n");

  const testCases = await loadTestCases();
  const results: TestResult[] = [];

  for (const [smellId, cases] of testCases.entries()) {
    console.log(`\n📋 Testing ${smellId}:`);

    for (const testCase of cases) {
      // Create FileInfo for the test file
      const content = readFileSync(testCase.file, "utf-8");
      const extension = testCase.file.endsWith(".tsx") ? "tsx" : "ts";
      const fileInfo = {
        path: testCase.file,
        content,
        extension,
      };

      // Run analyzer
      const findings = await analyzeWithTSAST([fileInfo]);
      const actualRuleIds = findings
        .filter((f) => f.ruleId === smellId)
        .map((f) => f.ruleId);

      const passed =
        actualRuleIds.length === testCase.expectedFindings.length &&
        testCase.expectedFindings.every((id) => actualRuleIds.includes(id));

      results.push({
        file: testCase.file.split(/[/\\]/).pop() || "",
        expected: testCase.expectedFindings,
        actual: actualRuleIds,
        passed,
        description: testCase.description,
      });

      const status = passed ? "✅" : "❌";
      console.log(
        `  ${status} ${testCase.file
          .split(/[/\\]/)
          .pop()}: Expected [${testCase.expectedFindings.join(
          ", "
        )}], Got [${actualRuleIds.join(", ")}]`
      );
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed < total) {
    console.log("\n❌ Failed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.file}`);
        console.log(`    Expected: [${r.expected.join(", ")}]`);
        console.log(`    Actual: [${r.actual.join(", ")}]`);
      });
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((err) => {
    console.error("Test harness error:", err);
    process.exit(1);
  });
}

export { runTests, loadTestCases };
