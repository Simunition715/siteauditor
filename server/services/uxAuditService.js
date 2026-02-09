const { chromium } = require("playwright");
const { discoverPages } = require("./uxAudit/pageDiscovery");
const { runClarityRules } = require("./uxAudit/rules/clarityRules");
const { runDirectionRules } = require("./uxAudit/rules/directionRules");
const { runTrustRules } = require("./uxAudit/rules/trustRules");
const { runFrictionRules } = require("./uxAudit/rules/frictionRules");
const { runMobileRules } = require("./uxAudit/rules/mobileRules");
const {
  calculateCategoryScore,
  calculateTotalScore,
  aggregateIssuesAcrossPages,
  identifyQuickWins,
  aggregateScores,
} = require("./uxAudit/scoring");
// Job service helpers
function updateJobProgress(jobs, jobId, progress) {
  const job = jobs.get(jobId);
  if (job) {
    job.progress = progress;
  }
}

function updateJobResult(jobs, jobId, result) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = "completed";
    job.progress = 100;
    job.result = result;
  }
}

function updateJobError(jobs, jobId, error) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = "failed";
    job.error = error;
  }
}

const DESKTOP_VIEWPORT = { width: 1366, height: 768 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MAX_SCAN_TIME = 30000; // 30 seconds

/**
 * Main UX audit runner
 */
async function runUxAudit(url, jobId, jobs) {
  const startTime = Date.now();
  let browser = null;

  try {
    updateJobProgress(jobs, jobId, 5);
    const job = jobs.get(jobId);
    if (job) {
      job.status = "running";
      job.message = "Discovering pages to scan...";
    }

    // Step 1: Discover pages
    const pages = await discoverPages(url);
    const scannedPages = Object.values(pages).filter(Boolean);
    updateJobProgress(jobs, jobId, 15);

    if (scannedPages.length === 0) {
      throw new Error("No pages found to scan");
    }

    // Step 2: Run rules on each page
    browser = await chromium.launch({ headless: true });
    const allIssues = [];
    const pageScores = [];

    // Note: We aggregate issues across all pages, then calculate scores
    // Page weights are not needed for issue aggregation

    let pageIndex = 0;
    for (const [pageType, pageUrl] of Object.entries(pages)) {
      if (!pageUrl) continue;

      // Check timeout
      if (Date.now() - startTime > MAX_SCAN_TIME) {
        console.warn("UX audit timeout reached");
        break;
      }

      updateJobProgress(
        jobs,
        jobId,
        15 + Math.floor((pageIndex / scannedPages.length) * 70)
      );
      const jobUpdate = jobs.get(jobId);
      if (jobUpdate) {
        jobUpdate.status = "running";
        jobUpdate.message = `Scanning ${pageType} page...`;
      }

      const context = await browser.newContext({
        viewport: DESKTOP_VIEWPORT,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      });

      try {
        const page = await context.newPage();
        // Use domcontentloaded for faster, more reliable loading
        // networkidle can timeout on sites with continuous network activity
        try {
          await page.goto(pageUrl, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });
          // Small delay for JS execution and dynamic content
          await page.waitForTimeout(1500);
        } catch (navError) {
          // Fallback to load event if domcontentloaded fails
          try {
            await page.goto(pageUrl, {
              waitUntil: "load",
              timeout: 20000,
            });
          } catch (fallbackError) {
            console.warn(`Navigation failed for ${pageUrl}:`, fallbackError.message);
            throw fallbackError; // Re-throw to be caught by outer catch
          }
        }

        // Run desktop rules
        const clarityIssues = await runClarityRules(page, pageUrl);
        const directionIssues = await runDirectionRules(
          page,
          pageUrl,
          false
        );
        const trustIssues = await runTrustRules(page, pageUrl);
        const frictionIssues = await runFrictionRules(page, pageUrl);

        allIssues.push(
          ...clarityIssues,
          ...directionIssues,
          ...trustIssues,
          ...frictionIssues
        );

        // Note: Scores will be calculated after all pages are scanned
        // Store page-specific issues for later aggregation
        pageScores.push({
          clarity: 0, // Placeholder, will be recalculated
          direction: 0,
          trust: 0,
          friction: 0,
          mobile: 0,
        });

        // Run mobile rules
        await context.close();
        const mobileContext = await browser.newContext({
          viewport: MOBILE_VIEWPORT,
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
        });

        const mobilePage = await mobileContext.newPage();
        // Use domcontentloaded for faster, more reliable loading
        try {
          await mobilePage.goto(pageUrl, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });
          // Small delay for JS execution
          await mobilePage.waitForTimeout(1500);
        } catch (navError) {
          // Fallback to load event if domcontentloaded fails
          try {
            await mobilePage.goto(pageUrl, {
              waitUntil: "load",
              timeout: 20000,
            });
          } catch (fallbackError) {
            console.warn(`Mobile navigation failed for ${pageUrl}:`, fallbackError.message);
            throw fallbackError;
          }
        }

        const mobileIssues = await runMobileRules(mobilePage, pageUrl);
        allIssues.push(...mobileIssues);

        await mobileContext.close();
      } catch (error) {
        console.error(`Error scanning ${pageType} page (${pageUrl}):`, error.message);
        // Add an error issue to the report so user knows this page failed
        allIssues.push({
          id: `ERROR_${pageType.toUpperCase()}`,
          category: "clarity", // Use clarity as default category
          title: `Failed to scan ${pageType} page`,
          passed: false,
          why: `Could not load or analyze ${pageUrl}: ${error.message}`,
          evidence: {
            selectors: [],
            values: { page: pageUrl, error: error.message },
          },
          suggestion: "Check if the URL is accessible and try again",
          impact: "Low",
          effort: "M",
          page: pageUrl,
        });
        // Continue with other pages
      }

      pageIndex++;
    }

    await browser.close();
    browser = null;

    // Step 3: Aggregate results
    updateJobProgress(jobs, jobId, 90);
    const jobAgg = jobs.get(jobId);
    if (jobAgg) {
      jobAgg.status = "running";
      jobAgg.message = "Aggregating results...";
    }

    // Aggregate issues
    const aggregatedIssues = aggregateIssuesAcrossPages(allIssues);

    // Calculate final scores from aggregated issues
    const finalScores = {
      clarity: calculateCategoryScore(aggregatedIssues, "clarity"),
      direction: calculateCategoryScore(aggregatedIssues, "direction"),
      trust: calculateCategoryScore(aggregatedIssues, "trust"),
      friction: calculateCategoryScore(aggregatedIssues, "friction"),
      mobile: calculateCategoryScore(aggregatedIssues, "mobile"),
    };
    finalScores.total = calculateTotalScore(finalScores);

    // Identify quick wins
    const quickWins = identifyQuickWins(aggregatedIssues);

    // Get top 10 issues
    const topIssues = aggregatedIssues
      .filter((issue) => !issue.passed)
      .sort((a, b) => {
        const impactOrder = { High: 3, Med: 2, Low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      })
      .slice(0, 10)
      .map((issue) => ({
        id: issue.id,
        category: issue.category,
        title: issue.title,
        why: issue.why,
        evidence: issue.evidence,
        suggestion: issue.suggestion,
        impact: issue.impact,
        effort: issue.effort,
      }));

    // Step 4: Generate report
    const report = {
      url,
      scannedPages,
      scores: finalScores,
      issues: topIssues,
      quickWins,
      timestamp: new Date().toISOString(),
    };

    updateJobProgress(jobs, jobId, 100);
    updateJobResult(jobs, jobId, report);
  } catch (error) {
    console.error("UX audit error:", error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    updateJobError(jobs, jobId, error.message);
  }
}

module.exports = { runUxAudit };

