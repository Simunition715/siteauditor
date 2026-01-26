# QualityHub

SonarQube-like static analysis and quality gate system for TypeScript/JavaScript projects.

## Overview

QualityHub provides:

- **Static analysis findings**: Bugs, Vulnerabilities, Code Smells
- **Code metrics**: Complexity, duplication, LOC, test coverage
- **Quality Gate enforcement**: Fail CI if thresholds are violated
- **Dashboard reports**: HTML + JSON + console output
- **New code detection**: Baseline-based comparison to focus on new issues

## Installation

QualityHub is integrated into this project. Install dependencies:

```bash
npm install
npm run build:qualityhub
```

## Configuration

The `qualityhub.config.ts` file at the repository root is already configured:

```typescript
import type { QualityHubConfig } from "./src/qualityhub/core/types";

const config: QualityHubConfig = {
  include: ["src/**/*.{ts,tsx,js,jsx}"],
  exclude: ["**/node_modules/**", "**/dist/**"],
  baselineFile: ".qualityhub/baseline.json",
  gate: {
    mode: "new-code",
    failOnSeverities: ["CRITICAL", "BLOCKER"],
    maxNew: {
      BUG: 0,
      VULNERABILITY: 0,
      CODE_SMELL: 10,
    },
    // ... more config
  },
  reporters: {
    console: true,
    json: { outFile: ".qualityhub/report.json" },
    html: { outDir: ".qualityhub/html" },
  },
};

export default config;
```

## Usage

### From Repository Root

```bash
# Run a scan and generate reports
npm run quality:scan

# Run scan and evaluate quality gate (fails CI on violations)
npm run quality:gate

# Create a baseline snapshot for new code comparison
npm run quality:baseline
```

### Direct CLI Usage

```bash
cd qualityhub
npm run build
node dist/cli/index.js scan
node dist/cli/index.js gate
node dist/cli/index.js baseline
```

## Analyzers

### ESLint Analyzer

Runs ESLint on your codebase and converts findings to QualityHub format. Requires an ESLint configuration file.

### TypeScript AST Analyzer

Custom rules using ts-morph:

- **TS001**: Missing await in async call
- **TS002**: Empty catch block
- **TS003**: setState in render loop
- **SEC001**: eval() usage
- **SEC002**: new Function() usage
- **SEC003**: dangerouslySetInnerHTML without sanitization
- **SEC004**: Hard-coded secrets
- **SMELL001**: Function too long
- **SMELL002**: Nested ternary
- **SMELL003**: Excessive parameters

### Metrics Analyzer

Calculates:

- Lines of Code (LOC)
- Comment lines
- Cyclomatic complexity per function/file
- Function count

### Duplication Analyzer

Detects repeated code blocks using normalized line sequences.

### Coverage Analyzer

Parses `coverage/lcov.info` if present and extracts coverage metrics.

### Dependency Analyzer

Runs `npm audit` (or `pnpm audit`) and converts vulnerabilities to findings.

## Quality Gate

The quality gate enforces thresholds on:

- **New code findings**: Counts by category/severity
- **Overall findings**: Optional mode for total counts
- **Coverage**: Minimum percentage if required
- **Duplication**: Maximum percentage
- **Complexity**: Maximum per function and average per file

Gate fails if any threshold is violated, exiting with code 1.

## Baseline & New Code Detection

QualityHub uses baseline snapshots to identify "new" findings:

1. **Create baseline**: `npm run quality:baseline`
2. **Run scans**: Findings not in baseline are marked as "new"
3. **Gate focuses on new code**: Only new findings count toward gate thresholds

This allows you to:

- Accept existing technical debt
- Enforce quality standards on new code
- Track improvements over time

## Reports

### Console Reporter

Color-coded summary with top issues, printed to stdout.

### JSON Reporter

Machine-readable report at `.qualityhub/report.json`:

```json
{
  "findings": [...],
  "metrics": [...],
  "summary": {...},
  "timestamp": "..."
}
```

### HTML Reporter

Interactive dashboard at `.qualityhub/html/index.html`:

- Summary cards
- Filterable findings list
- Category/severity filters
- New code highlighting

## Adding Custom Rules

1. Define rule in `src/qualityhub/rules/`:

```typescript
export const myRule: Rule = {
  id: "CUSTOM001",
  title: "My custom rule",
  description: "...",
  remediation: "...",
  category: "CODE_SMELL",
  severity: "MINOR",
  effortMinutes: 15,
  tags: ["custom"],
};
```

2. Add to `src/qualityhub/rules/index.ts`:

```typescript
export const allRules: Rule[] = [
  ...bugRules,
  ...securityRules,
  ...smellRules,
  myRule, // Add here
];
```

3. Implement detection in `src/qualityhub/analyzers/tsAstAnalyzer.ts` or create a new analyzer.

## CI Integration

Recommended CI workflow:

```yaml
steps:
  - name: Lint & Type Check
    run: npm run lint && npm run typecheck

  - name: Quality Gate
    run: npm run quality:gate

  - name: Unit Tests
    run: npm test

  - name: Lighthouse/HTTP Checks
    run: npm run test:lighthouse && npm run test:http
```

## Performance

- Scans typically complete in 10-30 seconds for medium repos
- Excludes `node_modules`, `dist`, `build` by default
- Parallel file processing where possible

## Limitations

- MVP implementation - some heuristics may have false positives
- Git diff-based new code detection is basic (baseline-based is primary)
- Coverage analysis requires LCOV format
- Dependency analysis requires npm/pnpm/yarn

## License

MIT
