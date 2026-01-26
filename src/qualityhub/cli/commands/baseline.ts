import { runScan } from "./scan.js";
import { loadConfigAsync } from "../../core/config.js";
import {
  saveBaseline,
  createBaselineFromFindings,
} from "../../core/findings.js";
import chalk from "chalk";

export async function runBaseline(): Promise<void> {
  const config = await loadConfigAsync();

  console.log("Creating QualityHub baseline...\n");

  const result = await runScan();

  const baseline = createBaselineFromFindings(result.findings, result.summary);

  saveBaseline(baseline, config.baselineFile);

  console.log(chalk.green(`\n✓ Baseline saved to ${config.baselineFile}`));
  console.log(`  - ${baseline.fingerprints.size} findings recorded\n`);
}
