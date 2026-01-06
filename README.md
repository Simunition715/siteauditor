# Website Audit Tool - Technical Overview

A comprehensive website auditing system that combines **Lighthouse** (runtime browser testing) with **custom HTML/HTTP analysis** (static code analysis) to provide a complete picture of website performance, SEO, accessibility, and technical health.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Two-Layer Audit System](#two-layer-audit-system)
- [Layer 1: Lighthouse (Runtime Testing)](#layer-1-lighthouse-runtime-testing)
- [Layer 2: Custom HTML/HTTP Analysis](#layer-2-custom-htmlhttp-analysis)
- [Audit Flow](#audit-flow)
- [Why Both Layers Are Needed](#why-both-layers-are-needed)
- [Technology Stack](#technology-stack)
- [Example: How Metrics Are Captured](#example-how-metrics-are-captured)

---

## Architecture Overview

The audit system uses a **hybrid approach** combining two complementary methods:

```
┌─────────────────────────────────────────────────────────────┐
│                    Website Audit Process                     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌───────▼────────┐
            │   Layer 1:     │  │   Layer 2:     │
            │   Lighthouse   │  │ Custom HTML/   │
            │  (Runtime)     │  │ HTTP Checks    │
            │                │  │  (Static)      │
            └───────┬────────┘  └───────┬────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Score Calculation │
                    │  & Report Gen      │
                    └────────────────────┘
```

---

## Two-Layer Audit System

### Quick Comparison

| Aspect | Lighthouse | Custom HTML/HTTP Checks |
|--------|------------|------------------------|
| **Method** | Runtime browser testing | Static code analysis |
| **Tools** | Chrome DevTools Protocol, Headless Chrome | Axios (HTTP), Cheerio (DOM parsing) |
| **What It Tests** | Real user experience, performance, accessibility in actual browser | HTML structure, content quality, compliance, SEO elements |
| **Metrics** | Core Web Vitals, performance scores, accessibility violations | Meta tags, heading structure, content patterns, security headers |
| **Speed** | Slower (runs full page load) | Faster (parses HTML directly) |
| **Coverage** | ~100+ automated audits | ~60+ custom checks |

---

## Layer 1: Lighthouse (Runtime Testing)

### What is Lighthouse?

Lighthouse is Google's automated tool for improving web page quality. It runs inside Chrome DevTools Protocol using a **headless Chrome browser** to simulate real user interactions.

### How It Works in This Tool

```javascript
// Launch headless Chrome
const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless", "--no-sandbox", "--disable-setuid-sandbox"],
});

// Run Lighthouse audit
const runnerResult = await lighthouse(url, {
  logLevel: "info",
  output: "json",
  onlyCategories: ["performance", "accessibility", "seo", "best-practices"],
  port: chrome.port,
});
```

### What Lighthouse Measures

#### Performance Metrics (20+)
- **Core Web Vitals:**
  - **LCP** (Largest Contentful Paint) - Time to render largest content element
  - **CLS** (Cumulative Layout Shift) - Visual stability score
  - **INP** (Interaction to Next Paint) - Responsiveness metric
- **Additional Performance:**
  - First Contentful Paint (FCP)
  - Total Blocking Time (TBT)
  - Speed Index
  - Time to First Byte (TTFB)
  - Page weight (total bytes)
  - Number of HTTP requests
  - Render-blocking resources
  - Unused CSS/JavaScript

#### Accessibility (15+ checks)
- Color contrast ratios
- ARIA attribute correctness
- Keyboard navigation support
- Focus indicators
- Heading structure
- Image alt text presence
- Form labels
- Screen reader compatibility

#### SEO (25+ checks)
- Meta tag optimization
- Heading structure
- Link elements
- Mobile-friendly configuration
- Structured data validation

#### Best Practices (15+ checks)
- HTTPS usage
- Mixed content detection
- Console errors
- Security headers (CSP)
- Modern web standards compliance

### Advantages of Lighthouse

✅ **Real browser rendering** - Tests actual user experience
✅ **Performance metrics** - Measures real Core Web Vitals
✅ **Accessibility testing** - Uses axe-core rules
✅ **Automated** - Runs comprehensive checks without manual inspection
✅ **Industry standard** - Used by Google and web developers worldwide

### Limitations

❌ **Static content analysis** - Can't deeply analyze content quality
❌ **Business logic** - Doesn't check for compliance text (GDPR, privacy policies)
❌ **Content patterns** - Doesn't detect value propositions or CTAs semantically
❌ **Multiple page analysis** - Single page focus (doesn't crawl entire site)

---

## Layer 2: Custom HTML/HTTP Analysis

### What Are Custom Checks?

Custom checks use **Axios** to fetch HTML and **Cheerio** to parse and analyze the document structure, content, and HTTP headers. This provides static analysis that complements Lighthouse's runtime testing.

### How It Works

```javascript
// Step 1: Fetch HTML via HTTP
const response = await axios.get(url, {
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
});

// Step 2: Parse HTML with Cheerio (jQuery-like server-side)
const $ = cheerio.load(response.data);
const html = response.data;
const responseHeaders = response.headers;

// Step 3: Analyze structure, content, and headers
const checks = {
  // DOM queries
  title: {
    exists: $("title").length > 0,
    length: $("title").text().trim().length,
    optimal: $("title").text().trim().length >= 30 && <= 60,
  },

  // HTTP headers
  security: {
    https: url.startsWith("https://"),
    csp: responseHeaders["content-security-policy"] ? true : false,
    hsts: responseHeaders["strict-transport-security"] ? true : false,
  },

  // Content analysis (regex patterns)
  content: {
    hasPhone: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(html),
    hasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html),
  }
};
```

### What Custom Checks Measure

#### 1. HTML Structure Analysis (Cheerio DOM Queries)
- Title tag existence and length
- Meta description presence and optimization
- Heading hierarchy (H1-H6) validation
- Image alt text counting (missing, empty, present)
- Form structure and field validation
- Link structure and internal linking depth
- Canonical tag presence
- Structured data (Schema.org) detection

#### 2. HTTP Header Analysis (Axios Response Headers)
- Security headers:
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Frame-Options
  - X-Content-Type-Options
- HTTP status codes
- Redirect chains
- Server response times

#### 3. Content Quality Analysis (Regex Patterns)
- Word count and readability
- Value proposition detection (above fold)
- Call-to-action (CTA) identification
- Contact information detection:
  - Phone numbers (various formats)
  - Email addresses
  - Physical addresses
- Legal compliance text:
  - GDPR mentions
  - Cookie consent indicators
  - Privacy policy references
  - Terms of service references

#### 4. External Resource Validation (HTTP Requests)
- Sitemap.xml existence
- Robots.txt existence and validation
- Broken link checking (tests top 10 links)
- External resource validation

#### 5. Pattern Matching & Heuristics
- Schema.org structured data types (Organization, FAQ, Article, Product)
- Analytics tracking code detection (Google Analytics, Tag Manager)
- Cookie consent banner detection
- Mobile menu detection
- CMS fingerprinting (WordPress, Drupal, Joomla)

### Advantages of Custom Checks

✅ **Content analysis** - Understands business logic and compliance
✅ **SEO depth** - Checks meta tags, sitemaps, robots.txt in detail
✅ **Compliance** - Detects GDPR, privacy policies, legal requirements
✅ **Business metrics** - Identifies CTAs, value propositions, contact info
✅ **HTTP security** - Analyzes security headers that Lighthouse might miss
✅ **Faster** - Direct HTML parsing is quicker than full page load

### Limitations

❌ **No runtime behavior** - Can't test actual performance
❌ **Pattern matching** - Relies on regex, may have false positives/negatives
❌ **Static only** - Doesn't test JavaScript interactions
❌ **Single page** - Analyzes one page at a time

---

## Audit Flow

Here's the complete audit process:

```
1. User submits URL
   ↓
2. Create audit job (in-memory Map)
   ↓
3. Run Layer 1: Lighthouse (10-50% progress)
   ├── Launch headless Chrome
   ├── Load page and measure performance
   ├── Run accessibility audits
   ├── Check SEO elements
   └── Extract metrics
   ↓
4. Run Layer 2: Custom HTML/HTTP Checks (50-80% progress)
   ├── Fetch HTML with Axios
   ├── Parse with Cheerio
   ├── Analyze DOM structure
   ├── Check HTTP headers
   ├── Validate external resources (sitemap, robots.txt)
   ├── Test broken links
   └── Pattern matching for content/compliance
   ↓
5. Calculate Scores (80-90% progress)
   ├── Performance score (from Lighthouse)
   ├── SEO score (combined)
   ├── Accessibility score (combined)
   ├── Content score (custom checks)
   ├── Conversion score (custom checks)
   └── Overall weighted score
   ↓
6. Generate Report (90-100% progress)
   ├── Identify issues from both layers
   ├── Prioritize by impact
   ├── Generate fix recommendations
   ├── Create category breakdowns
   └── Prepare visualization data
   ↓
7. Return complete report
```

---

## Why Both Layers Are Needed

### Example Scenarios

#### Scenario 1: Meta Tags
- **Lighthouse**: Checks if meta tags exist and are properly formatted
- **Custom Checks**: Analyzes meta tag length, content quality, and SEO optimization

**Result**: Lighthouse might pass (tags exist), but custom checks flag that title is 10 characters (too short) or missing.

#### Scenario 2: Accessibility
- **Lighthouse**: Tests color contrast ratios using actual rendered colors
- **Custom Checks**: Counts images missing alt text by parsing HTML

**Result**: Both find different issues - Lighthouse catches contrast problems, custom checks catch missing alt attributes.

#### Scenario 3: Performance vs Content
- **Lighthouse**: Measures actual LCP performance (2.3 seconds)
- **Custom Checks**: Detects if page has thin content (< 300 words)

**Result**: Page might load fast (good performance) but have poor SEO due to thin content.

#### Scenario 4: Security
- **Lighthouse**: Detects HTTPS and mixed content warnings
- **Custom Checks**: Analyzes security headers (CSP, HSTS) from HTTP response

**Result**: Page might use HTTPS (Lighthouse passes) but miss critical security headers (custom checks catch).

#### Scenario 5: Business/Compliance
- **Lighthouse**: Can't check business logic
- **Custom Checks**: Detects GDPR compliance, cookie consent, privacy policies

**Result**: Technical audits pass, but legal compliance issues are flagged by custom checks.

---

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server framework
- **Chrome Launcher** - Launches headless Chrome for Lighthouse
- **Lighthouse** - Google's automated auditing tool
- **Axios** - HTTP client for fetching HTML and external resources
- **Cheerio** - Server-side jQuery implementation for HTML parsing

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

### Key Dependencies

```json
{
  "chrome-launcher": "^1.x",
  "lighthouse": "^11.x",
  "axios": "^1.x",
  "cheerio": "^1.x",
  "express": "^4.x",
  "cors": "^2.x"
}
```

---

## Example: How Metrics Are Captured

### Performance Example: LCP (Largest Contentful Paint)

**Lighthouse approach:**
```javascript
// Lighthouse runs actual browser, measures real rendering time
const lcp = lhr.audits["largest-contentful-paint"]?.numericValue || 0;
// Returns: 2340 (milliseconds)
```

**Why custom checks can't do this:**
- Requires actual browser rendering
- Needs to track when largest element becomes visible
- Measures real user experience

### SEO Example: Title Tag Optimization

**Custom checks approach:**
```javascript
// Cheerio parses HTML and checks title
const title = $("title").text().trim();
const titleLength = title.length;
const isOptimal = titleLength >= 30 && titleLength <= 60;

// Example result:
// exists: true
// length: 45
// optimal: true
// content: "Best Web Design Services | 2024"
```

**Why Lighthouse can't do this in detail:**
- Lighthouse checks if title exists
- Custom checks validate length, content quality, and SEO best practices

### Accessibility Example: Missing Alt Text

**Both layers check this:**

**Lighthouse:**
```javascript
// Uses axe-core rules, tests actual rendered images
const altTextIssues = lhr.audits["image-alt"]?.details?.items?.length || 0;
```

**Custom checks:**
```javascript
// Parses HTML and counts images
const images = {
  total: $("img").length,
  missingAlt: $("img:not([alt])").length,
  emptyAlt: $('img[alt=""]').length,
  withAlt: $("img[alt]").not('[alt=""]').length,
};
```

**Why both are useful:**
- Lighthouse might catch dynamic images loaded via JavaScript
- Custom checks provide exact counts and list which images are problematic

---

## Getting Started

### Prerequisites
- Node.js 18+
- Chrome/Chromium (for Lighthouse)

### Installation

```bash
# Install dependencies
cd sav2
npm install

# Run both server and client
npm run dev
```

### Usage

1. **Start the server** (runs on port 3001)
2. **Open client** (runs on port 5173)
3. **Submit a URL** to audit
4. **Wait for audit** (typically 30-60 seconds)
5. **View comprehensive report** with scores, issues, and recommendations

---

## Extending the Audit System

### Adding New Lighthouse Checks

Lighthouse automatically includes new audits in updates. To access new metrics:

```javascript
// In runLighthouse()
const newMetric = lhr.audits["new-lighthouse-audit"]?.numericValue || 0;
```

### Adding New Custom Checks

Add checks to `runHtmlChecks()` function:

```javascript
// Example: Check for specific meta tag
const customCheck = {
  myCustomMetric: {
    exists: $('meta[name="custom-meta"]').length > 0,
    content: $('meta[name="custom-meta"]').attr("content") || "",
  },
};
```

### Adding New Categories

1. Add checks in `runHtmlChecks()`
2. Add scoring in `scoringService.js`
3. Add issue generation in `generateReport()`
4. Update frontend to display new category

---

## Performance Considerations

- **Lighthouse audits** take 20-40 seconds (full page load)
- **Custom HTML checks** take 2-5 seconds (HTTP fetch + parsing)
- **Broken link checks** add 5-10 seconds (tests top 10 links)
- **Total audit time**: Typically 30-60 seconds per URL

### Optimization Tips

- Lighthouse runs are the bottleneck - consider caching results
- Broken link checks can be made optional or limited
- External resource checks (sitemap, robots.txt) are fast

---

## License

This is an internal tool for website auditing.

---

## Contributing

To add new audit checks:

1. Determine if it's a **runtime check** (Lighthouse) or **static check** (custom)
2. Add to appropriate layer in `auditService.js`
3. Update scoring in `scoringService.js`
4. Generate issues in `generateReport()`
5. Update frontend components to display new metrics

---

**Built with Lighthouse + Custom HTML/HTTP Analysis for comprehensive website auditing.**

