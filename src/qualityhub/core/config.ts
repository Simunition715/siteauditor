import { readFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { pathToFileURL } from "url";
import { createRequire } from "module";
import type { QualityHubConfig } from "./types.js";

let cachedConfig: QualityHubConfig | null = null;

export async function loadConfigAsync(
  configPath?: string
): Promise<QualityHubConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Try to find config file
  const possiblePaths = [
    configPath,
    join(process.cwd(), "qualityhub.config.js"),
    join(process.cwd(), "qualityhub.config.json"),
  ].filter(Boolean) as string[];

  for (const path of possiblePaths) {
    try {
      if (path.endsWith(".json")) {
        const content = readFileSync(path, "utf-8");
        cachedConfig = JSON.parse(content);
        return cachedConfig!;
      } else if (path.endsWith(".js")) {
        // Dynamic import for JS config - need to convert to file:// URL
        const absolutePath = resolve(path);
        const fileUrl = pathToFileURL(absolutePath).href;
        const configModule = await import(fileUrl);
        cachedConfig = configModule.default || configModule;
        return cachedConfig!;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // Fall through to default config
  return getDefaultConfig();
}

export function loadConfig(configPath?: string): QualityHubConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Try to find config file (synchronous version for JSON only)
  const possiblePaths = [
    configPath,
    join(process.cwd(), "qualityhub.config.json"),
  ].filter(Boolean) as string[];

  for (const path of possiblePaths) {
    try {
      if (path.endsWith(".json")) {
        const content = readFileSync(path, "utf-8");
        cachedConfig = JSON.parse(content);
        return cachedConfig!;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // Fall through to default config
  return getDefaultConfig();
}

function getDefaultConfig(): QualityHubConfig {
  // Default config - more inclusive patterns to catch common project structures
  cachedConfig = {
    include: [
      "**/*.{ts,tsx,js,jsx,mjs,cjs}",
      "src/**/*.{ts,tsx,js,jsx}",
      "server/**/*.{ts,tsx,js,jsx}",
      "client/**/*.{ts,tsx,js,jsx}",
      "lib/**/*.{ts,tsx,js,jsx}",
      "app/**/*.{ts,tsx,js,jsx}",
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

  return cachedConfig;
}

export function getConfig(): QualityHubConfig {
  // Try async load first (for JS configs), fallback to sync
  // For MVP, we'll use sync version and handle JS configs in CLI
  return loadConfig();
}
