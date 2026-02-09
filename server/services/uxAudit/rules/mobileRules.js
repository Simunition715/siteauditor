/**
 * Mobile UX rules - checks for mobile-specific usability issues
 */

async function checkTapTargetSize(page) {
  try {
    const result = await page.evaluate(() => {
      const viewportHeight = window.innerHeight;
      const interactiveElements = Array.from(
        document.querySelectorAll(
          "a, button, input, select, textarea, [role='button'], [tabindex='0']"
        )
      )
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.top < viewportHeight;
        })
        .slice(0, 15); // Sample top 15

      const minSize = 44; // 44x44px minimum
      const undersized = interactiveElements
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const width = rect.width;
          const height = rect.height;
          const meetsSize = width >= minSize && height >= minSize;

          return {
            element: el.tagName,
            width: Math.round(width),
            height: Math.round(height),
            meetsSize,
          };
        })
        .filter((item) => !item.meetsSize);

      return {
        passed: undersized.length === 0,
        totalChecked: interactiveElements.length,
        undersizedCount: undersized.length,
        undersized: undersized.slice(0, 5),
      };
    });

    return {
      id: "MOBILE_001",
      category: "mobile",
      title: "Tap targets are adequately sized (≥44x44px)",
      passed: result.passed,
      why: result.passed
        ? `All ${result.totalChecked} interactive elements in viewport meet minimum size`
        : `Found ${result.undersizedCount} interactive element(s) smaller than 44x44px`,
      evidence: {
        selectors: ["a", "button", "input", "[role='button']"],
        values: {
          totalChecked: result.totalChecked,
          undersizedCount: result.undersizedCount,
          undersized: result.undersized,
          minSize: 44,
        },
      },
      suggestion: result.passed
        ? ""
        : "Increase tap target sizes to at least 44x44px for better mobile usability",
      impact: "High",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "MOBILE_001",
      category: "mobile",
      title: "Tap target size check",
      passed: false,
      why: "Error checking tap target sizes",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Ensure tap targets are at least 44x44px",
      impact: "High",
      effort: "S",
    };
  }
}

async function checkTapTargetSpacing(page) {
  try {
    const result = await page.evaluate(() => {
      const viewportHeight = window.innerHeight;
      const interactiveElements = Array.from(
        document.querySelectorAll(
          "a, button, input, select, textarea, [role='button']"
        )
      )
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.top < viewportHeight;
        })
        .slice(0, 20);

      const minSpacing = 8; // 8px minimum
      let tooClose = 0;

      for (let i = 0; i < interactiveElements.length - 1; i++) {
        const rect1 = interactiveElements[i].getBoundingClientRect();
        const rect2 = interactiveElements[i + 1].getBoundingClientRect();

        // Calculate distance between edges
        const horizontalDistance =
          rect2.left > rect1.right
            ? rect2.left - rect1.right
            : rect1.left - rect2.right;
        const verticalDistance =
          rect2.top > rect1.bottom
            ? rect2.top - rect1.bottom
            : rect1.top - rect2.bottom;

        const distance = Math.max(horizontalDistance, verticalDistance);

        if (distance > 0 && distance < minSpacing) {
          tooClose++;
        }
      }

      return {
        passed: tooClose === 0,
        totalChecked: interactiveElements.length,
        tooCloseCount: tooClose,
      };
    });

    return {
      id: "MOBILE_002",
      category: "mobile",
      title: "Tap targets have adequate spacing (≥8px)",
      passed: result.passed,
      why: result.passed
        ? `All ${result.totalChecked} interactive elements have adequate spacing`
        : `Found ${result.tooCloseCount} pair(s) of interactive elements with insufficient spacing`,
      evidence: {
        selectors: ["a", "button", "input"],
        values: {
          totalChecked: result.totalChecked,
          tooCloseCount: result.tooCloseCount,
          minSpacing: 8,
        },
      },
      suggestion: result.passed
        ? ""
        : "Increase spacing between interactive elements to at least 8px to prevent accidental taps",
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "MOBILE_002",
      category: "mobile",
      title: "Tap target spacing check",
      passed: false,
      why: "Error checking tap target spacing",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Ensure adequate spacing between tap targets",
      impact: "Med",
      effort: "S",
    };
  }
}

async function checkHorizontalOverflow(page) {
  try {
    const result = await page.evaluate(() => {
      const documentWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth
      );
      const viewportWidth = window.innerWidth;
      const overflow = documentWidth - viewportWidth;
      const epsilon = 5; // Allow small epsilon for rounding

      return {
        passed: overflow <= epsilon,
        documentWidth: Math.round(documentWidth),
        viewportWidth: Math.round(viewportWidth),
        overflow: Math.round(overflow),
      };
    });

    return {
      id: "MOBILE_003",
      category: "mobile",
      title: "No horizontal overflow",
      passed: result.passed,
      why: result.passed
        ? "Page fits within viewport width"
        : `Page overflows viewport by ${result.overflow}px, causing horizontal scrolling`,
      evidence: {
        selectors: ["body", "html"],
        values: {
          documentWidth: result.documentWidth,
          viewportWidth: result.viewportWidth,
          overflow: result.overflow,
        },
      },
      suggestion: result.passed
        ? ""
        : "Fix elements causing horizontal overflow (check for fixed widths, images, or wide content)",
      impact: "High",
      effort: "M",
    };
  } catch (error) {
    return {
      id: "MOBILE_003",
      category: "mobile",
      title: "Horizontal overflow check",
      passed: false,
      why: "Error checking horizontal overflow",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Fix horizontal overflow issues",
      impact: "High",
      effort: "M",
    };
  }
}

