const axios = require("axios");
const cheerio = require("cheerio");

// Import lighthouse - Lighthouse v11+ exports as an object with a default function
const lighthouseModule = require("lighthouse");
const lighthouse = lighthouseModule.default || lighthouseModule;

// Validate that lighthouse is a function
if (typeof lighthouse !== "function") {
  console.error(
    "Lighthouse import error. Module structure:",
    Object.keys(lighthouseModule)
  );
  throw new Error(
    "Lighthouse is not a function. Please check your lighthouse installation."
  );
}
const {
  updateJobProgress,
  updateJobResult,
  updateJobError,
} = require("./jobService");
const { calculateScores } = require("./scoringService");

async function auditWebsite(url, jobId, jobs) {
  try {
    updateJobProgress(jobs, jobId, 10);

    // Step 1: Run Lighthouse
    const lighthouseResults = await runLighthouse(url, jobId, jobs);
    updateJobProgress(jobs, jobId, 50);

    // Step 2: Run custom HTML checks
    const htmlChecks = await runHtmlChecks(url, jobId, jobs, lighthouseResults);
    updateJobProgress(jobs, jobId, 80);

    // Step 3: Calculate scores
    const scores = calculateScores(lighthouseResults, htmlChecks);
    updateJobProgress(jobs, jobId, 90);

    // Step 4: Generate report data
    const report = generateReport(url, lighthouseResults, htmlChecks, scores);
    updateJobProgress(jobs, jobId, 100);

    updateJobResult(jobs, jobId, report);
  } catch (error) {
    console.error("Audit error:", error);
    updateJobError(jobs, jobId, error.message);
  }
}

async function runLighthouse(url, jobId, jobs) {
  const chromeLauncher = await import("chrome-launcher");
  const launcher = chromeLauncher.default || chromeLauncher;
  const chrome = await launcher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const options = {
      logLevel: "info",
      output: "json",
      onlyCategories: ["performance", "accessibility", "seo", "best-practices"],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);
    const lhr = runnerResult.lhr;

    // Extract comprehensive metrics from Lighthouse (no optional chaining for Node < 14)
    const audits = lhr.audits || {};
    const nav = (obj, ...keys) => {
      let v = obj;
      for (const k of keys) v = v && v[k];
      return v;
    };
    const metrics = {
      performance: {
        score: Math.round((lhr.categories && lhr.categories.performance && lhr.categories.performance.score) * 100),
        lcp: nav(audits, "largest-contentful-paint", "numericValue") || 0,
        cls: nav(audits, "cumulative-layout-shift", "numericValue") || 0,
        inp: nav(audits, "interactive", "numericValue") || 0,
        fcp: nav(audits, "first-contentful-paint", "numericValue") || 0,
        totalBlockingTime: nav(audits, "total-blocking-time", "numericValue") || 0,
        speedIndex: nav(audits, "speed-index", "numericValue") || 0,
        ttfb: nav(audits, "server-response-time", "numericValue") || 0,
        renderBlockingResources: nav(audits, "render-blocking-resources", "details", "items", "length") || 0,
        unusedCSS: nav(audits, "unused-css-rules", "details", "overallSavingsBytes") || 0,
        unusedJS: nav(audits, "unused-javascript", "details", "overallSavingsBytes") || 0,
        imageSizing: nav(audits, "uses-optimized-images", "details", "items", "length") || 0,
        modernImageFormats: nav(audits, "uses-webp-images", "details", "items", "length") || 0,
        fontDisplay: nav(audits, "font-display", "details", "items", "length") || 0,
        lazyLoadableImages: nav(audits, "offscreen-images", "details", "items", "length") || 0,
      },
      seo: {
        score: Math.round((lhr.categories && lhr.categories.seo && lhr.categories.seo.score) * 100),
        audits: lhr.audits,
      },
      accessibility: {
        score: Math.round((lhr.categories && lhr.categories.accessibility && lhr.categories.accessibility.score) * 100),
        audits: lhr.audits,
        colorContrast: nav(audits, "color-contrast", "details", "items", "length") || 0,
        altText: nav(audits, "image-alt", "details", "items", "length") || 0,
        formLabels: nav(audits, "label", "details", "items", "length") || 0,
        ariaAttributes: nav(audits, "aria-valid-attr", "details", "items", "length") || 0,
        keyboardNavigation: nav(audits, "keyboard-navigable", "details", "items", "length") || 0,
        focusIndicators: nav(audits, "focus-traps", "details", "items", "length") || 0,
        headingStructure: nav(audits, "heading-order", "details", "items", "length") || 0,
        landmarks: nav(audits, "landmark-one-main", "score") === 1,
        skipLinks: nav(audits, "skip-link", "score") === 1,
      },
      bestPractices: {
        score: Math.round(nav(lhr.categories, "best-practices", "score") * 100 || 0),
        https: nav(audits, "is-on-https", "score") === 1,
        mixedContent: nav(audits, "mixed-content", "details", "items", "length") || 0,
        securityHeaders: {
          csp: nav(audits, "csp-xss", "score") === 1,
          hsts: false,
          xFrameOptions: false,
          xContentTypeOptions: false,
        },
        consoleErrors: nav(audits, "errors-in-console", "details", "items", "length") || 0,
        documentWrite: nav(audits, "no-document-write", "score") === 1,
        http2: nav(audits, "uses-http2", "score") === 1,
        cacheHeaders: nav(audits, "uses-long-cache-ttl", "details", "items", "length") || 0,
        compression: nav(audits, "uses-text-compression", "details", "items", "length") || 0,
      },
      audits: lhr.audits,
      pageWeight: nav(audits, "total-byte-weight", "numericValue") || 0,
      requests: nav(audits, "network-requests", "details", "items", "length") || 0,
      geolocationPermission: nav(audits, "geolocation-on-start", "score") === 1 ? false : true,
    };

    return metrics;
  } finally {
    await chrome.kill();
  }
}

