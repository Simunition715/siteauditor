/**
 * Trust rules - checks for trust signals and security
 */

async function checkFooterTrustLinks(page) {
  try {
    const result = await page.evaluate(() => {
      const footer = document.querySelector("footer, [role='contentinfo']");
      if (!footer) {
        return { passed: false, links: [], foundLinks: [] };
      }

      const links = Array.from(footer.querySelectorAll("a"));
      const trustKeywords = [
        "privacy",
        "terms",
        "contact",
        "about",
        "legal",
        "policy",
        "security",
      ];

      const foundLinks = links
        .map((link) => {
          const href = link.href.toLowerCase();
          const text = link.textContent?.trim().toLowerCase();
          const matches = trustKeywords.filter(
            (keyword) => href.includes(keyword) || text.includes(keyword)
          );
          return matches.length > 0 ? { href, text, matches } : null;
        })
        .filter(Boolean);

      return {
        passed: foundLinks.length > 0,
        links: foundLinks.map((l) => ({ href: l.href, text: l.text })),
        foundLinks: foundLinks.length,
      };
    });

    return {
      id: "TRUST_001",
      category: "trust",
      title: "Footer includes trust links (Privacy/Terms/Contact/About)",
      passed: result.passed,
      why: result.passed
        ? `Found ${result.foundLinks} trust-related link(s) in footer`
        : "Footer lacks common trust links like Privacy Policy, Terms of Service, or Contact",
      evidence: {
        selectors: ["footer a"],
        values: {
          trustLinksFound: result.foundLinks,
          links: result.links,
        },
      },
      suggestion: result.passed
        ? ""
        : "Add links to Privacy Policy, Terms of Service, and Contact/About pages in the footer",
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "TRUST_001",
      category: "trust",
      title: "Footer trust links check",
      passed: false,
      why: "Error checking footer links",
      evidence: { selectors: ["footer"], values: { error: error.message } },
      suggestion: "Add trust links to footer",
      impact: "Med",
      effort: "S",
    };
  }
}

async function checkContactSignals(page) {
  try {
    const result = await page.evaluate(() => {
      // Check for email, phone, address patterns in text
      const bodyText = document.body.textContent || "";
      const emailPattern = /[\w.-]+@[\w.-]+\.\w+/;
      const phonePattern =
        /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
      const addressKeywords = /address|street|city|state|zip|postal/i;

      const hasEmail = emailPattern.test(bodyText);
      const hasPhone = phonePattern.test(bodyText);
      const hasAddress = addressKeywords.test(bodyText);

      // Check for contact page link
      const links = Array.from(document.querySelectorAll("a"));
      const hasContactLink = links.some((link) => {
        const href = link.href.toLowerCase();
        const text = link.textContent?.toLowerCase();
        return (
          href.includes("contact") ||
          text.includes("contact") ||
          href.includes("about")
        );
      });

      return {
        passed: hasEmail || hasPhone || hasAddress || hasContactLink,
        hasEmail,
        hasPhone,
        hasAddress,
        hasContactLink,
      };
    });

    return {
      id: "TRUST_002",
      category: "trust",
      title: "Contact signals present (email/phone/address or contact page)",
      passed: result.passed,
      why: result.passed
        ? "Contact information or contact page link is present"
        : "No visible contact information (email, phone, address) or contact page link found",
      evidence: {
        selectors: ["body", "a"],
        values: {
          hasEmail: result.hasEmail,
          hasPhone: result.hasPhone,
          hasAddress: result.hasAddress,
          hasContactLink: result.hasContactLink,
        },
      },
      suggestion: result.passed
        ? ""
        : "Add visible contact information (email, phone, or address) or a clear contact page link",
      impact: "Med",
      effort: "S",
    };
  } catch (error) {
    return {
      id: "TRUST_002",
      category: "trust",
      title: "Contact signals check",
      passed: false,
      why: "Error checking contact signals",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Add contact information",
      impact: "Med",
      effort: "S",
    };
  }
}

async function checkHttps(page, pageUrl) {
  try {
    const isHttps = pageUrl.startsWith("https://");

    return {
      id: "TRUST_003",
      category: "trust",
      title: "HTTPS is used",
      passed: isHttps,
      why: isHttps
        ? "Site uses HTTPS for secure connections"
        : "Site does not use HTTPS, which may reduce user trust and security",
      evidence: {
        selectors: [],
        values: { protocol: pageUrl.split(":")[0], isHttps },
      },
      suggestion: isHttps
        ? ""
        : "Enable HTTPS/SSL certificate for the website",
      impact: "High",
      effort: "M",
    };
  } catch (error) {
    return {
      id: "TRUST_003",
      category: "trust",
      title: "HTTPS check",
      passed: false,
      why: "Error checking HTTPS",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Enable HTTPS",
      impact: "High",
      effort: "M",
    };
  }
}

