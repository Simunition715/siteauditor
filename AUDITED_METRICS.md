# Audited Metrics Overview

This document lists all metrics and checks performed by the website audit tool.

## Summary
- **Lighthouse Audits**: ~100+ automated checks (performance, accessibility, SEO, best practices)
- **Custom HTML Checks**: 60+ specific checks across 15 categories
- **Total Metrics Tracked**: 160+ individual metrics

---

## 1. Performance & Core Web Vitals (20+ metrics)

### Lighthouse Performance Metrics:
- **LCP** (Largest Contentful Paint) - Time to render largest content element
- **CLS** (Cumulative Layout Shift) - Visual stability score
- **INP** (Interaction to Next Paint) - Responsiveness metric
- **FCP** (First Contentful Paint) - Time to first content render
- **Total Blocking Time** (TBT) - Main thread blocking time
- **Speed Index** - How quickly content is visually displayed
- **TTFB** (Time to First Byte) - Server response time
- **Performance Score** - Overall performance score (0-100)

### Resource Optimization:
- Render-blocking resources count
- Unused CSS bytes
- Unused JavaScript bytes
- Image sizing issues count
- Modern image formats (WebP) usage
- Font display optimization
- Lazy-loadable images count
- **Page Weight** (total bytes)
- **Total HTTP Requests** count

---

## 2. Mobile Experience (8+ metrics)

- Viewport meta tag presence
- Tap target size (buttons/links < 44x44px)
- Font size readability (< 12px elements)
- Click-to-call links
- Mobile-specific features

---

## 3. SEO Fundamentals (15+ metrics)

### On-Page SEO:
- Title tag (existence, length, optimal length 30-60 chars)
- Meta description (existence, length, optimal 120-160 chars)
- H1 tag (count, should be exactly 1)
- Heading hierarchy (H1-H6 order validation)
- Canonical tag presence
- Robots meta tags (noindex/nofollow flags)
- Internal linking depth
- URL structure

### Technical SEO:
- Sitemap.xml presence
- Robots.txt presence
- Broken links count (checks top 10 links)
- Structured data presence

---

## 4. Content Quality & Clarity (6+ metrics)

- Word count
- Readability score (Flesch reading ease)
- Value proposition clarity (above fold)
- Content length assessment
- Heading structure quality

---

## 5. Conversion Readiness (8+ metrics)

- Primary CTA presence
- CTA above fold visibility
- Contact form presence
- Form error handling
- Form confirmation feedback
- Contact information visibility (email, phone, address)
- Page intent clarity

---

## 6. Trust & Credibility Signals (10+ metrics)

- SSL/HTTPS certificate
- Privacy policy presence
- Terms of service presence
- Cookie consent banner
- Physical address display
- Phone number display
- Email contact display
- Testimonials presence
- Case studies presence

---

## 7. Accessibility (WCAG Basics) (15+ metrics)

### Lighthouse Accessibility:
- Accessibility score (0-100)
- Color contrast issues count
- Missing alt text count
- Form label issues count
- ARIA attribute issues count
- Keyboard navigation issues
- Focus indicator issues
- Heading structure issues
- Landmarks usage
- Skip links presence

### Custom Checks:
- Accessible error messages (aria-live, role="alert")
- Alt text on images (missing, empty, present counts)

---

## 8. Technical Health & Code Quality (12+ metrics)

- JavaScript console errors count
- Redirect chains
- Canonical tag conflicts
- HTTP/2 support
- Cache headers (long cache TTL)
- CDN usage
- Compression usage
- Code quality indicators
- Document.write usage

---

## 9. Security & Risk (10+ metrics)

- HTTPS enforcement
- Mixed content issues count
- Security headers:
  - Content Security Policy (CSP)
  - HSTS (HTTP Strict Transport Security)
  - X-Frame-Options
  - X-Content-Type-Options
- Exposed admin/login paths
- SSL certificate validity

---

## 10. Analytics & Tracking Readiness (5+ metrics)

- Google Analytics presence (GA4, Universal Analytics)
- Google Tag Manager presence
- Conversion tracking setup
- Form tracking
- DataLayer configuration

---

## 11. Structured Data & AI Readiness (8+ metrics)

- Structured data presence (Schema.org)
- Organization schema
- Schema types detected
- Semantic HTML structure
- JSON-LD format
- Microdata presence
- RDFa presence

---

## 12. Branding & Messaging Consistency (4+ metrics)

- Value proposition clarity
- Messaging consistency
- Visual hierarchy
- Logo placement

---

## 13. Competitive Positioning (Informational)

- Differentiation clarity
- Unique selling propositions
- Competitive analysis data

---

## 14. Operational Readiness (Informational)

- CMS usability
- Content update ease
- Deployment pipeline
- Hosting scalability
- Error monitoring

---

## 15. Legal & Compliance (6+ metrics)

- GDPR compliance indicators
- Cookie consent functionality
- Privacy policy presence
- Terms of service presence
- Accessibility statement
- Data collection transparency

---

## 16. GEO & Localization (8+ metrics)

- Geolocation permission on page load
- Language attribute (lang) presence
- hreflang tags presence and validity
- x-default hreflang tag
- Geo-targeting meta tags
- Locale format validation
- CLDR locale support

---

## Issue Generation Logic

The audit tool generates specific issues based on:
- **Threshold violations** (e.g., LCP > 2.5s, page weight > 2MB)
- **Missing elements** (e.g., no title tag, no SSL)
- **Best practice violations** (e.g., multiple H1 tags, missing alt text)
- **Sub-optimal configurations** (e.g., LCP 2.0-2.5s gets optimization suggestion)

Each issue includes:
- Category classification
- Impact level (High/Medium/Low)
- Difficulty to fix (Easy/Medium/Hard)
- Specific fix instructions
- Estimated impact if fixed

---

## Scoring System

Scores are calculated per category (0-100) and weighted:
- Performance: 20%
- Mobile: 15%
- SEO: 12%
- Content: 5%
- Conversion: 10%
- Trust: 8%
- Accessibility: 8%
- Technical: 6%
- Security: 6%
- Analytics: 3%
- Structured Data: 3%
- Branding: 2%
- Legal: 1%
- GEO: 1%

Overall score is a weighted average, with grade classification:
- 90-100: Excellent
- 75-89: Good
- 55-74: Needs Work
- <55: High Risk