async function runHtmlChecks(url, jobId, jobs, lighthouseResults = {}) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.data) {
      throw new Error("No data received from URL");
    }

    const $ = cheerio.load(response.data);
    const html = response.data;
    const baseUrl = new URL(url);
    const responseHeaders = response.headers;
    const responseStatus = response.status;

    // Ensure $ is available (safety check)
    if (typeof $ !== "function") {
      throw new Error("Failed to initialize Cheerio");
    }

    // Pre-calculate values that use $ in callbacks to avoid scope issues
    // Store $ in a const to ensure it's captured in closures
    const cheerioInstance = $;

    const h1Content = cheerioInstance("h1")
      .map((i, el) => cheerioInstance(el).text().trim())
      .get();

    const smallButtons = cheerioInstance("button, a").filter((i, el) => {
      const text = cheerioInstance(el).text().trim();
      return text.length > 0 && text.length < 3;
    }).length;

    const smallFonts = cheerioInstance("*").filter((i, el) => {
      const fontSize = cheerioInstance(el).css("font-size");
      return fontSize && parseFloat(fontSize) < 12;
    }).length;

    const hreflangTags = cheerioInstance('link[rel="alternate"][hreflang]')
      .map((i, el) => ({
        lang: cheerioInstance(el).attr("hreflang"),
        href: cheerioInstance(el).attr("href"),
      }))
      .get();

    const checks = {
      // SEO Checks
      title: {
        exists: cheerioInstance("title").length > 0,
        content: cheerioInstance("title").text().trim(),
        length: cheerioInstance("title").text().trim().length,
        optimal:
          cheerioInstance("title").text().trim().length >= 30 &&
          cheerioInstance("title").text().trim().length <= 60,
      },
      metaDescription: {
        exists: cheerioInstance('meta[name="description"]').length > 0,
        content:
          cheerioInstance('meta[name="description"]').attr("content") || "",
        length: (
          cheerioInstance('meta[name="description"]').attr("content") || ""
        ).length,
        optimal:
          (cheerioInstance('meta[name="description"]').attr("content") || "")
            .length >= 120 &&
          (cheerioInstance('meta[name="description"]').attr("content") || "")
            .length <= 160,
      },
      h1: {
        count: cheerioInstance("h1").length,
        hasOne: cheerioInstance("h1").length === 1,
        content: h1Content,
      },
      robots: {
        hasNoindex:
          (cheerioInstance('meta[name="robots"]').attr("content") || "").includes("noindex") || false,
        hasNofollow:
          (cheerioInstance('meta[name="robots"]').attr("content") || "").includes("nofollow") || false,
      },
      canonical: {
        exists: cheerioInstance('link[rel="canonical"]').length > 0,
        url: cheerioInstance('link[rel="canonical"]').attr("href") || "",
      },
      sitemap: null, // Will check separately
      robotsTxt: null, // Will check separately
      internalLinking: {
        // Calculate internal linking depth (heuristic)
        internalLinks: 0, // Will calculate below
        maxDepth: 0, // Will calculate below
      },
      headingHierarchy: {
        // Check heading order (H1 should come before H2, etc.)
        isValid: true, // Will validate
        issues: [],
      },

      // Accessibility Checks
      images: {
        total: cheerioInstance("img").length,
        missingAlt: cheerioInstance("img:not([alt])").length,
        emptyAlt: cheerioInstance('img[alt=""]').length,
        withAlt: cheerioInstance("img[alt]").not('[alt=""]').length,
      },
      accessibleErrorMessages: {
        // Check for accessible error message patterns
        hasAriaLive: cheerioInstance("[aria-live]").length > 0,
        hasRoleAlert: cheerioInstance("[role='alert']").length > 0,
      },

      // Trust & Conversion Checks
      ssl: url.startsWith("https://"),
      viewport: {
        exists: cheerioInstance('meta[name="viewport"]').length > 0,
        content: cheerioInstance('meta[name="viewport"]').attr("content") || "",
      },
      contactInfo: {
        hasPhone:
          /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(html) ||
          /phone|tel:/i.test(html),
        hasEmail:
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html) ||
          /mailto:/i.test(html),
        hasAddress:
          /(street|address|avenue|road|drive|lane|boulevard|way|place)/i.test(
            html
          ),
      },
      brokenLinks: [], // Will check separately

      // Mobile Experience Checks
      mobile: {
        viewport: {
          exists: cheerioInstance('meta[name="viewport"]').length > 0,
          content:
            cheerioInstance('meta[name="viewport"]').attr("content") || "",
          hasUserScalable: /user-scalable/i.test(
            cheerioInstance('meta[name="viewport"]').attr("content") || ""
          ),
        },
        tapTargets: {
          // Check for small clickable elements (heuristic)
          smallButtons: smallButtons,
        },
        fontSizes: {
          // Check for very small font sizes (heuristic)
          smallFonts: smallFonts,
        },
        stickyElements: cheerioInstance(
          "[style*='position: sticky'], [style*='position:fixed']"
        ).length,
        mobileMenu: /menu|nav|hamburger/i.test(html),
        clickToCall: /tel:|call|phone/i.test(html),
        clickToEmail: /mailto:|email/i.test(html),
      },

      // Content Quality Checks
      content: {
        readability: {
          // Simple word count heuristic
          wordCount: (html.match(/\b\w+\b/g) || []).length || 0,
          sentenceCount: (html.match(/[.!?]+/g) || []).length || 0,
          avgWordsPerSentence: 0, // Will calculate below
        },
        headings: {
          h1: cheerioInstance("h1").length,
          h2: cheerioInstance("h2").length,
          h3: cheerioInstance("h3").length,
          h4: cheerioInstance("h4").length,
          h5: cheerioInstance("h5").length,
          h6: cheerioInstance("h6").length,
          hierarchy: [], // Will check order
        },
        aboveFold: {
          // Heuristic: check first 2000 chars for key content
          hasValueProp: /value|benefit|solution|help|why/i.test(
            html.substring(0, 2000)
          ),
          hasCTA: /(buy|sign|start|get|try|learn|contact|call|email)/i.test(
            html.substring(0, 2000)
          ),
        },
        aboutPage: /about|who we are|our story/i.test(html.toLowerCase()),
        authorAttribution: /author|by |written by/i.test(html),
      },

      // Conversion Readiness Checks
      conversion: {
        cta: {
          primary: {
            exists:
              /(buy|sign|start|get|try|learn|contact|call|email|subscribe|download)/i.test(
                html
              ),
            aboveFold:
              /(buy|sign|start|get|try|learn|contact|call|email|subscribe|download)/i.test(
                html.substring(0, 2000)
              ),
            count: (
              html.match(
                /(buy|sign|start|get|try|learn|contact|call|email|subscribe|download)/gi
              ) || []
            ).length,
          },
        },
        forms: {
          count: cheerioInstance("form").length,
          fieldCount: cheerioInstance("input, textarea, select").length,
          hasSubmit:
            cheerioInstance("input[type='submit'], button[type='submit']")
              .length > 0,
          errorHandling: {
            // Check for error message patterns
            hasErrorMessages: /error|invalid|required|missing|incorrect/i.test(
              html
            ),
            hasAriaInvalid: cheerioInstance("[aria-invalid]").length > 0,
            hasErrorIds: /error|invalid|required/i.test(html),
          },
          confirmationFeedback:
            /success|thank you|submitted|confirmation/i.test(
              html.toLowerCase()
            ),
        },
        contactInfo: {
          phone:
            /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(html) ||
            /tel:/i.test(html),
          email:
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html) ||
            /mailto:/i.test(html),
          address:
            /(street|address|avenue|road|drive|lane|boulevard|way|place)/i.test(
              html
            ),
          clickablePhone: /tel:/i.test(html),
          clickableEmail: /mailto:/i.test(html),
        },
        pageIntent: {
          // Heuristic: check for single clear goal
          hasSingleGoal: true, // Simplified
        },
      },

      // Trust & Credibility Checks
      trust: {
        ssl: url.startsWith("https://"),
        privacyPolicy:
          /privacy|privacy policy|privacy-policy/i.test(html) ||
          cheerioInstance('a[href*="privacy"]').length > 0,
        termsOfService:
          /terms|terms of service|terms-of-service|tos/i.test(html) ||
          cheerioInstance('a[href*="terms"]').length > 0,
        cookieConsent: /cookie|gdpr|consent|accept cookies/i.test(
          html.toLowerCase()
        ),
        physicalAddress:
          /(street|address|avenue|road|drive|lane|boulevard|way|place|po box|p\.o\. box)/i.test(
            html
          ),
        phoneNumber: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(
          html
        ),
        testimonials:
          /testimonial|review|client says|customer says|what our/i.test(
            html.toLowerCase()
          ),
        clientLogos: cheerioInstance(
          'img[alt*="logo"], img[src*="logo"], .logo, [class*="client"]'
        ).length,
        caseStudies: /case study|case-study|success story|portfolio/i.test(
          html.toLowerCase()
        ),
        contactPage:
          cheerioInstance('a[href*="contact"]').length > 0 ||
          /contact/i.test(html.substring(0, 1000)),
      },

      // Technical Health Checks
      technical: {
        consoleErrors: (lighthouseResults.bestPractices && lighthouseResults.bestPractices.consoleErrors) || 0,
        redirects: {
          // Check response status
          status: responseStatus,
          isRedirect: responseStatus >= 300 && responseStatus < 400,
        },
        canonicalConflicts: cheerioInstance('link[rel="canonical"]').length > 1,
        duplicateMeta: {
          titles: cheerioInstance("title").length,
          descriptions: cheerioInstance('meta[name="description"]').length,
        },
        urlStructure: {
          trailingSlash: url.endsWith("/"),
          hasParams: url.includes("?"),
          hasHash: url.includes("#"),
          depth: url.split("/").length - 3,
        },
        cdn: {
          // Heuristic: check for CDN indicators in URLs
          hasCDN: /cdn|cloudfront|cloudflare|fastly|akamai/i.test(html),
        },
      },

      // Security Checks
      security: {
        https: url.startsWith("https://"),
        mixedContent: (lighthouseResults.bestPractices && lighthouseResults.bestPractices.mixedContent) || 0,
        securityHeaders: {
          csp: responseHeaders["content-security-policy"] ? true : false,
          hsts: responseHeaders["strict-transport-security"] ? true : false,
          xFrameOptions: responseHeaders["x-frame-options"] ? true : false,
          xContentTypeOptions: responseHeaders["x-content-type-options"]
            ? true
            : false,
        },
        openDirectory: false, // Would need to check /admin, /login, etc.
        exposedPaths: {
          admin:
            /\/admin|\/wp-admin|\/administrator/i.test(html) ||
            cheerioInstance('a[href*="/admin"]').length > 0,
          login:
            /\/login|\/signin|\/wp-login/i.test(html) ||
            cheerioInstance('a[href*="/login"]').length > 0,
        },
        cmsFingerprint: {
          wordpress: /wp-content|wp-includes|wordpress/i.test(html),
          drupal: /drupal|sites\/all/i.test(html),
          joomla: /joomla|components\/com_/i.test(html),
        },
      },

      // Analytics & Tracking Checks
      analytics: {
        googleAnalytics:
          /google-analytics|gtag|ga\(|analytics\.js|gtm\.js/i.test(html),
        tagManager: /googletagmanager|GTM-/i.test(html),
        duplicateTrackers: (html.match(/gtag|ga\(|analytics\.js/gi) || [])
          .length,
        dataLayer: /dataLayer|data-layer/i.test(html),
        conversionEvents: /event|conversion|purchase|sign_up/i.test(html),
        formTracking:
          cheerioInstance("form").length > 0 &&
          /gtag|ga\(|dataLayer/i.test(html),
        clickTracking: /onclick.*gtag|onclick.*ga\(/i.test(html),
      },

      // Structured Data & AI Readiness
      structuredData: {
        present: /application\/ld\+json|application\/json|schema\.org/i.test(
          html
        ),
        schemas: {
          organization: /"@type"\s*:\s*"Organization"/i.test(html),
          faq: /"@type"\s*:\s*"FAQPage"/i.test(html),
          howTo: /"@type"\s*:\s*"HowTo"/i.test(html),
          article: /"@type"\s*:\s*"Article"/i.test(html),
          product: /"@type"\s*:\s*"Product"/i.test(html),
        },
        semanticHeadings: cheerioInstance("h1, h2, h3, h4, h5, h6").length > 0,
        contentChunking: {
          // Heuristic: check for well-structured content blocks
          hasSections: cheerioInstance("section, article, main").length > 0,
          hasParagraphs: cheerioInstance("p").length > 3,
        },
        answerReady: {
          // Check for FAQ-like structures
          hasFAQ: /"@type"\s*:\s*"FAQPage"|faq|question|answer/i.test(html),
        },
      },

      // Branding & Messaging Checks
      branding: {
        valueProposition: {
          clear: /value|benefit|solution|help|why|what we do/i.test(
            html.substring(0, 3000)
          ),
        },
        messaging: {
          consistent: true, // Heuristic - would need deeper analysis
        },
        visualHierarchy: {
          hasHeadings: cheerioInstance("h1, h2, h3").length > 0,
          hasStructure:
            cheerioInstance("header, main, section, footer").length > 0,
        },
        logo: {
          present:
            cheerioInstance(
              'img[alt*="logo"], img[src*="logo"], .logo, [class*="logo"]'
            ).length > 0,
          inHeader:
            cheerioInstance("header img, .header img, [class*='header'] img")
              .length > 0,
        },
      },

      // Competitive Positioning (Heuristic)
      competitive: {
        differentiation: /unique|different|better|best|leading|#1/i.test(
          html.substring(0, 5000)
        ),
        features: /feature|benefit|advantage|why choose/i.test(
          html.toLowerCase()
        ),
        pricing: /price|pricing|cost|\$|€|£/i.test(html),
        usp: /unique selling|usp|what makes us/i.test(html.toLowerCase()),
      },

      // Operational Readiness (Heuristic)
      operational: {
        cmsUsability: true, // Cannot determine from HTML alone
        contentUpdateEase: true, // Cannot determine
        versionControl: false, // Cannot determine from HTML
        deploymentPipeline: false, // Cannot determine
        hostingScalability: {
          hasCDN: /cdn|cloudfront|cloudflare/i.test(html),
        },
        errorMonitoring: /sentry|rollbar|bugsnag|error tracking/i.test(html),
      },

      // Legal & Compliance Checks
      legal: {
        gdpr: /gdpr|general data protection|data protection regulation/i.test(
          html.toLowerCase()
        ),
        ccpa: /ccpa|california consumer privacy|california privacy/i.test(
          html.toLowerCase()
        ),
        cookieConsent: /cookie|consent|accept cookies|cookie policy/i.test(
          html.toLowerCase()
        ),
        accessibilityStatement: /accessibility|a11y|wcag|section 508/i.test(
          html.toLowerCase()
        ),
        dataCollection: /privacy|data collection|how we use data/i.test(
          html.toLowerCase()
        ),
      },

      // GEO Checks
      geo: {
        geolocationPermission: lighthouseResults.geolocationPermission || false,
        hreflang: {
          exists: hreflangTags.length > 0,
          count: hreflangTags.length,
          tags: hreflangTags,
        },
        geoMeta: {
          geoRegion:
            cheerioInstance('meta[name="geo.region"]').attr("content") || null,
          geoPlacename:
            cheerioInstance('meta[name="geo.placename"]').attr("content") ||
            null,
          geoPosition:
            cheerioInstance('meta[name="geo.position"]').attr("content") ||
            null,
          icbm: cheerioInstance('meta[name="ICBM"]').attr("content") || null,
        },
        language: {
          htmlLang: cheerioInstance("html").attr("lang") || null,
          xmlLang: cheerioInstance("html").attr("xml:lang") || null,
          hasValidLang: !!cheerioInstance("html").attr("lang"),
        },
        cldr: {
          // Check for CLDR/Unicode locale identifiers
          hasLocale: /[a-z]{2}-[A-Z]{2}/i.test(
            cheerioInstance("html").attr("lang") || ""
          ),
        },
      },
    };

    // Calculate readability metrics
    if (
      checks.content.readability.wordCount > 0 &&
      checks.content.readability.sentenceCount > 0
    ) {
      checks.content.readability.avgWordsPerSentence =
        checks.content.readability.wordCount /
        checks.content.readability.sentenceCount;
    }

    // Check for geolocation permission from Lighthouse (will be added later)
    // Check for sitemap
    try {
      const sitemapUrl = new URL("/sitemap.xml", baseUrl).href;
      await axios.head(sitemapUrl, { timeout: 5000 });
      checks.sitemap = { exists: true, url: sitemapUrl };
    } catch (e) {
      checks.sitemap = { exists: false };
    }

    // Check for robots.txt
    try {
      const robotsUrl = new URL("/robots.txt", baseUrl).href;
      const robotsResponse = await axios.get(robotsUrl, { timeout: 5000 });
      checks.robotsTxt = {
        exists: true,
        url: robotsUrl,
        valid:
          robotsResponse.data.includes("User-agent") ||
          robotsResponse.data.includes("Disallow") ||
          robotsResponse.data.includes("Allow"),
      };
    } catch (e) {
      checks.robotsTxt = { exists: false };
    }

    // Calculate internal linking depth (heuristic - max depth from current page)
    const internalLinks = cheerioInstance("a[href]")
      .map((i, el) => {
        const href = cheerioInstance(el).attr("href");
        if (!href) return null;
        try {
          const linkUrl = new URL(href, baseUrl);
          if (linkUrl.hostname === baseUrl.hostname) {
            return linkUrl.pathname;
          }
        } catch {
          if (href.startsWith("/") || href.startsWith("./")) {
            return href;
          }
        }
        return null;
      })
      .get()
      .filter(Boolean);

    checks.internalLinking.internalLinks = internalLinks.length;

    if (internalLinks.length > 0) {
      const depths = internalLinks.map((link) => {
        const path = link.split("/").filter((p) => p.length > 0);
        return path.length;
      });
      checks.internalLinking.maxDepth = Math.max(...depths, 0);
    }

    // Validate heading hierarchy
    const headings = [];
    cheerioInstance("h1, h2, h3, h4, h5, h6").each((i, el) => {
      const level = parseInt(cheerioInstance(el).prop("tagName").substring(1));
      headings.push({ level, text: cheerioInstance(el).text().trim() });
    });

    let lastLevel = 0;
    const hierarchyIssues = [];
    headings.forEach((heading, index) => {
      if (index === 0 && heading.level !== 1) {
        hierarchyIssues.push("First heading should be H1");
      }
      if (heading.level > lastLevel + 1) {
        hierarchyIssues.push(
          `Heading level jumps from H${lastLevel} to H${heading.level}`
        );
      }
      lastLevel = heading.level;
    });

    checks.headingHierarchy.isValid = hierarchyIssues.length === 0;
    checks.headingHierarchy.issues = hierarchyIssues;

    // Check top 10 links for broken ones
    const links = cheerioInstance("a[href]")
      .slice(0, 10)
      .map((i, el) => {
        const href = cheerioInstance(el).attr("href");
        try {
          return new URL(href, baseUrl).href;
        } catch {
          return null;
        }
      })
      .get()
      .filter(Boolean);

    const linkChecks = await Promise.allSettled(
      links.map(async (link) => {
        try {
          await axios.head(link, { timeout: 5000 });
          return { url: link, status: "ok" };
        } catch (error) {
          return {
            url: link,
            status: "broken",
            statusCode: (error.response && error.response.status),
          };
        }
      })
    );

    checks.brokenLinks = linkChecks
      .filter(
        (result) =>
          result.status === "fulfilled" && result.value.status === "broken"
      )
      .map((result) => result.value);

    return checks;
  } catch (error) {
    console.error("HTML check error:", error);
    throw error;
  }
}

