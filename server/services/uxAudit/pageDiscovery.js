const { chromium } = require("playwright");

/**
 * Discovers pages to scan: home, pricing (if found), contact (if found)
 * @param {string} baseUrl - The base URL to start from
 * @returns {Promise<{home: string, pricing?: string, contact?: string}>}
 */
async function discoverPages(baseUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  try {
    const pages = { home: baseUrl };
    const page = await context.newPage();

    // Load home page - use domcontentloaded for faster, more reliable loading
    // Some sites have continuous network activity that prevents networkidle
    try {
      await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20000
      });
      // Give a small delay for JS to execute and links to be rendered
      await page.waitForTimeout(2000);
    } catch (error) {
      // Fallback: try with load event if domcontentloaded fails
      try {
        await page.goto(baseUrl, {
          waitUntil: "load",
          timeout: 20000
        });
      } catch (fallbackError) {
        console.warn(`Failed to load ${baseUrl}, continuing with partial data:`, fallbackError.message);
        // Continue anyway - we'll get what we can from the partial load
      }
    }

    // Collect internal links from nav and footer
    const links = await page.evaluate(() => {
      const navLinks = Array.from(
        document.querySelectorAll("nav a, header a, [role='navigation'] a")
      );
      const footerLinks = Array.from(
        document.querySelectorAll("footer a, [role='contentinfo'] a")
      );
      const allLinks = [...navLinks, ...footerLinks];

      return allLinks
        .map((link) => ({
          href: link.href,
          text: link.textContent?.trim().toLowerCase() || "",
        }))
        .filter((link) => link.href);
    });

    // Score links for pricing/plans
    const pricingCandidates = links
      .filter((link) => {
        const href = link.href.toLowerCase();
        const text = link.text;
        return (
          /pricing|plans|prices|cost|purchase|buy|subscribe/i.test(href) ||
          /pricing|plans|prices/i.test(text)
        );
      })
      .map((link) => ({
        url: link.href,
        score:
          (link.href.toLowerCase().includes("pricing") ? 10 : 0) +
          (link.href.toLowerCase().includes("plan") ? 8 : 0) +
          (link.text.includes("pricing") ? 5 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    // Score links for contact/signup
    const contactCandidates = links
      .filter((link) => {
        const href = link.href.toLowerCase();
        const text = link.text;
        return (
          /contact|signup|register|book|demo|get.*started|trial/i.test(href) ||
          /contact|sign.*up|register|book|demo/i.test(text)
        );
      })
      .map((link) => ({
        url: link.href,
        score:
          (link.href.toLowerCase().includes("contact") ? 10 : 0) +
          (link.href.toLowerCase().includes("signup") ||
          link.href.toLowerCase().includes("register")
            ? 8
            : 0) +
          (link.text.includes("contact") ? 5 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    // Filter to same-origin only
    const baseOrigin = new URL(baseUrl).origin;

    const isSameOrigin = (url) => {
      try {
        return new URL(url).origin === baseOrigin;
      } catch {
        return false;
      }
    };

    // Pick best pricing page
    if (pricingCandidates.length > 0) {
      const bestPricing = pricingCandidates.find((c) =>
        isSameOrigin(c.url)
      );
      if (bestPricing) {
        pages.pricing = bestPricing.url;
      }
    }

    // Pick best contact page
    if (contactCandidates.length > 0) {
      const bestContact = contactCandidates.find((c) => isSameOrigin(c.url));
      if (bestContact) {
        pages.contact = bestContact.url;
      }
    }

    return pages;
  } finally {
    await browser.close();
  }
}

module.exports = { discoverPages };

