import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { ScanResult } from "../core/types.js";
import type { Reporter } from "../core/reporter.js";

export class JsonReporter implements Reporter {
  private outFile: string;

  constructor(outFile: string) {
    this.outFile = outFile;
  }

  report(result: ScanResult): void {
    // Ensure directory exists
    mkdirSync(dirname(this.outFile), { recursive: true });

    // Convert to JSON-serializable format
    const json = JSON.stringify(result, null, 2);
    writeFileSync(this.outFile, json, "utf-8");
    console.log(`JSON report written to: ${this.outFile}`);
  }
}
