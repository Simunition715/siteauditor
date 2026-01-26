import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { ScanResult, Finding } from "../core/types.js";
import type { Reporter } from "../core/reporter.js";
import { isNewFinding } from "../core/findings.js";
import type { Baseline } from "../core/types.js";

export class HtmlReporter implements Reporter {
  private outDir: string;
  private baseline: Baseline | null;

  constructor(outDir: string, baseline: Baseline | null = null) {
    this.outDir = outDir;
    this.baseline = baseline;
  }

  report(result: ScanResult): void {
    mkdirSync(this.outDir, { recursive: true });

    const html = generateHtml(result, this.baseline);
    const indexPath = join(this.outDir, "index.html");
    writeFileSync(indexPath, html, "utf-8");

    // Write CSS and JS assets
    writeFileSync(join(this.outDir, "report.css"), getCss(), "utf-8");
    writeFileSync(join(this.outDir, "report.js"), getJs(), "utf-8");

    console.log(`HTML report written to: ${indexPath}`);
  }
}

function generateHtml(result: ScanResult, baseline: Baseline | null): string {
  const newFindings = result.findings.filter((f) => isNewFinding(f, baseline));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QualityHub Report</title>
  <link rel="stylesheet" href="report.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>QualityHub Report</h1>
      <div class="timestamp">Generated: ${new Date(
        result.timestamp
      ).toLocaleString()}</div>
    </header>

    <section class="summary">
      <div class="summary-card">
        <div class="card-value">${result.summary.totalFindings}</div>
        <div class="card-label">Total Findings</div>
      </div>
      <div class="summary-card ${newFindings.length > 0 ? "has-new" : ""}">
        <div class="card-value">${newFindings.length}</div>
        <div class="card-label">New Findings</div>
      </div>
      <div class="summary-card bug">
        <div class="card-value">${result.summary.byCategory.BUG}</div>
        <div class="card-label">Bugs</div>
      </div>
      <div class="summary-card vulnerability">
        <div class="card-value">${result.summary.byCategory.VULNERABILITY}</div>
        <div class="card-label">Vulnerabilities</div>
      </div>
      <div class="summary-card smell">
        <div class="card-value">${result.summary.byCategory.CODE_SMELL}</div>
        <div class="card-label">Code Smells</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${result.summary.totalLoc.toLocaleString()}</div>
        <div class="card-label">Lines of Code</div>
      </div>
    </section>

    <section class="filters">
      <label>
        <input type="checkbox" id="filter-bug" checked> Bugs
      </label>
      <label>
        <input type="checkbox" id="filter-vulnerability" checked> Vulnerabilities
      </label>
      <label>
        <input type="checkbox" id="filter-smell" checked> Code Smells
      </label>
      <label>
        <input type="checkbox" id="filter-new" checked> New Only
      </label>
      <select id="severity-filter">
        <option value="">All Severities</option>
        <option value="BLOCKER">BLOCKER</option>
        <option value="CRITICAL">CRITICAL</option>
        <option value="MAJOR">MAJOR</option>
        <option value="MINOR">MINOR</option>
        <option value="INFO">INFO</option>
      </select>
    </section>

    <section class="findings">
      <h2>Findings</h2>
      <div id="findings-list">
        ${result.findings
          .map((f, idx) => renderFinding(f, idx, baseline))
          .join("")}
      </div>
    </section>
  </div>

  <script src="report.js"></script>
  <script>
    window.findingsData = ${JSON.stringify(result.findings)};
    window.baselineData = ${JSON.stringify(
      baseline ? Array.from(baseline.fingerprints) : []
    )};
  </script>
</body>
</html>`;
}

function renderFinding(
  finding: Finding,
  idx: number,
  baseline: Baseline | null
): string {
  const isNew = baseline ? isNewFinding(finding, baseline) : false;
  const severityClass = finding.severity.toLowerCase();
  const categoryClass = finding.category.toLowerCase();

  return `
    <div class="finding ${categoryClass} ${severityClass}" data-idx="${idx}" data-category="${
    finding.category
  }" data-severity="${finding.severity}" data-is-new="${isNew}">
      <div class="finding-header">
        <span class="finding-id">${finding.id}</span>
        <span class="finding-severity ${severityClass}">${
    finding.severity
  }</span>
        ${isNew ? '<span class="finding-new">NEW</span>' : ""}
        <span class="finding-category">${finding.category}</span>
      </div>
      <div class="finding-title">${escapeHtml(finding.title)}</div>
      <div class="finding-location">${escapeHtml(finding.filePath)}:${
    finding.line
  }</div>
      <div class="finding-description">${escapeHtml(finding.description)}</div>
      <div class="finding-remediation">
        <strong>Remediation:</strong> ${escapeHtml(finding.remediation)}
      </div>
      <div class="finding-tags">
        ${finding.tags
          .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
          .join("")}
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = { innerHTML: text };
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCss(): string {
  return `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header h1 {
  color: #2563eb;
  margin-bottom: 10px;
}

.timestamp {
  color: #666;
  font-size: 14px;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-card.bug {
  border-left: 4px solid #ef4444;
}

.summary-card.vulnerability {
  border-left: 4px solid #a855f7;
}

.summary-card.smell {
  border-left: 4px solid #f59e0b;
}

.summary-card.has-new {
  border-left: 4px solid #3b82f6;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filters {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filters label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.findings {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.findings h2 {
  margin-bottom: 20px;
  color: #1f2937;
}

.finding {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.2s;
}

.finding:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.finding-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.finding-id {
  font-weight: bold;
  color: #2563eb;
}

.finding-severity {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.finding-severity.blocker,
.finding-severity.critical {
  background: #fee2e2;
  color: #991b1b;
}

.finding-severity.major {
  background: #fef3c7;
  color: #92400e;
}

.finding-severity.minor {
  background: #e0e7ff;
  color: #3730a3;
}

.finding-severity.info {
  background: #f3f4f6;
  color: #4b5563;
}

.finding-new {
  background: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.finding-category {
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
}

.finding-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2937;
}

.finding-location {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 10px;
}

.finding-description {
  margin-bottom: 10px;
  color: #4b5563;
}

.finding-remediation {
  background: #f0f9ff;
  padding: 12px;
  border-radius: 4px;
  margin-top: 10px;
  border-left: 3px solid #0ea5e9;
}

.finding-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.tag {
  background: #e5e7eb;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #4b5563;
}

.finding.hidden {
  display: none;
}
`;
}