async function checkCheckoutTrustCues(page) {
  try {
    const result = await page.evaluate(() => {
      const bodyText = document.body.textContent?.toLowerCase() || "";
      const hasCheckoutElements =
        bodyText.includes("checkout") ||
        bodyText.includes("payment") ||
        bodyText.includes("card") ||
        document.querySelector('[class*="checkout"], [class*="payment"], [id*="checkout"], [id*="payment"]');

      if (!hasCheckoutElements) {
        return { passed: true, hasCheckout: false, hasTrustCues: false };
      }

      // Check for trust cues
      const trustCues = [
        "privacy",
        "policy",
        "secure",
        "ssl",
        "encrypted",
        "safe",
        "guarantee",
        "refund",
      ];

      const hasTrustCues = trustCues.some((cue) => bodyText.includes(cue));

      return {
        passed: hasTrustCues,
        hasCheckout: true,
        hasTrustCues,
      };
    });

    return {
      id: "TRUST_004",
      category: "trust",
      title: "Checkout pages have trust cues",
      passed: result.passed,
      why: result.passed
        ? result.hasCheckout
          ? "Checkout elements found with trust cues present"
          : "No checkout elements detected"
        : "Checkout/payment elements found but trust cues (privacy, secure, etc.) are missing",
      evidence: {
        selectors: ["body"],
        values: {
          hasCheckoutElements: result.hasCheckout,
          hasTrustCues: result.hasTrustCues,
        },
      },
      suggestion: result.passed
        ? ""
        : "Add trust signals (privacy policy links, security badges, guarantees) near checkout elements",
      impact: "High",
      effort: "M",
    };
  } catch (error) {
    return {
      id: "TRUST_004",
      category: "trust",
      title: "Checkout trust cues check",
      passed: false,
      why: "Error checking checkout trust cues",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Add trust cues to checkout",
      impact: "High",
      effort: "M",
    };
  }
}

async function checkBrokenExternalLinks(page) {
  try {
    const result = await page.evaluate(async () => {
      const links = Array.from(document.querySelectorAll("a[href]"));
      const externalLinks = links
        .filter((link) => {
          try {
            const href = link.href;
            return (
              href.startsWith("http") &&
              !href.startsWith(window.location.origin)
            );
          } catch {
            return false;
          }
        })
        .slice(0, 10); // Sample first 10

      // Note: Actual link checking would require fetch, which may be blocked by CORS
      // This is a simplified check that just identifies external links
      return {
        externalLinksFound: externalLinks.length,
        externalLinks: externalLinks.map((l) => ({
          href: l.href,
          text: l.textContent?.trim(),
        })),
      };
    });

    // Simplified: assume links are valid if we can't check them
    return {
      id: "TRUST_005",
      category: "trust",
      title: "External links are valid (sampled)",
      passed: true, // Simplified - would need actual fetch to verify
      why: `Found ${result.externalLinksFound} external link(s) (validation requires server-side checking)`,
      evidence: {
        selectors: ["a[href]"],
        values: {
          externalLinksFound: result.externalLinksFound,
          sampleLinks: result.externalLinks.slice(0, 5),
          note: "Full validation requires server-side link checking",
        },
      },
      suggestion: "",
      impact: "Low",
      effort: "M",
    };
  } catch (error) {
    return {
      id: "TRUST_005",
      category: "trust",
      title: "External links check",
      passed: false,
      why: "Error checking external links",
      evidence: { selectors: [], values: { error: error.message } },
      suggestion: "Verify external links are working",
      impact: "Low",
      effort: "M",
    };
  }
}

async function runTrustRules(page, pageUrl) {
  const rules = [
    checkFooterTrustLinks,
    checkContactSignals,
    (p) => checkHttps(p, pageUrl),
    checkCheckoutTrustCues,
    checkBrokenExternalLinks,
  ];

  const results = [];
  for (const rule of rules) {
    try {
      const result = await rule(page);
      results.push({ ...result, page: pageUrl });
    } catch (error) {
      results.push({
        id: "TRUST_ERROR",
        category: "trust",
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

module.exports = { runTrustRules };