function generateReport(url, lighthouseResults, htmlChecks, scores) {
  const issues = [];

  // Performance issues
  if (lighthouseResults.performance.lcp > 2500) {
    issues.push({
      category: "performance",
      title: "Slow Largest Contentful Paint (LCP)",
      description: `Your LCP is ${Math.round(
        lighthouseResults.performance.lcp
      )}ms, which is above the recommended 2.5s threshold.`,
      impact: "High",
      difficulty: "Medium",
      fix: "Optimize your hero image, reduce server response time, or eliminate render-blocking resources.",
      estimatedImpact: "Could improve LCP by 30-50%",
    });
  } else if (lighthouseResults.performance.lcp > 2000) {
    // Sub-optimal but not critical
    issues.push({
      category: "performance",
      title: "LCP Could Be Faster",
      description: `Your LCP is ${Math.round(
        lighthouseResults.performance.lcp
      )}ms. While acceptable, optimizing to under 2s would improve user experience.`,
      impact: "Medium",
      difficulty: "Medium",
      fix: "Consider optimizing images, reducing server response time, or preloading critical resources.",
      estimatedImpact: "Could improve LCP by 20-30%",
    });
  }

  if (lighthouseResults.pageWeight > 2 * 1024 * 1024) {
    issues.push({
      category: "performance",
      title: "Large Page Weight",
      description: `Your page is ${(
        lighthouseResults.pageWeight /
        1024 /
        1024
      ).toFixed(2)}MB, which can slow down loading.`,
      impact: "High",
      difficulty: "Easy",
      fix: "Compress images, enable gzip compression, and minify CSS/JS files.",
      estimatedImpact: "Could reduce page weight by 40-60%",
    });
  } else if (lighthouseResults.pageWeight > 1.5 * 1024 * 1024) {
    // Sub-optimal but not critical
    issues.push({
      category: "performance",
      title: "Page Weight Optimization Opportunity",
      description: `Your page is ${(
        lighthouseResults.pageWeight /
        1024 /
        1024
      ).toFixed(2)}MB. Reducing to under 1.5MB would improve load times.`,
      impact: "Medium",
      difficulty: "Easy",
      fix: "Compress images further, remove unused CSS/JS, and consider lazy loading non-critical resources.",
      estimatedImpact: "Could reduce page weight by 20-30%",
    });
  }

  // Request count optimization
  if (lighthouseResults.requests > 100) {
    issues.push({
      category: "performance",
      title: "Too Many HTTP Requests",
      description: `Your page makes ${lighthouseResults.requests} requests, which can slow down loading.`,
      impact: "High",
      difficulty: "Medium",
      fix: "Combine CSS/JS files, use image sprites, and reduce third-party scripts.",
      estimatedImpact: "Could reduce requests by 30-40%",
    });
  } else if (lighthouseResults.requests > 50) {
    issues.push({
      category: "performance",
      title: "Request Count Optimization",
      description: `Your page makes ${lighthouseResults.requests} requests. Reducing to under 50 would improve performance.`,
      impact: "Medium",
      difficulty: "Medium",
      fix: "Combine CSS/JS files where possible and consider bundling resources.",
      estimatedImpact: "Could reduce requests by 20-30%",
    });
  }

  if (htmlChecks.images.missingAlt > 0) {
    issues.push({
      category: "accessibility",
      title: "Missing Alt Text on Images",
      description: `${htmlChecks.images.missingAlt} image(s) are missing alt text, which hurts accessibility and SEO.`,
      impact: "Medium",
      difficulty: "Easy",
      fix: 'Add descriptive alt text to all images. Use empty alt="" for decorative images.',
      estimatedImpact: "Improves accessibility score and helps with SEO",
    });
  }

  if (!htmlChecks.title.exists) {
    issues.push({
      category: "seo",
      title: "Missing Title Tag",
      description:
        "Your page is missing a title tag, which is critical for SEO.",
      impact: "High",
      difficulty: "Easy",
      fix: "Add a descriptive title tag between <title> tags in your HTML head.",
      estimatedImpact: "Essential for SEO and search engine rankings",
    });
  } else if (!htmlChecks.title.optimal) {
    issues.push({
      category: "seo",
      title: "Title Tag Length Not Optimal",
      description: `Your title tag is ${htmlChecks.title.length} characters. Optimal length is 30-60 characters for better SEO.`,
      impact: "Medium",
      difficulty: "Easy",
      fix: `Adjust your title to be between 30-60 characters. Current: "${htmlChecks.title.content.substring(
        0,
        60
      )}"`,
      estimatedImpact: "Improves SEO and click-through rates",
    });
  }

  if (
    !htmlChecks.metaDescription.exists ||
    !htmlChecks.metaDescription.optimal
  ) {
    issues.push({
      category: "seo",
      title: htmlChecks.metaDescription.exists
        ? "Meta Description Length Issue"
        : "Missing Meta Description",
      description: htmlChecks.metaDescription.exists
        ? `Your meta description is ${htmlChecks.metaDescription.length} characters. Optimal length is 120-160 characters.`
        : "Your page is missing a meta description, which affects how your site appears in search results.",
      impact: "Medium",
      difficulty: "Easy",
      fix: htmlChecks.metaDescription.exists
        ? "Adjust your meta description to be between 120-160 characters for optimal display."
        : "Add a compelling meta description that summarizes your page content and includes a call-to-action.",
      estimatedImpact:
        "Can improve click-through rate from search results by 10-20%",
    });
  }

  if (htmlChecks.h1.count !== 1) {
    issues.push({
      category: "seo",
      title: htmlChecks.h1.count === 0 ? "Missing H1 Tag" : "Multiple H1 Tags",
      description:
        htmlChecks.h1.count === 0
          ? "Your page is missing an H1 tag, which is important for SEO and accessibility."
          : `Your page has ${htmlChecks.h1.count} H1 tags. You should have exactly one.`,
      impact: "Medium",
      difficulty: "Easy",
      fix:
        htmlChecks.h1.count === 0
          ? "Add a single H1 tag that describes the main content of the page."
          : "Ensure you have only one H1 tag per page, using H2-H6 for subheadings.",
      estimatedImpact:
        "Improves SEO structure and helps search engines understand page hierarchy",
    });
  }

  if (!htmlChecks.ssl) {
    issues.push({
      category: "trust",
      title: "No SSL Certificate",
      description:
        "Your site is not using HTTPS, which can hurt trust and SEO rankings.",
      impact: "High",
      difficulty: "Medium",
      fix: "Install an SSL certificate. Most hosting providers offer free SSL certificates via Let's Encrypt.",
      estimatedImpact:
        "Required for modern web standards and can improve search rankings",
    });
  }

  if (!htmlChecks.viewport.exists) {
    issues.push({
      category: "trust",
      title: "Missing Viewport Meta Tag",
      description:
        "Your page is missing the viewport meta tag, which can cause mobile display issues.",
      impact: "High",
      difficulty: "Easy",
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your page head.',
      estimatedImpact:
        "Ensures proper mobile display and improves mobile user experience",
    });
  }

  if (htmlChecks.brokenLinks.length > 0) {
    issues.push({
      category: "seo",
      title: "Broken Links Found",
      description: `Found ${htmlChecks.brokenLinks.length} broken link(s) in the top 10 links checked.`,
      impact: "Medium",
      difficulty: "Easy",
      fix: "Fix or remove broken links. This improves user experience and SEO.",
      estimatedImpact: "Prevents user frustration and maintains SEO value",
    });
  }

  if (!htmlChecks.canonical.exists) {
    issues.push({
      category: "seo",
      title: "Missing Canonical Tag",
      description:
        "Your page is missing a canonical tag, which can help prevent duplicate content issues.",
      impact: "Low",
      difficulty: "Easy",
      fix: "Add a canonical tag pointing to the preferred version of the page.",
      estimatedImpact: "Helps prevent duplicate content penalties",
    });
  }

  // GEO issues
  if ((htmlChecks.geo && htmlChecks.geo.geolocationPermission)) {
    issues.push({
      category: "geo",
      title: "Geolocation Permission Requested on Page Load",
      description:
        "Your site requests geolocation permission immediately when the page loads, which can hurt user experience and trust.",
      impact: "Medium",
      difficulty: "Easy",
      fix: "Only request geolocation permission after user interaction (e.g., clicking a button). Never request it on page load.",
      estimatedImpact: "Improves user trust and reduces bounce rate",
    });
  }

  if (!(htmlChecks.geo && htmlChecks.geo.language && htmlChecks.geo.language.hasValidLang)) {
    issues.push({
      category: "geo",
      title: "Missing Language Attribute",
      description:
        "Your HTML element is missing a lang attribute, which is important for accessibility and SEO.",
      impact: "Medium",
      difficulty: "Easy",
      fix: 'Add a lang attribute to your <html> tag (e.g., <html lang="en">).',
      estimatedImpact:
        "Improves accessibility and helps search engines understand content language",
    });
  }

  if (
    (htmlChecks.geo && htmlChecks.geo.hreflang && htmlChecks.geo.hreflang.exists) &&
    !htmlChecks.geo.hreflang.tags.some((tag) => tag.lang === "x-default")
  ) {
    issues.push({
      category: "geo",
      title: "Missing hreflang x-default",
      description:
        "You have hreflang tags but are missing the x-default tag, which tells search engines which version to show users when no specific language/region matches.",
      impact: "Low",
      difficulty: "Easy",
      fix: 'Add <link rel="alternate" hreflang="x-default" href="your-default-url" /> to specify the default version.',
      estimatedImpact: "Improves international SEO and user experience",
    });
  }

  if (
    (htmlChecks.geo && htmlChecks.geo.language && htmlChecks.geo.language.htmlLang) &&
    htmlChecks.geo.language.htmlLang.length > 2 &&
    !(htmlChecks.geo && htmlChecks.geo.cldr && htmlChecks.geo.cldr.hasLocale)
  ) {
    issues.push({
      category: "geo",
      title: "Invalid Language Locale Format",
      description: `Your lang attribute "${htmlChecks.geo.language.htmlLang}" is not in the proper format. Use ISO 639-1 language codes with optional ISO 3166-1 region codes (e.g., "en-US", "fr-CA").`,
      impact: "Low",
      difficulty: "Easy",
      fix: 'Update your lang attribute to use proper locale format (e.g., <html lang="en-US">).',
      estimatedImpact:
        "Ensures proper language detection by browsers and search engines",
    });
  }

  // Mobile Experience issues
  if (!(htmlChecks.mobile && htmlChecks.mobile.viewport && htmlChecks.mobile.viewport.exists)) {
    issues.push({
      category: "mobile",
      title: "Missing Viewport Meta Tag",
      description:
        "Your page is missing the viewport meta tag, which is critical for mobile display.",
      impact: "High",
      difficulty: "Easy",
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your page head.',
      estimatedImpact: "Ensures proper mobile display and user experience",
    });
  }

  if ((htmlChecks.mobile && htmlChecks.mobile.tapTargets && (htmlChecks.mobile.tapTargets.smallButtons || 0) > 5)) {
    issues.push({
      category: "mobile",
      title: "Small Tap Targets",
      description: `Found ${htmlChecks.mobile.tapTargets.smallButtons} small clickable elements that may be difficult to tap on mobile devices.`,
      impact: "Medium",
      difficulty: "Medium",
      fix: "Ensure all interactive elements are at least 44x44 pixels for easy tapping on mobile.",
      estimatedImpact: "Improves mobile usability and reduces user frustration",
    });
  }

  // Content Quality issues
  if ((htmlChecks.content && htmlChecks.content.readability && htmlChecks.content.readability.wordCount < 300)) {
    issues.push({
      category: "content",
      title: "Thin Content",
      description: `Your page has only ${htmlChecks.content.readability.wordCount} words, which may be considered thin content by search engines.`,
      impact: "Medium",
      difficulty: "Medium",
      fix: "Add more valuable, relevant content to your page. Aim for at least 300-500 words of quality content.",
      estimatedImpact: "Improves SEO rankings and user engagement",
    });
  }

  if (!(htmlChecks.content && htmlChecks.content.aboveFold && htmlChecks.content.aboveFold.hasValueProp)) {
    issues.push({
      category: "content",
      title: "Unclear Value Proposition Above Fold",
      description:
        "Your above-the-fold content doesn't clearly communicate your value proposition to visitors.",
      impact: "Medium",
      difficulty: "Medium",
      fix: "Add a clear, compelling value proposition in the first 2000 characters of your page.",
      estimatedImpact: "Improves user engagement and conversion rates",
    });
  }

  // Conversion Readiness issues
  if (!(htmlChecks.conversion && htmlChecks.conversion.cta && htmlChecks.conversion.cta.primary && htmlChecks.conversion.cta.primary.exists)) {
    issues.push({
      category: "conversion",
      title: "Missing Primary Call-to-Action",
      description:
        "Your page doesn't have a clear primary call-to-action, which can hurt conversion rates.",
      impact: "High",
      difficulty: "Easy",
      fix: "Add a clear, prominent call-to-action button (e.g., 'Get Started', 'Contact Us', 'Buy Now').",
      estimatedImpact: "Can significantly improve conversion rates",
    });
  } else if (!(htmlChecks.conversion && htmlChecks.conversion.cta && htmlChecks.conversion.cta.primary && htmlChecks.conversion.cta.primary.aboveFold)) {
    issues.push({
      category: "conversion",
      title: "CTA Not Visible Above Fold",
      description:
        "Your primary call-to-action is not visible above the fold, requiring users to scroll to find it.",
      impact: "Medium",
      difficulty: "Easy",
      fix: "Move your primary CTA above the fold so it's immediately visible to visitors.",
      estimatedImpact: "Can improve conversion rates by 20-30%",
    });
  }

  if ((htmlChecks.conversion && htmlChecks.conversion.forms && htmlChecks.conversion.forms.count === 0)) {
    issues.push({
      category: "conversion",
      title: "No Contact Forms",
      description:
        "Your page doesn't have any contact forms, making it harder for visitors to reach you.",
      impact: "Medium",
      difficulty: "Easy",
      fix: "Add a contact form to make it easy for visitors to get in touch.",
      estimatedImpact: "Improves lead generation and user engagement",
    });
  }

  // Technical Health issues
  if ((htmlChecks.technical && htmlChecks.technical.consoleErrors > 0)) {
    issues.push({
      category: "technical",
      title: "JavaScript Console Errors",
      description: `Found ${htmlChecks.technical.consoleErrors} JavaScript error(s) in the console, which can affect functionality.`,
      impact: "High",
      difficulty: "Medium",
      fix: "Review and fix JavaScript errors in your browser console. Check for missing dependencies, syntax errors, or API issues.",
      estimatedImpact: "Ensures proper site functionality and user experience",
    });
  }

  if ((htmlChecks.technical && htmlChecks.technical.canonicalConflicts)) {
    issues.push({
      category: "technical",
      title: "Multiple Canonical Tags",
      description:
        "Your page has multiple canonical tags, which can confuse search engines.",
      impact: "High",
      difficulty: "Easy",
      fix: "Ensure you have only one canonical tag per page pointing to the preferred URL.",
      estimatedImpact: "Prevents SEO issues and duplicate content problems",
    });
  }

  // Security issues
  if (!(htmlChecks.security && htmlChecks.security.https)) {
    issues.push({
      category: "security",
      title: "No HTTPS/SSL Certificate",
      description:
        "Your site is not using HTTPS, which is a security risk and hurts SEO.",
      impact: "High",
      difficulty: "Medium",
      fix: "Install an SSL certificate and enable HTTPS. Most hosting providers offer free SSL certificates.",
      estimatedImpact: "Required for security and can improve search rankings",
    });
  }

  if ((htmlChecks.security && htmlChecks.security.mixedContent > 0)) {
    issues.push({
      category: "security",
      title: "Mixed Content Detected",
      description: `Found ${htmlChecks.security.mixedContent} mixed content issue(s) (HTTP resources on HTTPS page).`,
      impact: "High",
      difficulty: "Medium",
      fix: "Update all HTTP resources to use HTTPS. This includes images, scripts, stylesheets, and other assets.",
      estimatedImpact: "Improves security and prevents browser warnings",
    });
  }

  if (!(htmlChecks.security && htmlChecks.security.securityHeaders && htmlChecks.security.securityHeaders.csp)) {
    issues.push({
      category: "security",
      title: "Missing Content Security Policy",
      description:
        "Your site is missing a Content Security Policy (CSP) header, which helps prevent XSS attacks.",
      impact: "Medium",
      difficulty: "Hard",
      fix: "Implement a Content Security Policy header. Start with a report-only mode to test before enforcing.",
      estimatedImpact: "Improves security against XSS attacks",
    });
  }

  // Analytics issues
  if (
    !(htmlChecks.analytics && htmlChecks.analytics.googleAnalytics) &&
    !(htmlChecks.analytics && htmlChecks.analytics.tagManager)
  ) {
    issues.push({
      category: "analytics",
      title: "No Analytics Tracking",
      description:
        "Your site doesn't have Google Analytics or Tag Manager installed, making it impossible to track visitor behavior.",
      impact: "High",
      difficulty: "Easy",
      fix: "Install Google Analytics 4 (GA4) or Google Tag Manager to track visitor behavior and conversions.",
      estimatedImpact:
        "Enables data-driven decision making and conversion tracking",
    });
  }

  // Structured Data issues
  if (!(htmlChecks.structuredData && htmlChecks.structuredData.present)) {
    issues.push({
      category: "structuredData",
      title: "No Structured Data",
      description:
        "Your page doesn't have structured data (Schema.org markup), which helps search engines understand your content.",
      impact: "Medium",
      difficulty: "Medium",
      fix: "Add structured data markup using JSON-LD format. Start with Organization schema and add relevant schemas for your content type.",
      estimatedImpact:
        "Can improve search result appearance and click-through rates",
    });
  }

  if (!(htmlChecks.structuredData && htmlChecks.structuredData.schemas && htmlChecks.structuredData.schemas.organization)) {
    issues.push({
      category: "structuredData",
      title: "Missing Organization Schema",
      description:
        "Your page is missing Organization schema markup, which helps establish your brand in search results.",
      impact: "Medium",
      difficulty: "Easy",
      fix: "Add Organization schema markup with your business name, logo, contact information, and social profiles.",
      estimatedImpact: "Improves brand visibility in search results",
    });
  }

  // Legal & Compliance issues
  if (!(htmlChecks.legal && htmlChecks.legal.gdpr) && !(htmlChecks.legal && htmlChecks.legal.cookieConsent)) {
    issues.push({
      category: "legal",
      title: "Missing GDPR/Cookie Consent",
      description:
        "Your site doesn't have a cookie consent banner or GDPR disclosure, which may be required for EU visitors.",
      impact: "High",
      difficulty: "Easy",
      fix: "Add a cookie consent banner and GDPR privacy policy disclosure. Consider using a cookie consent solution.",
      estimatedImpact: "Ensures legal compliance and builds user trust",
    });
  }

  if (!(htmlChecks.legal && htmlChecks.legal.dataCollection)) {
    issues.push({
      category: "legal",
      title: "Missing Data Collection Transparency",
      description:
        "Your privacy policy doesn't clearly explain how you collect and use visitor data.",
      impact: "Medium",
      difficulty: "Medium",
      fix: "Update your privacy policy to clearly explain what data you collect, how you use it, and how users can opt out.",
      estimatedImpact: "Improves legal compliance and user trust",
    });
  }

  // SEO - Additional issues
  if (!(htmlChecks.robotsTxt && htmlChecks.robotsTxt.exists)) {
    issues.push({
      category: "seo",
      title: "Missing robots.txt",
      description:
        "Your site doesn't have a robots.txt file, which search engines use to understand crawling rules.",
      impact: "Low",
      difficulty: "Easy",
      fix: "Create a robots.txt file in your site root with appropriate crawl directives.",
      estimatedImpact: "Helps search engines crawl your site more effectively",
    });
  }

  if (!(htmlChecks.headingHierarchy && htmlChecks.headingHierarchy.isValid)) {
    issues.push({
      category: "seo",
      title: "Invalid Heading Hierarchy",
      description: `Your heading structure has issues: ${htmlChecks.headingHierarchy.issues.join(
        ", "
      )}`,
      impact: "Medium",
      difficulty: "Easy",
      fix: "Ensure headings follow a logical hierarchy (H1 → H2 → H3, etc.) without skipping levels.",
      estimatedImpact: "Improves SEO structure and accessibility",
    });
  }

  if ((htmlChecks.internalLinking && htmlChecks.internalLinking.maxDepth > 4)) {
    issues.push({
      category: "seo",
      title: "Deep Internal Linking Structure",
      description: `Your internal links have a maximum depth of ${htmlChecks.internalLinking.maxDepth} levels, which may make it harder for search engines to discover deep pages.`,
      impact: "Low",
      difficulty: "Medium",
      fix: "Add more internal links to important pages and reduce the click depth from homepage to key pages.",
      estimatedImpact: "Improves crawlability and page discovery",
    });
  }

  // Conversion - Form issues
  if ((htmlChecks.conversion && htmlChecks.conversion.forms && htmlChecks.conversion.forms.count > 0)) {
    if (
      !(htmlChecks.conversion.forms.errorHandling && htmlChecks.conversion.forms.errorHandling.hasErrorMessages) &&
      !(htmlChecks.conversion.forms.errorHandling && htmlChecks.conversion.forms.errorHandling.hasAriaInvalid)
    ) {
      issues.push({
        category: "conversion",
        title: "Missing Form Error Handling",
        description:
          "Your forms don't appear to have proper error handling or validation feedback.",
        impact: "Medium",
        difficulty: "Medium",
        fix: "Add clear error messages, validation feedback, and use ARIA attributes (aria-invalid, aria-describedby) for accessibility.",
        estimatedImpact:
          "Improves user experience and reduces form abandonment",
      });
    }

    if (!htmlChecks.conversion.forms.confirmationFeedback) {
      issues.push({
        category: "conversion",
        title: "Missing Form Confirmation Feedback",
        description:
          "Your forms don't show clear confirmation messages after submission.",
        impact: "Low",
        difficulty: "Easy",
        fix: "Add a success message or confirmation page after form submission to reassure users.",
        estimatedImpact:
          "Improves user confidence and reduces duplicate submissions",
      });
    }
  }

  // Accessibility - Error messages
  if ((htmlChecks.accessibility && htmlChecks.accessibility.accessibleErrorMessages)) {
    if (
      !htmlChecks.accessibility.accessibleErrorMessages.hasAriaLive &&
      !htmlChecks.accessibility.accessibleErrorMessages.hasRoleAlert
    ) {
      issues.push({
        category: "accessibility",
        title: "Missing Accessible Error Messages",
        description:
          "Your error messages may not be properly announced to screen readers.",
        impact: "Medium",
        difficulty: "Easy",
        fix: "Use aria-live regions or role='alert' to ensure error messages are announced to assistive technologies.",
        estimatedImpact: "Improves accessibility for users with screen readers",
      });
    }
  }

  // Sort issues by impact (High > Medium > Low)
  const impactOrder = { High: 3, Medium: 2, Low: 1 };
  issues.sort((a, b) => impactOrder[b.impact] - impactOrder[a.impact]);

  return {
    url,
    timestamp: new Date().toISOString(),
    overallScore: scores.overall,
    grade: scores.grade,
    categoryScores: {
      performance: scores.performance,
      mobile: scores.mobile,
      seo: scores.seo,
      content: scores.content,
      conversion: scores.conversion,
      trust: scores.trust,
      accessibility: scores.accessibility,
      technical: scores.technical,
      security: scores.security,
      analytics: scores.analytics,
      structuredData: scores.structuredData,
      branding: scores.branding,
      competitive: scores.competitive,
      operational: scores.operational,
      legal: scores.legal,
      geo: scores.geo,
    },
    topFixes: issues.slice(0, 5),
    allIssues: issues,
    metrics: {
      performance: lighthouseResults.performance,
      pageWeight: lighthouseResults.pageWeight,
      requests: lighthouseResults.requests,
    },
    htmlChecks,
  };
}

module.exports = {
  auditWebsite,
};
