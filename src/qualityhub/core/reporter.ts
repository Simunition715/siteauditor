import type { ScanResult } from "./types.js";

/**
 * Base reporter interface
 */
export interface Reporter {
  report(result: ScanResult): void | Promise<void>;
}

/**
 * Aggregate multiple reporters
 */
export class CompositeReporter implements Reporter {
  private reporters: Reporter[];

  constructor(reporters: Reporter[]) {
    this.reporters = reporters;
  }

  async report(result: ScanResult): Promise<void> {
    for (const reporter of this.reporters) {
      await reporter.report(result);
    }
  }
}