function getJs(): string {
  return `
(function() {
  const findings = document.querySelectorAll('.finding');
  const filterBug = document.getElementById('filter-bug');
  const filterVulnerability = document.getElementById('filter-vulnerability');
  const filterSmell = document.getElementById('filter-smell');
  const filterNew = document.getElementById('filter-new');
  const severityFilter = document.getElementById('severity-filter');

  function applyFilters() {
    findings.forEach(finding => {
      const category = finding.dataset.category;
      const severity = finding.dataset.severity;
      const isNew = finding.dataset.isNew === 'true';

      let visible = true;

      // Category filters
      if (category === 'BUG' && !filterBug.checked) visible = false;
      if (category === 'VULNERABILITY' && !filterVulnerability.checked) visible = false;
      if (category === 'CODE_SMELL' && !filterSmell.checked) visible = false;

      // New filter
      if (filterNew.checked && !isNew) visible = false;

      // Severity filter
      if (severityFilter.value && severity !== severityFilter.value) visible = false;

      finding.classList.toggle('hidden', !visible);
    });
  }

  filterBug.addEventListener('change', applyFilters);
  filterVulnerability.addEventListener('change', applyFilters);
  filterSmell.addEventListener('change', applyFilters);
  filterNew.addEventListener('change', applyFilters);
  severityFilter.addEventListener('change', applyFilters);
})();
`;
}
