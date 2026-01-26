export type Category = "BUG" | "VULNERABILITY" | "CODE_SMELL";

export type Severity = "INFO" | "MINOR" | "MAJOR" | "CRITICAL" | "BLOCKER";

export interface Finding {
  id: string; // Stable rule id, e.g. TS001, SEC002
  title: string;
  description: string;
  remediation: string;
  filePath: string;
  line: number;
  column?: number;
  category: Category;
  severity: Severity;
  effortMinutes: number; // Estimate
  tags: string[]; // e.g. react, security, performance
  fingerprint: string; // Hash of rule+file+line+snippet for baseline diff
  ruleId: string; // Same as id, kept for clarity
  message?: string; // Optional additional message
}

export interface Metrics {
  loc: number;
  commentLoc: number;
  functions: Array<{
    name: string;
    line: number;
    complexity: number;
  }>;
  fileComplexity: number; // Average complexity
  duplication: {
    duplicatedLines: number;
    duplicatedBlocks: number;
    duplicationPercentage: number;
  };
  coverage?: {
    lines: {
      found: number;
      hit: number;
      percent: number;
    };
    functions: {
      found: number;
      hit: number;
      percent: number;
    };
    branches: {
      found: number;
      hit: number;
      percent: number;
    };
  };
}

export interface FileMetrics {
  filePath: string;
  metrics: Metrics;
}

export interface ScanResult {
  findings: Finding[];
  metrics: FileMetrics[];
  summary: {
    totalFindings: number;
    byCategory: Record<Category, number>;
    bySeverity: Record<Severity, number>;
    newFindings: number;
    totalLoc: number;
    totalComplexity: number;
    duplicationPercentage: number;
    coverage?: Metrics["coverage"];
  };
  timestamp: string;
}

export interface Baseline {
  fingerprints: Set<string>;
  metrics: {
    totalLoc: number;
    totalComplexity: number;
    duplicationPercentage: number;
    coverage?: Metrics["coverage"];
  };
  timestamp: string;
}

export interface QualityGateConfig {
  mode: "new-code" | "overall";
  failOnSeverities: Severity[];
  maxNew: {
    BUG: number;
    VULNERABILITY: number;
    CODE_SMELL: number;
  };
  maxOverall: {
    BUG: number;
    VULNERABILITY: number;
    CODE_SMELL: number;
  };
  coverage?: {
    minOverallPct: number;
    minNewCodePct: number;
    required: boolean;
  };
  duplication?: {
    maxDupLinesNew: number;
    maxDupPctOverall: number;
  };
  complexity?: {
    maxCyclomaticPerFn: number;
    maxAvgPerFile: number;
  };
}

export interface QualityHubConfig {
  include: string[];
  exclude: string[];
  baselineFile: string;
  gate: QualityGateConfig;
  reporters: {
    console: boolean;
    json?: { outFile: string };
    html?: { outDir: string };
  };
}

export interface GateResult {
  passed: boolean;
  failures: string[];
  warnings: string[];
}
