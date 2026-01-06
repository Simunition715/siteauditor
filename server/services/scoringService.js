function calculateScores(lighthouseResults, htmlChecks) {
  // Calculate scores for all 15 categories
  const scores = {
    performance: calculatePerformanceScore(lighthouseResults, htmlChecks),
    mobile: calculateMobileScore(lighthouseResults, htmlChecks),
    seo: calculateSEOScore(lighthouseResults, htmlChecks),
    content: calculateContentScore(htmlChecks),
    conversion: calculateConversionScore(htmlChecks),
    trust: calculateTrustScore(htmlChecks),
    accessibility: calculateAccessibilityScore(lighthouseResults, htmlChecks),
    technical: calculateTechnicalScore(lighthouseResults, htmlChecks),
    security: calculateSecurityScore(lighthouseResults, htmlChecks),
    analytics: calculateAnalyticsScore(htmlChecks),
    structuredData: calculateStructuredDataScore(htmlChecks),
    branding: calculateBrandingScore(htmlChecks),
    competitive: calculateCompetitiveScore(htmlChecks),
    operational: calculateOperationalScore(htmlChecks),
    legal: calculateLegalScore(htmlChecks),
    geo: calculateGEOScore(lighthouseResults, htmlChecks),
  };

  // Weighted overall score (prioritizing high-impact categories)
  const overall = Math.round(
    scores.performance * 0.2 + // Performance is critical
      scores.mobile * 0.15 + // Mobile is primary traffic
      scores.seo * 0.12 + // SEO drives traffic
      scores.conversion * 0.1 + // Conversion drives revenue
      scores.trust * 0.08 + // Trust builds credibility
      scores.accessibility * 0.08 + // Accessibility is important
      scores.technical * 0.06 + // Technical health
      scores.security * 0.06 + // Security is critical
      scores.content * 0.05 + // Content quality
      scores.analytics * 0.03 + // Analytics tracking
      scores.structuredData * 0.03 + // AI/SEO readiness
      scores.branding * 0.02 + // Branding consistency
      scores.legal * 0.01 + // Legal compliance
      scores.geo * 0.01 + // GEO targeting
      scores.competitive * 0.0 + // Competitive (informational)
      scores.operational * 0.0 // Operational (informational)
  );

  // Determine grade
  let grade;
  if (overall >= 90) {
    grade = "Excellent";
  } else if (overall >= 75) {
    grade = "Good";
  } else if (overall >= 55) {
    grade = "Needs Work";
  } else {
    grade = "High Risk";
  }

  return {
    overall,
    grade,
    ...scores,
  };
}

