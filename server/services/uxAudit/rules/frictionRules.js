/**
 * Friction rules - checks for form usability and interaction blockers
 */

async function checkFormInputCount(page) {
  try {
    const result = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll("form")).slice(0, 3);
      if (forms.length === 0) {
        return { passed: true, formCount: 0, maxInputs: 0 };
      }

      const formInputCounts = forms.map((form) => {
        const inputs = Array.from(
          form.querySelectorAll(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
          )
        );
        return inputs.length;
      });

      const maxInputs = Math.max(...formInputCounts);
      return {
        passed: maxInputs <= 6,
        formCount: forms.length,
        maxInputs,
        inputCounts: formInputCounts,
      };
    });

    return {
      id: "FRICTION_001",
      category: "friction",
      title: "Main form has reasonable input count (≤6 on first step)",
      passed: result.passed,
      why: result.passed
        ? result.formCount === 0
          ? "No forms detected"
          : `Largest form has ${result.maxInputs} inputs, which is reasonable`
        : `Largest form has ${result.maxInputs} inputs, which may be overwhelming`,
      evidence: {
        selectors: ["form input", "form textarea", "form select"],
        values: {
          formCount: result.formCount,
          maxInputs: result.maxInputs,
          inputCounts: result.inputCounts,
        },
      },
      suggestion: result.passed
        ? ""
        : "Consider splitting long forms into multiple steps or reducing the number of required fields",
      impact: "Med",
      effort: "M",
    };
  } catch (error) {
    return {
      id: "FRICTION_001",
      category: "friction",
      title: "Form input count check",
      passed: false,
      why: "Error checking form inputs",
      evidence: { selectors: ["form"], values: { error: error.message } },
      suggestion: "Review form length",
      impact: "Med",
      effort: "M",
    };
  }
}

async function checkRequiredFieldsRatio(page) {
  try {
    const result = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll("form")).slice(0, 3);
      if (forms.length === 0) {
        return { passed: true, formCount: 0, requiredRatio: 0 };
      }

      const ratios = forms.map((form) => {
        const allInputs = Array.from(
          form.querySelectorAll(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
          )
        );
        const requiredInputs = Array.from(
          form.querySelectorAll(
            'input[required], textarea[required], select[required], input:not([type="hidden"]):not([type="submit"]):not([type="button"])[aria-required="true"]'
          )
        );

        const ratio =
          allInputs.length > 0 ? requiredInputs.length / allInputs.length : 0;
        return ratio;
      });

      const maxRatio = Math.max(...ratios);
      return {
        passed: maxRatio <= 0.5,
        formCount: forms.length,
        requiredRatio: maxRatio,
        ratios,
      };
    });

    return {
      id: "FRICTION_002",
      category: "friction",
      title: "Required fields ratio is reasonable (≤50%)",
      passed: result.passed,
      why: result.passed
        ? result.formCount === 0
          ? "No forms detected"
          : `Required fields ratio is ${Math.round(
              result.requiredRatio * 100
            )}%, which is acceptable`
        : `Required fields ratio is ${Math.round(
            result.requiredRatio * 100
          )}%, which may create friction`,
      evidence: {
        selectors: ["form input[required]", "form textarea[required]"],
        values: {
          formCount: result.formCount,
          requiredRatio: result.requiredRatio,
          requiredPercentage: Math.round(result.requiredRatio * 100),
        },
      },
      suggestion: result.passed
        ? ""
        : "Reduce the number of required fields or make more fields optional",
      impact: "Med",
      effort: "M",
    };
  } catch (error) {
    return {
      id: "FRICTION_002",
      category: "friction",
      title: "Required fields ratio check",
      passed: false,
      why: "Error checking required fields",
      evidence: { selectors: ["form"], values: { error: error.message } },
      suggestion: "Review required field count",
      impact: "Med",
      effort: "M",
    };
  }
}

async function checkInputLabels(page) {
  try {
    const result = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll("form")).slice(0, 3);
      if (forms.length === 0) {
        return { passed: true, formCount: 0, labeledRatio: 1 };
      }

      const ratios = forms.map((form) => {
        const inputs = Array.from(
          form.querySelectorAll(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
          )
        );

        const labeledInputs = inputs.filter((input) => {
          // Check for associated label
          const id = input.id;
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return true;
          }

          // Check for aria-label
          if (input.hasAttribute("aria-label")) return true;

          // Check for parent label
          const parentLabel = input.closest("label");
          if (parentLabel) return true;

          // Check for placeholder (less ideal but acceptable)
          if (input.placeholder && input.placeholder.length > 0) return true;

          return false;
        });

        return inputs.length > 0 ? labeledInputs.length / inputs.length : 1;
      });

      const minRatio = Math.min(...ratios);
      return {
        passed: minRatio >= 0.9, // 90% should be labeled
        formCount: forms.length,
        labeledRatio: minRatio,
        ratios,
      };
    });

    return {
      id: "FRICTION_003",
      category: "friction",
      title: "Form inputs have labels",
      passed: result.passed,
      why: result.passed
        ? result.formCount === 0
          ? "No forms detected"
          : `At least ${Math.round(
              result.labeledRatio * 100
            )}% of inputs have labels`
        : `Only ${Math.round(
            result.labeledRatio * 100
          )}% of inputs have labels, which hurts accessibility`,
      evidence: {
        selectors: ["form input", "form label"],
        values: {
          formCount: result.formCount,
          labeledRatio: result.labeledRatio,
          labeledPercentage: Math.round(result.labeledRatio * 100),
        },
      },
      suggestion: result.passed
        ? ""
        : "Add label elements or aria-label attributes to all form inputs",
      impact: "High",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "FRICTION_003",
      category: "friction",
      title: "Input labels check",
      passed: false,
      why: "Error checking input labels",
      evidence: { selectors: ["form"], values: { error: error.message } },
      suggestion: "Add labels to form inputs",
      impact: "High",
      effort: "S",
    };
  }
}

