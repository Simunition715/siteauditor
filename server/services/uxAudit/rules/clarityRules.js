/**
 * Clarity rules - checks for clear messaging and navigation
 */

async function checkH1InViewport(page) {
  try {
    const result = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) {
        return {
          passed: false,
          evidence: { selectors: ["h1"], values: { found: false } },
        };
      }

      const rect = h1.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const inViewport = rect.top >= 0 && rect.top < viewportHeight;

      return {
        passed: inViewport,
        evidence: {
          selectors: ["h1"],
          values: {
            found: true,
            top: Math.round(rect.top),
            viewportHeight,
            inViewport,
          },
        },
      };
    });

    return {
      id: "CLARITY_001",
      category: "clarity",
      title: "H1 present in first viewport",
      passed: result.passed,
      why: result.passed
        ? "H1 is visible above the fold, helping users understand the page purpose"
        : "H1 is missing or below the fold, making it harder for users to understand the page",
      evidence: result.evidence,
      suggestion: result.passed
        ? ""
        : "Move the H1 element to the top of the page, within the first viewport",
      impact: "High",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "CLARITY_001",
      category: "clarity",
      title: "H1 present in first viewport",
      passed: false,
      why: "Error checking H1 visibility",
      evidence: { selectors: ["h1"], values: { error: error.message } },
      suggestion: "Ensure H1 exists and is visible",
      impact: "High",
      effort: "S",
    };
  }
}

async function checkH1Length(page) {
  try {
    const result = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) {
        return { passed: false, length: 0 };
      }
      const text = h1.textContent?.trim() || "";
      return { passed: text.length <= 80, length: text.length };
    });

    return {
      id: "CLARITY_002",
      category: "clarity",
      title: "H1 length is concise (≤80 chars)",
      passed: result.passed,
      why: result.passed
        ? "H1 is concise and scannable"
        : `H1 is ${result.length} characters, which may be too long for quick scanning`,
      evidence: {
        selectors: ["h1"],
        values: { length: result.length, maxRecommended: 80 },
      },
      suggestion: result.passed
        ? ""
        : "Shorten the H1 to 80 characters or less for better readability",
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "CLARITY_002",
      category: "clarity",
      title: "H1 length is concise",
      passed: false,
      why: "Error checking H1 length",
      evidence: { selectors: ["h1"], values: { error: error.message } },
      suggestion: "Check H1 element",
      impact: "Med",
      effort: "S",
    };
  }
}

async function checkHeroSupportingContent(page) {
  try {
    const result = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return { passed: false, hasParagraph: false, hasSubhead: false };

      const h1Rect = h1.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const heroArea = {
        top: 0,
        bottom: Math.min(viewportHeight, h1Rect.bottom + 200),
      };

      // Check for paragraph or subheadline near H1
      const allElements = Array.from(document.querySelectorAll("p, h2, h3"));
      let hasParagraph = false;
      let hasSubhead = false;

      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        if (
          rect.top >= heroArea.top &&
          rect.bottom <= heroArea.bottom &&
          rect.top > h1Rect.bottom
        ) {
          if (el.tagName === "P") hasParagraph = true;
          if (el.tagName === "H2" || el.tagName === "H3") hasSubhead = true;
        }
      }

      return {
        passed: hasParagraph || hasSubhead,
        hasParagraph,
        hasSubhead,
      };
    });

    return {
      id: "CLARITY_003",
      category: "clarity",
      title: "Hero section has supporting content",
      passed: result.passed,
      why: result.passed
        ? "Hero section includes supporting text to explain the value proposition"
        : "Hero section lacks supporting paragraphs or subheadlines near the H1",
      evidence: {
        selectors: ["h1", "p", "h2", "h3"],
        values: {
          hasParagraph: result.hasParagraph,
          hasSubhead: result.hasSubhead,
        },
      },
      suggestion: result.passed
        ? ""
        : "Add a supporting paragraph or subheadline below the H1 to provide context",
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "CLARITY_003",
      category: "clarity",
      title: "Hero section has supporting content",
      passed: false,
      why: "Error checking hero content",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Add supporting content near H1",
      impact: "Med",
      effort: "S",
    };
  }
}

