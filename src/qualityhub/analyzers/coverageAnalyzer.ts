import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Metrics } from "../core/types.js";

/**
 * Parse LCOV coverage file and extract metrics
 */
export function analyzeCoverage(
  coveragePath?: string
): Metrics["coverage"] | undefined {
  const paths = [
    coveragePath,
    join(process.cwd(), "coverage", "lcov.info"),
    join(process.cwd(), "coverage", "lcov-report", "lcov.info"),
  ].filter(Boolean) as string[];

  for (const path of paths) {
    if (existsSync(path)) {
      try {
        return parseLcov(path);
      } catch (e) {
        console.warn(`Could not parse coverage file ${path}: ${e}`);
      }
    }
  }

  return undefined;
}

function parseLcov(filePath: string): Metrics["coverage"] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let linesFound = 0;
  let linesHit = 0;
  let functionsFound = 0;
  let functionsHit = 0;
  let branchesFound = 0;
  let branchesHit = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("LF:")) {
      linesFound += parseInt(line.substring(3).trim(), 10);
    } else if (line.startsWith("LH:")) {
      linesHit += parseInt(line.substring(3).trim(), 10);
    } else if (line.startsWith("FNF:")) {
      functionsFound += parseInt(line.substring(4).trim(), 10);
    } else if (line.startsWith("FNH:")) {
      functionsHit += parseInt(line.substring(4).trim(), 10);
    } else if (line.startsWith("BRF:")) {
      branchesFound += parseInt(line.substring(4).trim(), 10);
    } else if (line.startsWith("BRH:")) {
      branchesHit += parseInt(line.substring(4).trim(), 10);
    }
  }

  return {
    lines: {
      found: linesFound,
      hit: linesHit,
      percent: linesFound > 0 ? (linesHit / linesFound) * 100 : 0,
    },
    functions: {
      found: functionsFound,
      hit: functionsHit,
      percent: functionsFound > 0 ? (functionsHit / functionsFound) * 100 : 0,
    },
    branches: {
      found: branchesFound,
      hit: branchesHit,
      percent: branchesFound > 0 ? (branchesHit / branchesFound) * 100 : 0,
    },
  };
}