async function checkAutocomplete(page) {
  try {
    const result = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll("form")).slice(0, 3);
      if (forms.length === 0) {
        return { passed: true, formCount: 0, autocompleteRatio: 1 };
      }

      const autocompleteFields = [
        "email",
        "name",
        "given-name",
        "family-name",
        "address-line1",
        "address-line2",
        "city",
        "postal-code",
        "country",
        "tel",
      ];

      const ratios = forms.map((form) => {
        const inputs = Array.from(
          form.querySelectorAll(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea'
          )
        );

        const inputsWithAutocomplete = inputs.filter((input) => {
          const autocomplete = input.getAttribute("autocomplete");
          if (!autocomplete) return false;

          const type = input.type?.toLowerCase();
          const name = input.name?.toLowerCase() || "";

          // Check if autocomplete matches common fields
          return (
            autocompleteFields.some((field) =>
              autocomplete.toLowerCase().includes(field)
            ) ||
            (type === "email" && autocomplete) ||
            (name.includes("email") && autocomplete) ||
            (name.includes("name") && autocomplete)
          );
        });

        return inputs.length > 0
          ? inputsWithAutocomplete.length / inputs.length
          : 1;
      });

      const minRatio = Math.min(...ratios);
      return {
        passed: minRatio >= 0.5, // At least 50% should have autocomplete for common fields
        formCount: forms.length,
        autocompleteRatio: minRatio,
        ratios,
      };
    });

    return {
      id: "FRICTION_004",
      category: "friction",
      title: "Common form fields have autocomplete",
      passed: result.passed,
      why: result.passed
        ? result.formCount === 0
          ? "No forms detected"
          : `At least ${Math.round(
              result.autocompleteRatio * 100
            )}% of common fields have autocomplete`
        : `Only ${Math.round(
            result.autocompleteRatio * 100
          )}% of common fields have autocomplete attributes`,
      evidence: {
        selectors: ["form input[autocomplete]"],
        values: {
          formCount: result.formCount,
          autocompleteRatio: result.autocompleteRatio,
          autocompletePercentage: Math.round(result.autocompleteRatio * 100),
        },
      },
      suggestion: result.passed
        ? ""
        : "Add autocomplete attributes to common fields like email, name, and address",
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "FRICTION_004",
      category: "friction",
      title: "Autocomplete check",
      passed: false,
      why: "Error checking autocomplete",
      evidence: { selectors: ["form"], values: { error: error.message } },
      suggestion: "Add autocomplete to form fields",
      impact: "Med",
      effort: "S",
    };
  }
}

async function checkCookieBannerBlocking(page) {
  try {
    const result = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportArea = viewportWidth * viewportHeight;

      // Look for fixed/absolute positioned overlays
      const allElements = Array.from(document.querySelectorAll("*"));
      const overlays = allElements.filter((el) => {
        const styles = window.getComputedStyle(el);
        const position = styles.position;
        const zIndex = parseInt(styles.zIndex) || 0;

        if (position !== "fixed" && position !== "absolute") return false;
        if (zIndex < 100) return false; // Likely not an overlay

        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;
        const coverage = area / viewportArea;

        // Check if it covers significant portion and is near top
        return coverage > 0.25 && rect.top < viewportHeight * 0.5;
      });

      // Check if overlay blocks interaction
      const blockingOverlays = overlays.filter((overlay) => {
        const styles = window.getComputedStyle(overlay);
        const pointerEvents = styles.pointerEvents;
        const rect = overlay.getBoundingClientRect();

        // Check if it's likely a cookie banner (has cookie/privacy keywords)
        const text = overlay.textContent?.toLowerCase() || "";
        const hasCookieKeywords =
          text.includes("cookie") ||
          text.includes("privacy") ||
          text.includes("accept") ||
          text.includes("consent");

        return (
          hasCookieKeywords &&
          pointerEvents !== "none" &&
          rect.width >= viewportWidth * 0.5
        );
      });

      return {
        passed: blockingOverlays.length === 0,
        overlayCount: overlays.length,
        blockingCount: blockingOverlays.length,
      };
    });

    return {
      id: "FRICTION_005",
      category: "friction",
      title: "Cookie banner does not block interaction on load",
      passed: result.passed,
      why: result.passed
        ? "No blocking cookie banners detected"
        : `Found ${result.blockingCount} cookie banner(s) that may block interaction`,
      evidence: {
        selectors: ["*"],
        values: {
          overlayCount: result.overlayCount,
          blockingOverlays: result.blockingCount,
        },
      },
      suggestion: result.passed
        ? ""
        : "Ensure cookie banners don't block page interaction on initial load, or auto-dismiss after a few seconds",
      impact: "Med",
      effort: "M",
    };
  } catch (error) {
    return {
      id: "FRICTION_005",
      category: "friction",
      title: "Cookie banner check",
      passed: false,
      why: "Error checking cookie banners",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Review cookie banner implementation",
      impact: "Med",
      effort: "M",
    };
  }
}

async function runFrictionRules(page, pageUrl) {
  const rules = [
    checkFormInputCount,
    checkRequiredFieldsRatio,
    checkInputLabels,
    checkAutocomplete,
    checkCookieBannerBlocking,
  ];

  const results = [];
  for (const rule of rules) {
    try {
      const result = await rule(page);
      results.push({ ...result, page: pageUrl });
    } catch (error) {
      results.push({
        id: "FRICTION_ERROR",
        category: "friction",
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

module.exports = { runFrictionRules };

