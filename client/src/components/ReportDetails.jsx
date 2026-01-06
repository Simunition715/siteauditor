import { useState } from 'react';
import {
  PerformanceIcon, MobileIcon, SEOIcon, ContentIcon, ConversionIcon, TrustIcon,
  AccessibilityIcon, TechnicalIcon, SecurityIcon, AnalyticsIcon, StructuredDataIcon,
  BrandingIcon, LegalIcon, GEOIcon, CelebrationIcon, CheckIcon, WarningIcon,
  LightbulbIcon, ChartIcon, TrophyIcon, RocketIcon, DocumentIcon
} from './Icons';
import Tooltip from './Tooltip';

function ReportDetails({ report, getScoreColor }) {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const getScoreGradient = (score) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 75) return 'from-blue-500 to-cyan-600';
    if (score >= 55) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const getCategoryIcon = (id) => {
    const icons = {
      performance: <PerformanceIcon className="w-6 h-6" />,
      mobile: <MobileIcon className="w-6 h-6" />,
      seo: <SEOIcon className="w-6 h-6" />,
      content: <ContentIcon className="w-6 h-6" />,
      conversion: <ConversionIcon className="w-6 h-6" />,
      trust: <TrustIcon className="w-6 h-6" />,
      accessibility: <AccessibilityIcon className="w-6 h-6" />,
      technical: <TechnicalIcon className="w-6 h-6" />,
      security: <SecurityIcon className="w-6 h-6" />,
      analytics: <AnalyticsIcon className="w-6 h-6" />,
      structuredData: <StructuredDataIcon className="w-6 h-6" />,
      branding: <BrandingIcon className="w-6 h-6" />,
      competitive: <TrophyIcon className="w-6 h-6" />,
      operational: <RocketIcon className="w-6 h-6" />,
      legal: <LegalIcon className="w-6 h-6" />,
      geo: <GEOIcon className="w-6 h-6" />,
    };
    return icons[id] || <DocumentIcon className="w-6 h-6" />;
  };

  const getCategoryDescription = (id) => {
    const descriptions = {
      performance: 'Measures page speed, Core Web Vitals (LCP, CLS, INP), page weight, number of requests, and render-blocking resources. Critical for user experience and SEO.',
      mobile: 'Assesses mobile responsiveness, viewport settings, tap target sizes, font readability, and mobile-specific features like click-to-call.',
      seo: 'Checks title tags, meta descriptions, heading structure, canonical tags, sitemaps, robots.txt, internal linking, and URL structure for search engine optimization.',
      content: 'Evaluates content quality, readability scores, content length, heading hierarchy, and content clarity. Helps ensure your message is clear and engaging.',
      conversion: 'Analyzes call-to-action visibility, form functionality, contact information accessibility, and page intent clarity. Essential for turning visitors into customers.',
      trust: 'Verifies SSL certificates, privacy policies, terms of service, cookie consent, physical address, phone numbers, testimonials, and case studies.',
      accessibility: 'Tests color contrast, alt text on images, form labels, ARIA attributes, keyboard navigation, and heading structure for WCAG compliance.',
      technical: 'Reviews code quality, console errors, redirect chains, cache headers, CDN usage, HTTP/2 support, and overall technical infrastructure health.',
      security: 'Checks HTTPS enforcement, security headers (CSP, HSTS), mixed content issues, and exposed admin/login paths to protect user data.',
      analytics: 'Verifies Google Analytics setup, Tag Manager implementation, conversion tracking, form tracking, and DataLayer configuration for data insights.',
      structuredData: 'Validates Schema.org markup, semantic HTML structure, and AI-readiness for better search engine understanding and future AI integration.',
      branding: 'Assesses value proposition clarity, messaging consistency, visual hierarchy, and logo placement for brand recognition and trust.',
      legal: 'Checks GDPR/CCPA compliance, cookie consent functionality, accessibility statements, and data collection transparency for legal requirements.',
      geo: 'Evaluates geolocation permissions, hreflang tags, language attributes, and geo-targeting elements for international and local SEO.',
      competitive: 'Analyzes differentiation clarity, unique selling propositions, and competitive positioning (informational metrics).',
      operational: 'Assesses CMS usability, content update ease, deployment pipeline, hosting scalability, and error monitoring (informational metrics).',
    };
    return descriptions[id] || 'Category description not available.';
  };

  const issuesByCategory = {
    performance: report.allIssues.filter(i => i.category === 'performance'),
    mobile: report.allIssues.filter(i => i.category === 'mobile'),
    seo: report.allIssues.filter(i => i.category === 'seo'),
    content: report.allIssues.filter(i => i.category === 'content'),
    conversion: report.allIssues.filter(i => i.category === 'conversion'),
    trust: report.allIssues.filter(i => i.category === 'trust'),
    accessibility: report.allIssues.filter(i => i.category === 'accessibility'),
    technical: report.allIssues.filter(i => i.category === 'technical'),
    security: report.allIssues.filter(i => i.category === 'security'),
    analytics: report.allIssues.filter(i => i.category === 'analytics'),
    structuredData: report.allIssues.filter(i => i.category === 'structuredData'),
    branding: report.allIssues.filter(i => i.category === 'branding'),
    competitive: report.allIssues.filter(i => i.category === 'competitive'),
    operational: report.allIssues.filter(i => i.category === 'operational'),
    legal: report.allIssues.filter(i => i.category === 'legal'),
    geo: report.allIssues.filter(i => i.category === 'geo')
  };

  const sections = [
    {
      id: 'performance',
      title: 'Performance & Core Web Vitals',
      score: report.categoryScores.performance,
      issues: issuesByCategory.performance,
      metrics: report.metrics?.performance
    },
    {
      id: 'mobile',
      title: 'Mobile Experience',
      score: report.categoryScores.mobile || 0,
      issues: issuesByCategory.mobile
    },
    {
      id: 'seo',
      title: 'SEO Fundamentals',
      score: report.categoryScores.seo,
      issues: issuesByCategory.seo
    },
    {
      id: 'content',
      title: 'Content Quality & Clarity',
      score: report.categoryScores.content || 0,
      issues: issuesByCategory.content
    },
    {
      id: 'conversion',
      title: 'Conversion Readiness',
      score: report.categoryScores.conversion || 0,
      issues: issuesByCategory.conversion
    },
    {
      id: 'trust',
      title: 'Trust & Credibility',
      score: report.categoryScores.trust,
      issues: issuesByCategory.trust
    },
    {
      id: 'accessibility',
      title: 'Accessibility (WCAG)',
      score: report.categoryScores.accessibility,
      issues: issuesByCategory.accessibility
    },
    {
      id: 'technical',
      title: 'Technical Health',
      score: report.categoryScores.technical || 0,
      issues: issuesByCategory.technical
    },
    {
      id: 'security',
      title: 'Security & Risk',
      score: report.categoryScores.security || 0,
      issues: issuesByCategory.security
    },
    {
      id: 'analytics',
      title: 'Analytics & Tracking',
      score: report.categoryScores.analytics || 0,
      issues: issuesByCategory.analytics
    },
    {
      id: 'structuredData',
      title: 'Structured Data & AI Readiness',
      score: report.categoryScores.structuredData || 0,
      issues: issuesByCategory.structuredData
    },
    {
      id: 'branding',
      title: 'Branding & Messaging',
      score: report.categoryScores.branding || 0,
      issues: issuesByCategory.branding
    },
    {
      id: 'competitive',
      title: 'Competitive Positioning',
      score: report.categoryScores.competitive || 0,
      issues: issuesByCategory.competitive
    },
    {
      id: 'operational',
      title: 'Operational Readiness',
      score: report.categoryScores.operational || 0,
      issues: issuesByCategory.operational
    },
    {
      id: 'legal',
      title: 'Legal & Compliance',
      score: report.categoryScores.legal || 0,
      issues: issuesByCategory.legal
    },
    {
      id: 'geo',
      title: 'GEO & Localization',
      score: report.categoryScores.geo || 0,
      issues: issuesByCategory.geo
    }
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const percentage = section.score || 0;
        const circumference = 2 * Math.PI * 20;
        const offset = circumference - (percentage / 100) * circumference;

        return (
          <div key={section.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center space-x-4 flex-1">
                <Tooltip content={getCategoryDescription(section.id)} position="top">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getScoreGradient(section.score)} flex items-center justify-center text-white shadow-md cursor-help`}>
                    {getCategoryIcon(section.id)}
                  </div>
                </Tooltip>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="flex items-center space-x-2">
                      <div className="relative w-10 h-10">
                        <svg className="transform -rotate-90 w-10 h-10">
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={`transition-all duration-1000 ${getScoreColor(section.score)}`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-bold ${getScoreColor(section.score)}`}>
                            {section.score}
                          </span>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${getScoreColor(section.score)}`}>
                        {section.score}/100
                      </span>
                    </div>
                    {section.issues.length > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        {section.issues.length} issue{section.issues.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <svg
                className={`w-6 h-6 text-gray-500 transform transition-transform duration-200 ${
                  openSection === section.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openSection === section.id && (
              <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
                {/* Metrics for Performance */}
                {section.id === 'performance' && section.metrics && (
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">LCP</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {section.metrics.lcp ? `${Math.round(section.metrics.lcp)}ms` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        {section.metrics.lcp && section.metrics.lcp < 2500 ? (
                          <><CheckIcon className="w-3 h-3 mr-1" /> Good</>
                        ) : (
                          <><WarningIcon className="w-3 h-3 mr-1" /> Needs work</>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">CLS</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {section.metrics.cls ? section.metrics.cls.toFixed(3) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        {section.metrics.cls && section.metrics.cls < 0.1 ? (
                          <><CheckIcon className="w-3 h-3 mr-1" /> Good</>
                        ) : (
                          <><WarningIcon className="w-3 h-3 mr-1" /> Needs work</>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Page Weight</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {report.metrics?.pageWeight ? `${(report.metrics.pageWeight / 1024 / 1024).toFixed(2)}MB` : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Issues */}
                {section.issues.length > 0 ? (
                  <div className="space-y-4">
                    {section.issues.map((issue, index) => (
                      <div key={index} className="bg-white rounded-lg border-l-4 border-blue-500 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${getScoreGradient(100)} flex items-center justify-center text-white text-sm font-bold`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-2 text-lg">{issue.title}</h4>
                            <p className="text-gray-600 text-sm mb-3 leading-relaxed">{issue.description}</p>
                            <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-400">
                              <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center">
                                <LightbulbIcon className="w-3 h-3 mr-1" /> How to fix:
                              </p>
                              <p className="text-sm text-blue-800">{issue.fix}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                issue.impact === 'High' ? 'bg-red-100 text-red-800 border border-red-200' :
                                issue.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {issue.impact} Impact
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                issue.difficulty === 'Easy' ? 'bg-green-100 text-green-800 border border-green-200' :
                                issue.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {issue.difficulty}
                              </span>
                              {issue.estimatedImpact && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 flex items-center">
                                  <ChartIcon className="w-3 h-3 mr-1" /> {issue.estimatedImpact}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-blue-300">
                    {section.score >= 90 ? (
                      <>
                        <div className="mb-4 flex justify-center">
                          <CelebrationIcon className="w-16 h-16 text-green-500" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mb-2">Excellent! No critical issues found.</p>
                        <p className="text-gray-600">This category is performing well.</p>
                      </>
                    ) : section.score >= 75 ? (
                      <>
                        <div className="mb-4 flex justify-center">
                          <CheckIcon className="w-16 h-16 text-blue-500" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mb-2">Good performance, but room for improvement</p>
                        <p className="text-gray-600 mb-4">
                          Your score is {section.score}/100. While there are no critical issues, there may be optimization opportunities to reach 90+.
                        </p>
                        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto border border-blue-200">
                          <p className="text-sm text-blue-800 flex items-start">
                            <LightbulbIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                            <span><strong>Tip:</strong> Review the metrics above for sub-optimal values. Even small improvements can boost your score.</span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-4 flex justify-center">
                          <WarningIcon className="w-16 h-16 text-yellow-500" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mb-2">Score: {section.score}/100 - Needs Attention</p>
                        <p className="text-gray-600 mb-4">
                          While no specific issues were flagged, your score indicates there are areas that need improvement.
                        </p>
                        <div className="bg-yellow-50 rounded-lg p-4 max-w-md mx-auto border border-yellow-200">
                          <p className="text-sm text-yellow-800 flex items-start">
                            <LightbulbIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                            <span><strong>Recommendation:</strong> Review the metrics and consider a deeper audit to identify optimization opportunities.</span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ReportDetails;