async function checkPageTitle(page) {
  try {
    const result = await page.evaluate(() => {
      const title = document.querySelector("title");
      const titleText = title?.textContent?.trim() || "";
      return { passed: titleText.length > 0, length: titleText.length };
    });

    return {
      id: "CLARITY_004",
      category: "clarity",
      title: "Page title tag exists and is non-empty",
      passed: result.passed,
      why: result.passed
        ? "Page has a descriptive title"
        : "Page title is missing or empty, affecting SEO and browser tabs",
      evidence: {
        selectors: ["title"],
        values: { length: result.length, exists: result.passed },
      },
      suggestion: result.passed
        ? ""
        : "Add a descriptive title tag to the page",
      impact: "High",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "CLARITY_004",
      category: "clarity",
      title: "Page title exists",
      passed: false,
      why: "Error checking page title",
      evidence: { selectors: ["title"], values: { error: error.message } },
      suggestion: "Add title tag",
      impact: "High",
      effort: "S",
    };
  }
}

async function checkNavLabels(page) {
  try {
    const result = await page.evaluate(() => {
      const navLinks = Array.from(
        document.querySelectorAll("nav a, header a, [role='navigation'] a")
      ).slice(0, 10); // Sample first 10

      let visibleTextCount = 0;
      let ariaLabelCount = 0;
      let iconOnlyCount = 0;

      for (const link of navLinks) {
        const text = link.textContent?.trim() || "";
        const hasAriaLabel = link.hasAttribute("aria-label");
        const hasIcon = link.querySelector("svg, img, i, [class*='icon']");

        if (text.length > 0) {
          visibleTextCount++;
        } else if (hasAriaLabel) {
          ariaLabelCount++;
        } else if (hasIcon) {
          iconOnlyCount++;
        }
      }

      const total = navLinks.length;
      const hasLabels = visibleTextCount > 0 || ariaLabelCount > 0;
      const mysteryMeat = iconOnlyCount > 0 && !hasLabels;

      return {
        passed: !mysteryMeat,
        visibleTextCount,
        ariaLabelCount,
        iconOnlyCount,
        total,
      };
    });

    return {
      id: "CLARITY_005",
      category: "clarity",
      title: "Navigation has visible text labels",
      passed: result.passed,
      why: result.passed
        ? "Navigation links have visible text or aria-labels, avoiding 'mystery meat' navigation"
        : "Navigation contains icon-only links without labels, making it unclear what they do",
      evidence: {
        selectors: ["nav a", "header a"],
        values: {
          visibleTextLinks: result.visibleTextCount,
          ariaLabelLinks: result.ariaLabelCount,
          iconOnlyLinks: result.iconOnlyCount,
          totalLinks: result.total,
        },
      },
      suggestion: result.passed
        ? ""
        : "Add visible text labels or aria-label attributes to icon-only navigation links",
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "CLARITY_005",
      category: "clarity",
      title: "Navigation has visible labels",
      passed: false,
      why: "Error checking navigation labels",
      evidence: { selectors: ["nav a"], values: { error: error.message } },
      suggestion: "Add labels to navigation links",
      impact: "Med",
      effort: "S",
    };
  }
}

async function runClarityRules(page, pageUrl) {
  const rules = [
    checkH1InViewport,
    checkH1Length,
    checkHeroSupportingContent,
    checkPageTitle,
    checkNavLabels,
  ];

  const results = [];
  for (const rule of rules) {
    try {
      const result = await rule(page);
      results.push({ ...result, page: pageUrl });
    } catch (error) {
      results.push({
        id: "CLARITY_ERROR",
        category: "clarity",
        title: "Rule execution error",
        passed: false,
        why: `Error running rule: ${error.message}`,
        evidence: { selectors: [], values: { error: error.message } },
        suggestion: "Review rule implementation",
        impact: "Low",
        effort: "M",
        page: pageUrl,
      });
    }
  }

  return results;
}

module.exports = { runClarityRules };