function calculatePerformanceScore(lighthouseResults, htmlChecks) {
  let score = lighthouseResults.performance?.score || 0;

  // Deduct points for large page weight
  if (lighthouseResults.pageWeight > 3 * 1024 * 1024) {
    score -= 20;
  } else if (lighthouseResults.pageWeight > 2 * 1024 * 1024) {
    score -= 10;
  }

  // Deduct points for too many requests
  if (lighthouseResults.requests > 100) {
    score -= 10;
  } else if (lighthouseResults.requests > 50) {
    score -= 5;
  }

  // Deduct for render-blocking resources
  if (lighthouseResults.performance?.renderBlockingResources > 5) {
    score -= 10;
  } else if (lighthouseResults.performance?.renderBlockingResources > 2) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateMobileScore(lighthouseResults, htmlChecks) {
  let score = 100;

  // Viewport meta tag
  if (!htmlChecks.mobile?.viewport?.exists) {
    score -= 30;
  } else if (htmlChecks.mobile?.viewport?.hasUserScalable === false) {
    score -= 10; // user-scalable=no is bad for accessibility
  }

  // Tap target spacing (heuristic)
  if (htmlChecks.mobile?.tapTargets?.smallButtons > 5) {
    score -= 10;
  }

  // Font sizes
  if (htmlChecks.mobile?.fontSizes?.smallFonts > 10) {
    score -= 10;
  }

  // Sticky elements blocking content
  if (htmlChecks.mobile?.stickyElements > 3) {
    score -= 5;
  }

  // Click-to-call/email
  if (!htmlChecks.mobile?.clickToCall && !htmlChecks.mobile?.clickToEmail) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateSEOScore(lighthouseResults, htmlChecks) {
  let score = lighthouseResults.seo?.score || 0;
  let deductions = 0;

  // Title tag
  if (!htmlChecks.title?.exists) {
    deductions += 20;
  } else if (!htmlChecks.title?.optimal) {
    deductions += 10;
  }

  // Meta description
  if (!htmlChecks.metaDescription?.exists) {
    deductions += 15;
  } else if (!htmlChecks.metaDescription?.optimal) {
    deductions += 5;
  }

  // H1
  if (htmlChecks.h1?.count === 0) {
    deductions += 15;
  } else if (htmlChecks.h1?.count > 1) {
    deductions += 10;
  }

  // Robots noindex
  if (htmlChecks.robots?.hasNoindex) {
    deductions += 30;
  }

  // Canonical
  if (!htmlChecks.canonical?.exists) {
    deductions += 5;
  }

  // Sitemap
  if (!htmlChecks.sitemap?.exists) {
    deductions += 5;
  }

  // Robots.txt
  if (!htmlChecks.robotsTxt?.exists) {
    deductions += 5;
  } else if (!htmlChecks.robotsTxt?.valid) {
    deductions += 2;
  }

  // Heading hierarchy
  if (!htmlChecks.headingHierarchy?.isValid) {
    deductions += 10;
  }

  // Internal linking depth
  if (htmlChecks.internalLinking?.maxDepth > 4) {
    deductions += 5;
  }

  // Broken links
  if (htmlChecks.brokenLinks?.length > 0) {
    deductions += Math.min(10, htmlChecks.brokenLinks.length * 2);
  }

  // URL structure
  if (htmlChecks.technical?.urlStructure?.depth > 4) {
    deductions += 5;
  }

  // Duplicate meta tags
  if (htmlChecks.technical?.duplicateMeta?.titles > 1) {
    deductions += 10;
  }
  if (htmlChecks.technical?.duplicateMeta?.descriptions > 1) {
    deductions += 10;
  }

  return Math.max(0, Math.min(100, score - deductions));
}

function calculateContentScore(htmlChecks) {
  let score = 100;

  // Content length (heuristic)
  if (htmlChecks.content?.readability?.wordCount < 300) {
    score -= 20; // Thin content
  } else if (htmlChecks.content?.readability?.wordCount < 500) {
    score -= 10;
  }

  // Heading hierarchy
  if (htmlChecks.content?.headings?.h1 === 0) {
    score -= 15;
  }
  if (htmlChecks.content?.headings?.h1 > 1) {
    score -= 10;
  }

  // Above-the-fold messaging
  if (!htmlChecks.content?.aboveFold?.hasValueProp) {
    score -= 10;
  }
  if (!htmlChecks.content?.aboveFold?.hasCTA) {
    score -= 5;
  }

  // About page / author attribution
  if (
    !htmlChecks.content?.aboutPage &&
    !htmlChecks.content?.authorAttribution
  ) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateConversionScore(htmlChecks) {
  let score = 100;

  // Primary CTA
  if (!htmlChecks.conversion?.cta?.primary?.exists) {
    score -= 25;
  } else if (!htmlChecks.conversion?.cta?.primary?.aboveFold) {
    score -= 10;
  }

  // Multiple competing CTAs
  if (htmlChecks.conversion?.cta?.primary?.count > 5) {
    score -= 10;
  }

  // Forms
  if (htmlChecks.conversion?.forms?.count === 0) {
    score -= 15;
  } else if (htmlChecks.conversion?.forms?.fieldCount > 10) {
    score -= 5; // Too many fields can hurt conversion
  }

  // Form error handling
  if (htmlChecks.conversion?.forms?.count > 0) {
    if (
      !htmlChecks.conversion.forms.errorHandling?.hasErrorMessages &&
      !htmlChecks.conversion.forms.errorHandling?.hasAriaInvalid
    ) {
      score -= 10;
    }
    if (!htmlChecks.conversion.forms.confirmationFeedback) {
      score -= 5;
    }
  }

  // Contact info
  if (
    !htmlChecks.conversion?.contactInfo?.phone &&
    !htmlChecks.conversion?.contactInfo?.email
  ) {
    score -= 20;
  }

  // Clickable contact info on mobile
  if (
    !htmlChecks.conversion?.contactInfo?.clickablePhone &&
    !htmlChecks.conversion?.contactInfo?.clickableEmail
  ) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateTrustScore(htmlChecks) {
  let score = 100;

  // SSL
  if (!htmlChecks.trust?.ssl) {
    score -= 40;
  }

  // Privacy policy
  if (!htmlChecks.trust?.privacyPolicy) {
    score -= 15;
  }

  // Terms of service
  if (!htmlChecks.trust?.termsOfService) {
    score -= 10;
  }

  // Cookie consent
  if (!htmlChecks.trust?.cookieConsent) {
    score -= 10;
  }

  // Physical address
  if (!htmlChecks.trust?.physicalAddress) {
    score -= 10;
  }

  // Phone number
  if (!htmlChecks.trust?.phoneNumber) {
    score -= 5;
  }

  // Social proof
  if (!htmlChecks.trust?.testimonials && !htmlChecks.trust?.caseStudies) {
    score -= 5;
  }

  // Contact page
  if (!htmlChecks.trust?.contactPage) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateAccessibilityScore(lighthouseResults, htmlChecks) {
  let score = lighthouseResults.accessibility?.score || 0;

  // Missing alt text
  if (htmlChecks.images?.total > 0) {
    const missingAltRatio =
      htmlChecks.images.missingAlt / htmlChecks.images.total;
    score -= Math.round(missingAltRatio * 20);
  }

  // Additional accessibility checks from Lighthouse
  if (lighthouseResults.accessibility?.colorContrast > 0) {
    score -= Math.min(10, lighthouseResults.accessibility.colorContrast);
  }

  // Accessible error messages
  if (htmlChecks.accessibility?.accessibleErrorMessages) {
    if (
      !htmlChecks.accessibility.accessibleErrorMessages.hasAriaLive &&
      !htmlChecks.accessibility.accessibleErrorMessages.hasRoleAlert
    ) {
      score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

function calculateTechnicalScore(lighthouseResults, htmlChecks) {
  let score = 100;

  // Console errors
  if (htmlChecks.technical?.consoleErrors > 5) {
    score -= 20;
  } else if (htmlChecks.technical?.consoleErrors > 0) {
    score -= 10;
  }

  // Redirects
  if (htmlChecks.technical?.redirects?.isRedirect) {
    score -= 10;
  }

  // Canonical conflicts
  if (htmlChecks.technical?.canonicalConflicts) {
    score -= 15;
  }

  // HTTP/2 or HTTP/3
  if (!lighthouseResults.bestPractices?.http2) {
    score -= 10;
  }

  // Cache headers
  if (lighthouseResults.bestPractices?.cacheHeaders > 10) {
    score -= 10;
  }

  // Compression
  if (lighthouseResults.bestPractices?.compression > 5) {
    score -= 10;
  }

  // CDN
  if (!htmlChecks.technical?.cdn?.hasCDN) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateSecurityScore(lighthouseResults, htmlChecks) {
  let score = 100;

  // HTTPS
  if (!htmlChecks.security?.https) {
    score -= 40;
  }

  // Mixed content
  if (htmlChecks.security?.mixedContent > 0) {
    score -= 20;
  }

  // Security headers
  if (!htmlChecks.security?.securityHeaders?.csp) {
    score -= 15;
  }
  if (!htmlChecks.security?.securityHeaders?.hsts) {
    score -= 10;
  }
  if (!htmlChecks.security?.securityHeaders?.xFrameOptions) {
    score -= 10;
  }
  if (!htmlChecks.security?.securityHeaders?.xContentTypeOptions) {
    score -= 5;
  }

  // Exposed admin/login paths
  if (
    htmlChecks.security?.exposedPaths?.admin ||
    htmlChecks.security?.exposedPaths?.login
  ) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateAnalyticsScore(htmlChecks) {
  let score = 100;

  // Analytics present
  if (
    !htmlChecks.analytics?.googleAnalytics &&
    !htmlChecks.analytics?.tagManager
  ) {
    score -= 30;
  }

  // Duplicate trackers
  if (htmlChecks.analytics?.duplicateTrackers > 1) {
    score -= 15;
  }

  // DataLayer
  if (htmlChecks.analytics?.tagManager && !htmlChecks.analytics?.dataLayer) {
    score -= 10;
  }

  // Conversion events
  if (!htmlChecks.analytics?.conversionEvents) {
    score -= 10;
  }

  // Form tracking
  if (
    htmlChecks.analytics?.forms?.count > 0 &&
    !htmlChecks.analytics?.formTracking
  ) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateStructuredDataScore(htmlChecks) {
  let score = 100;

  // Structured data present
  if (!htmlChecks.structuredData?.present) {
    score -= 30;
  }

  // Organization schema
  if (!htmlChecks.structuredData?.schemas?.organization) {
    score -= 15;
  }

  // Content chunking for AI
  if (!htmlChecks.structuredData?.contentChunking?.hasSections) {
    score -= 10;
  }

  // Semantic headings
  if (!htmlChecks.structuredData?.semanticHeadings) {
    score -= 10;
  }

  // Answer-ready content
  if (!htmlChecks.structuredData?.answerReady?.hasFAQ) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateBrandingScore(htmlChecks) {
  let score = 100;

  // Value proposition
  if (!htmlChecks.branding?.valueProposition?.clear) {
    score -= 20;
  }

  // Logo presence
  if (!htmlChecks.branding?.logo?.present) {
    score -= 15;
  } else if (!htmlChecks.branding?.logo?.inHeader) {
    score -= 5;
  }

  // Visual hierarchy
  if (!htmlChecks.branding?.visualHierarchy?.hasHeadings) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateCompetitiveScore(htmlChecks) {
  // Informational score (not weighted in overall)
  let score = 100;

  if (!htmlChecks.competitive?.differentiation) {
    score -= 20;
  }

  if (!htmlChecks.competitive?.features) {
    score -= 15;
  }

  if (!htmlChecks.competitive?.pricing) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateOperationalScore(htmlChecks) {
  // Informational score (not weighted in overall)
  let score = 100;

  if (!htmlChecks.operational?.hostingScalability?.hasCDN) {
    score -= 15;
  }

  if (!htmlChecks.operational?.errorMonitoring) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateLegalScore(htmlChecks) {
  let score = 100;

  // GDPR
  if (!htmlChecks.legal?.gdpr) {
    score -= 20;
  }

  // Cookie consent
  if (!htmlChecks.legal?.cookieConsent) {
    score -= 20;
  }

  // Privacy policy
  if (!htmlChecks.legal?.dataCollection) {
    score -= 15;
  }

  // Accessibility statement
  if (!htmlChecks.legal?.accessibilityStatement) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateGEOScore(lighthouseResults, htmlChecks) {
  let score = 100;

  // Geolocation permission request (bad practice)
  if (htmlChecks.geo?.geolocationPermission) {
    score -= 20;
  }

  // Missing language attribute
  if (!htmlChecks.geo?.language?.hasValidLang) {
    score -= 15;
  }

  // Missing hreflang for international sites
  const hasMultipleLangIndicators =
    htmlChecks.geo?.language?.htmlLang &&
    (htmlChecks.geo?.hreflang?.count > 0 || htmlChecks.geo?.geoMeta?.geoRegion);
  if (hasMultipleLangIndicators && !htmlChecks.geo?.hreflang?.exists) {
    score -= 10;
  }

  // Invalid locale format
  if (
    htmlChecks.geo?.language?.htmlLang &&
    !htmlChecks.geo?.cldr?.hasLocale &&
    htmlChecks.geo?.language?.htmlLang.length > 2
  ) {
    score -= 5;
  }

  // Missing hreflang x-default
  if (htmlChecks.geo?.hreflang?.exists) {
    const hasXDefault = htmlChecks.geo.hreflang.tags.some(
      (tag) => tag.lang === "x-default"
    );
    if (!hasXDefault) {
      score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

module.exports = {
  calculateScores,
};
