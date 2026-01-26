import { runScan } from "./scan.js";
import { loadConfigAsync } from "../../core/config.js";
import { loadBaseline } from "../../core/findings.js";
import { evaluateGate } from "../../core/gate.js";
import chalk from "chalk";

export async function runGate(): Promise<boolean> {
  const config = await loadConfigAsync();
  const baseline = loadBaseline(config.baselineFile);

  console.log("Running QualityHub gate...\n");

  const result = await runScan();

  const gateResult = evaluateGate(result, config.gate, baseline);

  console.log("\n" + chalk.bold("Quality Gate Results:"));
  console.log("=".repeat(60));

  if (gateResult.passed) {
    console.log(chalk.green.bold("✓ Gate PASSED"));
  } else {
    console.log(chalk.red.bold("✗ Gate FAILED"));
  }

  if (gateResult.failures.length > 0) {
    console.log("\n" + chalk.red.bold("Failures:"));
    for (const failure of gateResult.failures) {
      console.log(`  - ${failure}`);
    }
  }

  if (gateResult.warnings.length > 0) {
    console.log("\n" + chalk.yellow.bold("Warnings:"));
    for (const warning of gateResult.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  console.log("");

  if (!gateResult.passed) {
    process.exit(1);
  }

  return gateResult.passed;
}