async function checkStickyHeaderOverlap(page) {
  try {
    const result = await page.evaluate(() => {
      // Find sticky/fixed headers
      const headers = Array.from(
        document.querySelectorAll("header, [role='banner'], .header, .navbar")
      ).filter((header) => {
        const styles = window.getComputedStyle(header);
        return (
          styles.position === "fixed" ||
          styles.position === "sticky" ||
          parseInt(styles.zIndex) > 100
        );
      });

      if (headers.length === 0) {
        return { passed: true, headerCount: 0, overlaps: [] };
      }

      // Check if H1 or primary CTA is covered
      const h1 = document.querySelector("h1");
      const ctas = Array.from(
        document.querySelectorAll(
          "button, a[role='button'], .btn, .cta"
        )
      ).slice(0, 3);

      const overlaps = [];

      headers.forEach((header) => {
        const headerRect = header.getBoundingClientRect();

        if (h1) {
          const h1Rect = h1.getBoundingClientRect();
          if (
            h1Rect.top < headerRect.bottom &&
            h1Rect.bottom > headerRect.top
          ) {
            overlaps.push({ type: "H1", element: "h1" });
          }
        }

        ctas.forEach((cta) => {
          const ctaRect = cta.getBoundingClientRect();
          if (
            ctaRect.top < headerRect.bottom &&
            ctaRect.bottom > headerRect.top
          ) {
            overlaps.push({ type: "CTA", element: cta.textContent?.trim() });
          }
        });
      });

      return {
        passed: overlaps.length === 0,
        headerCount: headers.length,
        overlaps: overlaps.slice(0, 3),
      };
    });

    return {
      id: "MOBILE_004",
      category: "mobile",
      title: "Sticky header does not cover H1 or CTA",
      passed: result.passed,
      why: result.passed
        ? result.headerCount === 0
          ? "No sticky headers detected"
          : "Sticky header does not overlap important content"
        : `Sticky header overlaps ${result.overlaps.length} important element(s)`,
      evidence: {
        selectors: ["header", "h1", "button", ".cta"],
        values: {
          headerCount: result.headerCount,
          overlaps: result.overlaps,
        },
      },
      suggestion: result.passed
        ? ""
        : "Adjust sticky header positioning or add padding to prevent overlap with H1 and CTAs",
      impact: "Med",
      effort: "M",
    };
  } catch (error) {
    return {
      id: "MOBILE_004",
      category: "mobile",
      title: "Sticky header overlap check",
      passed: false,
      why: "Error checking sticky header overlap",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Review sticky header positioning",
      impact: "Med",
      effort: "M",
    };
  }
}

async function checkFontSizeReadability(page) {
  try {
    const result = await page.evaluate(() => {
      const body = document.body;
      const bodyStyles = window.getComputedStyle(body);
      const bodyFontSize = parseFloat(bodyStyles.fontSize);

      // Check common text elements
      const textElements = Array.from(
        document.querySelectorAll("p, span, div, li, a")
      ).slice(0, 50);

      const fontSizes = textElements.map((el) => {
        const styles = window.getComputedStyle(el);
        return parseFloat(styles.fontSize) || bodyFontSize;
      });

      const minFontSize = Math.min(...fontSizes, bodyFontSize);
      const avgFontSize =
        fontSizes.reduce((a, b) => a + b, bodyFontSize) /
        (fontSizes.length + 1);

      return {
        passed: minFontSize >= 14,
        minFontSize: Math.round(minFontSize * 10) / 10,
        avgFontSize: Math.round(avgFontSize * 10) / 10,
        bodyFontSize: Math.round(bodyFontSize * 10) / 10,
      };
    });

    return {
      id: "MOBILE_005",
      category: "mobile",
      title: "Font size is readable (≥14px)",
      passed: result.passed,
      why: result.passed
        ? `Minimum font size is ${result.minFontSize}px, which is readable`
        : `Minimum font size is ${result.minFontSize}px, which may be too small for mobile reading`,
      evidence: {
        selectors: ["body", "p", "span"],
        values: {
          minFontSize: result.minFontSize,
          avgFontSize: result.avgFontSize,
          bodyFontSize: result.bodyFontSize,
          minRecommended: 14,
        },
      },
      suggestion: result.passed
        ? ""
        : "Increase font sizes to at least 14px for better mobile readability",
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "MOBILE_005",
      category: "mobile",
      title: "Font size check",
      passed: false,
      why: "Error checking font sizes",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Ensure font sizes are at least 14px",
      impact: "Med",
      effort: "S",
    };
  }
}

async function runMobileRules(page, pageUrl) {
  const rules = [
    checkTapTargetSize,
    checkTapTargetSpacing,
    checkHorizontalOverflow,
    checkStickyHeaderOverlap,
    checkFontSizeReadability,
  ];

  const results = [];
  for (const rule of rules) {
    try {
      const result = await rule(page);
      results.push({ ...result, page: pageUrl });
    } catch (error) {
      results.push({
        id: "MOBILE_ERROR",
        category: "mobile",
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

module.exports = { runMobileRules };

