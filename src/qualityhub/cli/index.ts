#!/usr/bin/env node

import { Command } from "commander";
import { runScan } from "./commands/scan.js";
import { runGate } from "./commands/gate.js";
import { runBaseline } from "./commands/baseline.js";

const program = new Command();

program
  .name("qualityhub")
  .description("SonarQube-like static analysis and quality gate system")
  .version("1.0.0");

program
  .command("scan")
  .description("Run a quality scan and generate reports")
  .action(async () => {
    try {
      await runScan();
    } catch (error: any) {
      console.error("Error running scan:", error.message);
      process.exit(1);
    }
  });

program
  .command("gate")
  .description("Run scan and evaluate quality gate")
  .action(async () => {
    try {
      await runGate();
    } catch (error: any) {
      console.error("Error running gate:", error.message);
      process.exit(1);
    }
  });

program
  .command("baseline")
  .description("Create a baseline snapshot for new code comparison")
  .action(async () => {
    try {
      await runBaseline();
    } catch (error: any) {
      console.error("Error creating baseline:", error.message);
      process.exit(1);
    }
  });

program.parse();
