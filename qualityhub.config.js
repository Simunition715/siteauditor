// JavaScript version of qualityhub.config.ts
// This can be used if TypeScript config compilation is not available

/** @type {import('./src/qualityhub/core/types').QualityHubConfig} */
const config = {
  include: [
    "src/**/*.{ts,tsx,js,jsx}",
    "server/**/*.{ts,tsx,js,jsx}",
    "client/src/**/*.{ts,tsx,js,jsx}",
  ],
  exclude: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/coverage/**",
    "**/.qualityhub/**",
  ],
  baselineFile: ".qualityhub/baseline.json",
  gate: {
    mode: "new-code",
    failOnSeverities: ["CRITICAL", "BLOCKER"],
    maxNew: {
      BUG: 0,
      VULNERABILITY: 0,
      CODE_SMELL: 10,
    },
    maxOverall: {
      BUG: 50,
      VULNERABILITY: 0,
      CODE_SMELL: 500,
    },
    coverage: {
      minOverallPct: 70,
      minNewCodePct: 80,
      required: false,
    },
    duplication: {
      maxDupLinesNew: 30,
      maxDupPctOverall: 8,
    },
    complexity: {
      maxCyclomaticPerFn: 15,
      maxAvgPerFile: 10,
    },
  },
  reporters: {
    console: true,
    json: { outFile: ".qualityhub/report.json" },
    html: { outDir: ".qualityhub/html" },
  },
};

export default config;
