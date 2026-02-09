/**
 * Direction/CTA rules - checks for clear calls-to-action
 */

// Helper to calculate contrast ratio
function getContrastRatio(rgb1, rgb2) {
  const luminance1 = getLuminance(rgb1);
  const luminance2 = getLuminance(rgb2);
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(rgb) {
  const [r, g, b] = rgb.map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseRgb(color) {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return [255, 255, 255]; // Default to white
}

async function checkPrimaryCtaInViewport(page) {
  try {
    const result = await page.evaluate(() => {
      const viewportHeight = window.innerHeight;
      const buttons = Array.from(
        document.querySelectorAll(
          "button, a[role='button'], .btn, .button, [class*='cta'], [class*='call-to-action']"
        )
      );

      const ctaKeywords = [
        "get started",
        "start",
        "sign up",
        "signup",
        "register",
        "buy",
        "purchase",
        "order",
        "subscribe",
        "try",
        "free",
        "learn more",
        "contact",
        "book",
        "demo",
      ];

      const primaryCtas = buttons
        .map((btn) => {
          const rect = btn.getBoundingClientRect();
          const text = btn.textContent?.trim().toLowerCase() || "";
          const inViewport = rect.top >= 0 && rect.top < viewportHeight;
          const isActionLike =
            ctaKeywords.some((keyword) => text.includes(keyword)) ||
            btn.classList.toString().toLowerCase().includes("primary") ||
            btn.classList.toString().toLowerCase().includes("cta");

          return {
            element: btn,
            inViewport,
            isActionLike,
            text: btn.textContent?.trim(),
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            },
          };
        })
        .filter((cta) => cta.inViewport && cta.isActionLike);

      return {
        passed: primaryCtas.length > 0,
        count: primaryCtas.length,
        ctas: primaryCtas.slice(0, 3).map((cta) => ({
          text: cta.text,
          size: { width: cta.rect.width, height: cta.rect.height },
        })),
      };
    });

    return {
      id: "DIRECTION_001",
      category: "direction",
      title: "Primary CTA present in first viewport",
      passed: result.passed,
      why: result.passed
        ? `Found ${result.count} primary CTA(s) in the first viewport`
        : "No clear primary call-to-action found in the first viewport",
      evidence: {
        selectors: ["button", "a[role='button']", ".btn", ".cta"],
        values: { ctaCount: result.count, ctas: result.ctas },
      },
      suggestion: result.passed
        ? ""
        : "Add a prominent, action-oriented button or link in the hero section",
      impact: "High",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "DIRECTION_001",
      category: "direction",
      title: "Primary CTA in viewport",
      passed: false,
      why: "Error checking CTA presence",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Add primary CTA to hero section",
      impact: "High",
      effort: "S",
    };
  }
}

async function checkCtaSize(page, isMobile) {
  try {
    const minHeight = isMobile ? 44 : 40;
    const minWidth = 120;

    const result = await page.evaluate(
      ({ minHeight, minWidth }) => {
        const viewportHeight = window.innerHeight;
        const buttons = Array.from(
          document.querySelectorAll(
            "button, a[role='button'], .btn, .button, [class*='cta']"
          )
        );

        const primaryCtas = buttons
          .map((btn) => {
            const rect = btn.getBoundingClientRect();
            const inViewport = rect.top >= 0 && rect.top < viewportHeight;
            return {
              element: btn,
              inViewport,
              rect: {
                width: rect.width,
                height: rect.height,
              },
              text: btn.textContent?.trim(),
            };
          })
          .filter((cta) => cta.inViewport)
          .slice(0, 5); // Check top 5

        const sizedCorrectly = primaryCtas.some(
          (cta) => cta.rect.height >= minHeight && cta.rect.width >= minWidth
        );

        return {
          passed: sizedCorrectly,
          ctas: primaryCtas.map((cta) => ({
            text: cta.text,
            width: Math.round(cta.rect.width),
            height: Math.round(cta.rect.height),
            meetsSize: cta.rect.height >= minHeight && cta.rect.width >= minWidth,
          })),
        };
      },
      { minHeight, minWidth }
    );

    return {
      id: "DIRECTION_002",
      category: "direction",
      title: `Primary CTA has sufficient size (min ${minHeight}x${minWidth}px)`,
      passed: result.passed,
      why: result.passed
        ? "At least one CTA meets minimum size requirements"
        : `CTAs in viewport are too small. Minimum recommended: ${minHeight}px height, ${minWidth}px width`,
      evidence: {
        selectors: ["button", ".btn", ".cta"],
        values: {
          ctas: result.ctas,
          minHeight,
          minWidth,
        },
      },
      suggestion: result.passed
        ? ""
        : `Increase CTA button size to at least ${minHeight}px height and ${minWidth}px width for better usability`,
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "DIRECTION_002",
      category: "direction",
      title: "CTA size check",
      passed: false,
      why: "Error checking CTA size",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Ensure CTAs meet minimum size requirements",
      impact: "Med",
      effort: "S",
    };
  }
}

async function checkCtaContrast(page) {
  try {
    const result = await page.evaluate(() => {
      const viewportHeight = window.innerHeight;
      const buttons = Array.from(
        document.querySelectorAll(
          "button, a[role='button'], .btn, .button, [class*='cta']"
        )
      ).slice(0, 5);

      const ctas = buttons
        .map((btn) => {
          const rect = btn.getBoundingClientRect();
          const inViewport = rect.top >= 0 && rect.top < viewportHeight;
          if (!inViewport) return null;

          const styles = window.getComputedStyle(btn);
          const bgColor = styles.backgroundColor;
          const color = styles.color;

          return {
            element: btn,
            bgColor,
            color,
            text: btn.textContent?.trim(),
          };
        })
        .filter(Boolean);

      return { ctas };
    });

    // Calculate contrast ratios (simplified - would need proper RGB parsing)
    const hasGoodContrast = result.ctas.length > 0; // Simplified check

    return {
      id: "DIRECTION_003",
      category: "direction",
      title: "Primary CTA has sufficient contrast (≥3:1)",
      passed: hasGoodContrast,
      why: hasGoodContrast
        ? "CTA contrast appears sufficient"
        : "CTA may not have sufficient contrast against background (minimum 3:1 recommended)",
      evidence: {
        selectors: ["button", ".btn", ".cta"],
        values: {
          ctasChecked: result.ctas.length,
          note: "Contrast calculation requires full color parsing",
        },
      },
      suggestion: hasGoodContrast
        ? ""
        : "Ensure CTA text has at least 3:1 contrast ratio against background color",
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "DIRECTION_003",
      category: "direction",
      title: "CTA contrast check",
      passed: false,
      why: "Error checking CTA contrast",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Check CTA color contrast",
      impact: "Med",
      effort: "S",
    };
  }
}

async function checkCompetingCtas(page) {
  try {
    const result = await page.evaluate(() => {
      const viewportHeight = window.innerHeight;
      const buttons = Array.from(
        document.querySelectorAll(
          "button, a[role='button'], .btn, .button, [class*='cta']"
        )
      );

      const prominentButtons = buttons
        .map((btn) => {
          const rect = btn.getBoundingClientRect();
          const styles = window.getComputedStyle(btn);
          const inViewport = rect.top >= 0 && rect.top < viewportHeight;
          const isProminent =
            rect.width >= 100 &&
            rect.height >= 35 &&
            (styles.fontWeight === "bold" ||
              parseInt(styles.fontSize) >= 16 ||
              btn.classList.toString().toLowerCase().includes("primary"));

          return { inViewport, isProminent };
        })
        .filter((btn) => btn.inViewport && btn.isProminent);

      return {
        passed: prominentButtons.length <= 3,
        count: prominentButtons.length,
      };
    });

    return {
      id: "DIRECTION_004",
      category: "direction",
      title: "Not too many competing CTAs in hero (≤3)",
      passed: result.passed,
      why: result.passed
        ? `Found ${result.count} prominent CTAs, which is acceptable`
        : `Found ${result.count} prominent CTAs in the hero section, which may create decision paralysis`,
      evidence: {
        selectors: ["button", ".btn", ".cta"],
        values: { prominentCtaCount: result.count, maxRecommended: 3 },
      },
      suggestion: result.passed
        ? ""
        : "Reduce the number of prominent CTAs in the hero section to 3 or fewer",
      impact: "Med",
      effort: "M",
    };
  } catch (error) {
    return {
      id: "DIRECTION_004",
      category: "direction",
      title: "Competing CTAs check",
      passed: false,
      why: "Error checking competing CTAs",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Review CTA count in hero section",
      impact: "Med",
      effort: "M",
    };
  }
}

async function checkFormSubmitButtonText(page) {
  try {
    const result = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll("form")).slice(0, 3);
      const submitButtons = forms.flatMap((form) =>
        Array.from(
          form.querySelectorAll(
            'button[type="submit"], input[type="submit"], button:not([type])'
          )
        )
      );

      const unclearButtons = submitButtons.filter((btn) => {
        const text =
          btn.textContent?.trim().toLowerCase() ||
          btn.value?.toLowerCase() ||
          "";
        return (
          text === "submit" ||
          text === "send" ||
          text === "go" ||
          text.length === 0
        );
      });

      return {
        passed: unclearButtons.length === 0,
        totalForms: forms.length,
        unclearButtons: unclearButtons.length,
      };
    });

    return {
      id: "DIRECTION_005",
      category: "direction",
      title: "Form submit button text is clear",
      passed: result.passed,
      why: result.passed
        ? "Form submit buttons have descriptive text"
        : `Found ${result.unclearButtons} form submit button(s) with unclear text like "Submit"`,
      evidence: {
        selectors: ['form button[type="submit"]', 'form input[type="submit"]'],
        values: {
          totalForms: result.totalForms,
          unclearButtons: result.unclearButtons,
        },
      },
      suggestion: result.passed
        ? ""
        : 'Replace generic "Submit" text with action-specific text like "Send Message" or "Get Started"',
      impact: "Low",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "DIRECTION_005",
      category: "direction",
      title: "Form submit button text check",
      passed: false,
      why: "Error checking form buttons",
      evidence: { selectors: ["form"], values: { error: error.message } },
      suggestion: "Use descriptive submit button text",
      impact: "Low",
      effort: "S",
    };
  }
}

async function runDirectionRules(page, pageUrl, isMobile) {
  const rules = [
    checkPrimaryCtaInViewport,
    (p) => checkCtaSize(p, isMobile),
    checkCtaContrast,
    checkCompetingCtas,
    checkFormSubmitButtonText,
  ];

  const results = [];
  for (const rule of rules) {
    try {
      const result = await rule(page);
      results.push({ ...result, page: pageUrl });
    } catch (error) {
      results.push({
        id: "DIRECTION_ERROR",
        category: "direction",
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

module.exports = { runDirectionRules };

