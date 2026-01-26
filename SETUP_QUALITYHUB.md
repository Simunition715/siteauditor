# QualityHub Setup Instructions

## Quick Start

1. **Install dependencies (includes QualityHub):**

   ```bash
   npm install
   ```

2. **Build QualityHub:**

   ```bash
   npm run build:qualityhub
   ```

3. **Create a baseline (optional but recommended):**

   ```bash
   npm run quality:baseline
   ```

4. **Run a scan:**

   ```bash
   npm run quality:scan
   ```

5. **Run quality gate (for CI):**
   ```bash
   npm run quality:gate
   ```

## Configuration

The configuration file `qualityhub.config.ts` (or `qualityhub.config.js`) is located at the repository root. It defines:

- File patterns to include/exclude
- Quality gate thresholds
- Reporter settings

## Integration with Existing Workflows

### Recommended CI Order

1. **Lint & Type Check** (if available)

   ```bash
   npm run lint
   npm run typecheck
   ```

2. **Quality Gate**

   ```bash
   npm run quality:gate
   ```

3. **Unit Tests**

   ```bash
   npm test
   ```

4. **Lighthouse/HTTP Checks** (existing)
   ```bash
   npm run test:lighthouse
   npm run test:http
   ```

## Notes

- QualityHub is integrated into the main project at `src/qualityhub/`
- QualityHub reports are written to `.qualityhub/` directory (gitignored)
- Baseline file (`.qualityhub/baseline.json`) tracks existing findings
- New findings are detected by comparing against baseline
- Quality gate focuses on new code by default (configurable)

## Troubleshooting

### Missing Dependencies

If you see module not found errors, ensure all dependencies are installed:

```bash
npm install
```

### TypeScript Config Not Loading

If `qualityhub.config.ts` isn't loading, use `qualityhub.config.js` instead, or ensure TypeScript is compiled:

```bash
npm run build:qualityhub
```

### ESLint Not Running

ESLint analyzer requires an ESLint configuration file. If none exists, the analyzer will skip gracefully.

### Coverage Not Detected

Coverage analyzer looks for `coverage/lcov.info`. Ensure your test runner generates LCOV format.
