import { useState } from 'react';
import {
  PerformanceIcon, MobileIcon, SEOIcon, ContentIcon, ConversionIcon, TrustIcon,
  AccessibilityIcon, TechnicalIcon, SecurityIcon, AnalyticsIcon, StructuredDataIcon,
  BrandingIcon, LegalIcon, GEOIcon, CelebrationIcon, CheckIcon, WarningIcon,
  LightbulbIcon, ChartIcon, LinkIcon, ImageIcon, DocumentIcon, CloseIcon
} from './Icons';
import Tooltip from './Tooltip';
import CompetitorComparison from './CompetitorComparison';

function ReportSummary({ report, getScoreColor, getGradeColor }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStat, setSelectedStat] = useState(null);

  const getScoreGradient = (score) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 75) return 'from-blue-500 to-cyan-600';
    if (score >= 55) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 75) return 'bg-blue-50 border-blue-200';
    if (score >= 55) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
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
      legal: <LegalIcon className="w-6 h-6" />,
      geo: <GEOIcon className="w-6 h-6" />,
    };
    return icons[id] || <DocumentIcon className="w-6 h-6" />;
  };

  const getCategoryTitle = (id) => {
    const titles = {
      performance: 'Performance & Core Web Vitals',
      mobile: 'Mobile Experience',
      seo: 'SEO Fundamentals',
      content: 'Content Quality & Clarity',
      conversion: 'Conversion Readiness',
      trust: 'Trust & Credibility Signals',
      accessibility: 'Accessibility (WCAG Basics)',
      technical: 'Technical Health & Code Quality',
      security: 'Security & Risk',
      analytics: 'Analytics & Tracking Readiness',
      structuredData: 'Structured Data & AI Readiness',
      branding: 'Branding & Messaging Consistency',
      legal: 'Legal & Compliance',
      geo: 'GEO & Localization',
    };
    return titles[id] || id;
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
    };
    return descriptions[id] || 'Category description not available.';
  };

  const CategoryCard = ({ id, name, score, weight, onClick }) => {
    const percentage = score || 0;
    const circumference = 2 * Math.PI * 36; // radius = 36
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <button
        onClick={onClick}
        className={`relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 ${getScoreBg(score)} overflow-hidden group cursor-pointer text-left w-full`}
      >
        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getScoreGradient(score)} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Tooltip content={getCategoryDescription(id)} position="top">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getScoreGradient(score)} flex items-center justify-center text-white shadow-md cursor-help`}>
                  {getCategoryIcon(id)}
                </div>
              </Tooltip>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
                <p className="text-xs text-gray-500">{weight}% weight</p>
              </div>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-24 h-24">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ${getScoreColor(score)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getScoreGradient(score)} transition-all duration-1000 ease-out rounded-full`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

          {/* Click hint */}
          <div className="mt-3 text-xs text-gray-500 text-center opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view details →
          </div>
        </div>
      </button>
    );
  };

  const categories = [
    { id: 'performance', name: 'Performance', score: report.categoryScores.performance, weight: 20 },
    { id: 'mobile', name: 'Mobile', score: report.categoryScores.mobile || 0, weight: 15 },
    { id: 'seo', name: 'SEO', score: report.categoryScores.seo, weight: 12 },
    { id: 'content', name: 'Content', score: report.categoryScores.content || 0, weight: 5 },
    { id: 'conversion', name: 'Conversion', score: report.categoryScores.conversion || 0, weight: 10 },
    { id: 'trust', name: 'Trust', score: report.categoryScores.trust, weight: 8 },
    { id: 'accessibility', name: 'Accessibility', score: report.categoryScores.accessibility, weight: 8 },
    { id: 'technical', name: 'Technical', score: report.categoryScores.technical || 0, weight: 6 },
    { id: 'security', name: 'Security', score: report.categoryScores.security || 0, weight: 6 },
    { id: 'analytics', name: 'Analytics', score: report.categoryScores.analytics || 0, weight: 3 },
    { id: 'structuredData', name: 'Structured Data', score: report.categoryScores.structuredData || 0, weight: 3 },
    { id: 'branding', name: 'Branding', score: report.categoryScores.branding || 0, weight: 2 },
    { id: 'legal', name: 'Legal', score: report.categoryScores.legal || 0, weight: 1 },
    { id: 'geo', name: 'GEO', score: report.categoryScores.geo || 0, weight: 1 },
  ];

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
    legal: report.allIssues.filter(i => i.category === 'legal'),
    geo: report.allIssues.filter(i => i.category === 'geo')
  };

  const selectedCategoryData = selectedCategory ? categories.find(c => c.id === selectedCategory) : null;
  const selectedIssues = selectedCategory ? issuesByCategory[selectedCategory] || [] : [];
  const selectedScore = selectedCategoryData?.score || 0;
  const percentage = selectedScore;
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (percentage / 100) * circumference;

  const overallCircumference = 2 * Math.PI * 80;
  const overallOffset = overallCircumference - (report.overallScore / 100) * overallCircumference;

  return (
    <div className="space-y-8">
      {/* Overall Score - Hero Section */}
      <div className={`relative bg-gradient-to-br ${getScoreGradient(report.overallScore)} rounded-2xl shadow-2xl p-8 text-white overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative text-center">
          <div className="mb-6">
            <span className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Overall Score
            </span>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-white/20"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={overallCircumference}
                  strokeDashoffset={overallOffset}
                  strokeLinecap="round"
                  className="text-white transition-all duration-2000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-bold mb-1">{report.overallScore}</span>
                <span className="text-2xl text-white/80">/ 100</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${getGradeColor(report.grade)} shadow-lg`}>
              {report.grade}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
            <button
              onClick={() => setSelectedStat('totalIssues')}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="text-2xl font-bold">{report.allIssues?.length || 0}</div>
              <div className="text-xs text-white/80">Total Issues</div>
            </button>
            <button
              onClick={() => setSelectedStat('highPriority')}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="text-2xl font-bold">{report.topFixes?.length || 0}</div>
              <div className="text-xs text-white/80">High Priority</div>
            </button>
            <button
              onClick={() => setSelectedStat('passing')}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="text-2xl font-bold">
                {categories.filter(c => c.score >= 75).length}
              </div>
              <div className="text-xs text-white/80">Passing</div>
            </button>
          </div>
        </div>
      </div>

      {/* Category Scores and Comparison - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Category Breakdown */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></span>
            Category Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                score={category.score}
                weight={category.weight}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Competitor Comparison */}
        <div>
          <CompetitorComparison currentReport={report} />
        </div>
      </div>

      {/* Stat Detail Modal */}
      {selectedStat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStat(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white">
              <button
                onClick={() => setSelectedStat(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-3xl font-bold mb-2">
                {selectedStat === 'totalIssues' && 'All Issues'}
                {selectedStat === 'highPriority' && 'High Priority Issues'}
                {selectedStat === 'passing' && 'Passing Categories'}
              </h2>
              <p className="text-white/90">
                {selectedStat === 'totalIssues' && `Showing all ${report.allIssues?.length || 0} issues found across all categories`}
                {selectedStat === 'highPriority' && `Showing ${report.topFixes?.length || 0} high-impact issues that need immediate attention`}
                {selectedStat === 'passing' && `Showing ${categories.filter(c => c.score >= 75).length} categories that are performing well (score ≥ 75)`}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {selectedStat === 'totalIssues' && (
                <div className="space-y-4">
                  {report.allIssues && report.allIssues.length > 0 ? (
                    report.allIssues.map((issue, index) => (
                      <div key={index} className="bg-white rounded-lg border-l-4 border-blue-500 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${getScoreGradient(100)} flex items-center justify-center text-white text-sm font-bold`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900 text-lg">{issue.title}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                                {issue.category}
                              </span>
                            </div>
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
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-green-300">
                      <CelebrationIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">No Issues Found!</p>
                      <p className="text-gray-600">Your website is performing excellently across all categories.</p>
                    </div>
                  )}
                </div>
              )}

              {selectedStat === 'highPriority' && (
                <div className="space-y-4">
                  {report.topFixes && report.topFixes.length > 0 ? (
                    report.topFixes.map((fix, index) => (
                      <div key={index} className="bg-white rounded-lg border-l-4 border-red-500 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getScoreGradient(100 - (index * 10))} flex items-center justify-center text-white font-bold shadow-md`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900 text-lg">{fix.title}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 capitalize">
                                {fix.category}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 leading-relaxed">{fix.description}</p>
                            {fix.estimatedImpact && (
                              <div className="mb-3 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                                <p className="text-xs text-blue-800 font-medium flex items-center">
                                  <LightbulbIcon className="w-3 h-3 mr-1" /> {fix.estimatedImpact}
                                </p>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                fix.impact === 'High' ? 'bg-red-100 text-red-800 border border-red-200' :
                                fix.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {fix.impact} Impact
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                fix.difficulty === 'Easy' ? 'bg-green-100 text-green-800 border border-green-200' :
                                fix.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {fix.difficulty}
                              </span>
                            </div>
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-1">How to fix:</p>
                              <p className="text-sm text-gray-600">{fix.fix}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-green-300">
                      <CelebrationIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">No High Priority Issues!</p>
                      <p className="text-gray-600">All identified issues have been addressed or are low priority.</p>
                    </div>
                  )}
                </div>
              )}

              {selectedStat === 'passing' && (
                <div className="space-y-4">
                  {categories.filter(c => c.score >= 75).length > 0 ? (
                    categories
                      .filter(c => c.score >= 75)
                      .map((category) => {
                        const percentage = category.score || 0;
                        const circumference = 2 * Math.PI * 20;
                        const offset = circumference - (percentage / 100) * circumference;

                        return (
                          <div
                            key={category.id}
                            onClick={() => {
                              setSelectedStat(null);
                              setSelectedCategory(category.id);
                            }}
                            className="bg-white rounded-lg border-l-4 border-green-500 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <Tooltip content={getCategoryDescription(category.id)} position="top">
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getScoreGradient(category.score)} flex items-center justify-center text-white cursor-help`}>
                                    {getCategoryIcon(category.id)}
                                  </div>
                                </Tooltip>
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-lg">{category.name}</h4>
                                  <p className="text-sm text-gray-600">{category.weight}% weight</p>
                                </div>
                                <div className="relative w-16 h-16">
                                  <svg className="transform -rotate-90 w-16 h-16">
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="24"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      className="text-gray-200"
                                    />
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="24"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      strokeDasharray={circumference}
                                      strokeDashoffset={offset}
                                      strokeLinecap="round"
                                      className={`transition-all duration-1000 ${getScoreColor(category.score)}`}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-lg font-bold ${getScoreColor(category.score)}`}>
                                      {category.score}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-yellow-300">
                      <WarningIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">No Passing Categories</p>
                      <p className="text-gray-600">All categories need improvement. Focus on the high priority fixes to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stat Detail Modal */}
      {selectedStat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStat(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white">
              <button
                onClick={() => setSelectedStat(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-3xl font-bold mb-2">
                {selectedStat === 'totalIssues' && 'All Issues'}
                {selectedStat === 'highPriority' && 'High Priority Issues'}
                {selectedStat === 'passing' && 'Passing Categories'}
              </h2>
              <p className="text-white/90">
                {selectedStat === 'totalIssues' && `Showing all ${report.allIssues?.length || 0} issues found across all categories`}
                {selectedStat === 'highPriority' && `Showing ${report.topFixes?.length || 0} high-impact issues that need immediate attention`}
                {selectedStat === 'passing' && `Showing ${categories.filter(c => c.score >= 75).length} categories that are performing well (score ≥ 75)`}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {selectedStat === 'totalIssues' && (
                <div className="space-y-4">
                  {report.allIssues && report.allIssues.length > 0 ? (
                    report.allIssues.map((issue, index) => (
                      <div key={index} className="bg-white rounded-lg border-l-4 border-blue-500 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${getScoreGradient(100)} flex items-center justify-center text-white text-sm font-bold`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900 text-lg">{issue.title}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                                {issue.category}
                              </span>
                            </div>
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
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-green-300">
                      <CelebrationIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">No Issues Found!</p>
                      <p className="text-gray-600">Your website is performing excellently across all categories.</p>
                    </div>
                  )}
                </div>
              )}

              {selectedStat === 'highPriority' && (
                <div className="space-y-4">
                  {report.topFixes && report.topFixes.length > 0 ? (
                    report.topFixes.map((fix, index) => (
                      <div key={index} className="bg-white rounded-lg border-l-4 border-red-500 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getScoreGradient(100 - (index * 10))} flex items-center justify-center text-white font-bold shadow-md`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900 text-lg">{fix.title}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 capitalize">
                                {fix.category}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 leading-relaxed">{fix.description}</p>
                            {fix.estimatedImpact && (
                              <div className="mb-3 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                                <p className="text-xs text-blue-800 font-medium flex items-center">
                                  <LightbulbIcon className="w-3 h-3 mr-1" /> {fix.estimatedImpact}
                                </p>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                fix.impact === 'High' ? 'bg-red-100 text-red-800 border border-red-200' :
                                fix.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {fix.impact} Impact
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                fix.difficulty === 'Easy' ? 'bg-green-100 text-green-800 border border-green-200' :
                                fix.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {fix.difficulty}
                              </span>
                            </div>
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-1">How to fix:</p>
                              <p className="text-sm text-gray-600">{fix.fix}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-green-300">
                      <CelebrationIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">No High Priority Issues!</p>
                      <p className="text-gray-600">All identified issues have been addressed or are low priority.</p>
                    </div>
                  )}
                </div>
              )}

              {selectedStat === 'passing' && (
                <div className="space-y-4">
                  {categories.filter(c => c.score >= 75).length > 0 ? (
                    categories
                      .filter(c => c.score >= 75)
                      .map((category) => {
                        const percentage = category.score || 0;
                        const circumference = 2 * Math.PI * 20;
                        const offset = circumference - (percentage / 100) * circumference;

                        return (
                          <div
                            key={category.id}
                            onClick={() => {
                              setSelectedStat(null);
                              setSelectedCategory(category.id);
                            }}
                            className="bg-white rounded-lg border-l-4 border-green-500 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <Tooltip content={getCategoryDescription(category.id)} position="top">
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getScoreGradient(category.score)} flex items-center justify-center text-white cursor-help`}>
                                    {getCategoryIcon(category.id)}
                                  </div>
                                </Tooltip>
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-lg">{category.name}</h4>
                                  <p className="text-sm text-gray-600">{category.weight}% weight</p>
                                </div>
                                <div className="relative w-16 h-16">
                                  <svg className="transform -rotate-90 w-16 h-16">
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="24"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      className="text-gray-200"
                                    />
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="24"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      strokeDasharray={circumference}
                                      strokeDashoffset={offset}
                                      strokeLinecap="round"
                                      className={`transition-all duration-1000 ${getScoreColor(category.score)}`}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-lg font-bold ${getScoreColor(category.score)}`}>
                                      {category.score}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-yellow-300">
                      <WarningIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">No Passing Categories</p>
                      <p className="text-gray-600">All categories need improvement. Focus on the high priority fixes to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Detail Modal */}
      {selectedCategory && selectedCategoryData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCategory(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`relative bg-gradient-to-br ${getScoreGradient(selectedScore)} p-6 text-white`}>
              <button
                onClick={() => setSelectedCategory(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center space-x-4">
                <Tooltip content={getCategoryDescription(selectedCategory)} position="right">
                  <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white cursor-help">
                    {getCategoryIcon(selectedCategory)}
                  </div>
                </Tooltip>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{getCategoryTitle(selectedCategory)}</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16">
                      <svg className="transform -rotate-90 w-16 h-16">
                        <circle
                          cx="32"
                          cy="32"
                          r="24"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-white/30"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="24"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          className="text-white transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{selectedScore}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{selectedScore}/100</div>
                      <div className="text-sm text-white/80">{selectedCategoryData.weight}% weight</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Performance Metrics */}
              {selectedCategory === 'performance' && report.metrics?.performance && (
                <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">LCP</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {report.metrics.performance.lcp ? `${Math.round(report.metrics.performance.lcp)}ms` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {report.metrics.performance.lcp && report.metrics.performance.lcp < 2500 ? (
                        <span className="flex items-center"><CheckIcon className="w-4 h-4 mr-1" /> Good</span>
                      ) : (
                        <span className="flex items-center"><WarningIcon className="w-4 h-4 mr-1" /> Needs work</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">CLS</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {report.metrics.performance.cls ? report.metrics.performance.cls.toFixed(3) : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {report.metrics.performance.cls && report.metrics.performance.cls < 0.1 ? (
                        <span className="flex items-center"><CheckIcon className="w-4 h-4 mr-1" /> Good</span>
                      ) : (
                        <span className="flex items-center"><WarningIcon className="w-4 h-4 mr-1" /> Needs work</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Page Weight</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {report.metrics?.pageWeight ? `${(report.metrics.pageWeight / 1024 / 1024).toFixed(2)}MB` : 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Issues */}
              {selectedIssues.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Issues Found ({selectedIssues.length})
                  </h3>
                  {selectedIssues.map((issue, index) => {
                    // Get detailed data for specific issues
                    let detailedData = null;

                    // Broken Links
                    if (issue.title === 'Broken Links Found' && report.htmlChecks?.brokenLinks) {
                      detailedData = {
                        type: 'brokenLinks',
                        items: report.htmlChecks.brokenLinks
                      };
                    }

                    // Missing Alt Text
                    if (issue.title === 'Missing Alt Text on Images' && report.htmlChecks?.images) {
                      detailedData = {
                        type: 'missingAlt',
                        count: report.htmlChecks.images.missingAlt,
                        total: report.htmlChecks.images.total,
                        emptyAlt: report.htmlChecks.images.emptyAlt
                      };
                    }

                    // Heading Hierarchy Issues
                    if (issue.title === 'Invalid Heading Hierarchy' && report.htmlChecks?.headingHierarchy?.issues) {
                      detailedData = {
                        type: 'headingHierarchy',
                        issues: report.htmlChecks.headingHierarchy.issues
                      };
                    }

                    // H1 Issues
                    if ((issue.title === 'Missing H1 Tag' || issue.title === 'Multiple H1 Tags') && report.htmlChecks?.h1) {
                      detailedData = {
                        type: 'h1',
                        count: report.htmlChecks.h1.count,
                        content: report.htmlChecks.h1.content
                      };
                    }

                    return (
                      <div key={index} className="bg-white rounded-lg border-l-4 border-blue-500 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${getScoreGradient(100)} flex items-center justify-center text-white text-sm font-bold`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-2 text-lg">{issue.title}</h4>
                            <p className="text-gray-600 text-sm mb-3 leading-relaxed">{issue.description}</p>

                            {/* Detailed Data Display */}
                            {detailedData && (
                              <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                                {detailedData.type === 'brokenLinks' && (
                                  <div>
                                    <p className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                                      <LinkIcon className="w-4 h-4 mr-1" /> Broken Links ({detailedData.items.length}):
                                    </p>
                                    <ul className="space-y-1">
                                      {detailedData.items.map((link, linkIndex) => (
                                        <li key={linkIndex} className="text-sm text-red-800 flex items-start">
                                          <span className="mr-2">•</span>
                                          <div className="flex-1">
                                            <a
                                              href={link.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-red-700 hover:text-red-900 underline break-all"
                                            >
                                              {link.url}
                                            </a>
                                            {link.statusCode && (
                                              <span className="ml-2 text-xs text-red-600">
                                                (HTTP {link.statusCode})
                                              </span>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {detailedData.type === 'missingAlt' && (
                                  <div>
                                    <p className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                                      <ImageIcon className="w-4 h-4 mr-1" /> Image Alt Text Issues:
                                    </p>
                                    <ul className="space-y-1 text-sm text-red-800">
                                      <li>• <strong>{detailedData.count}</strong> images missing alt text</li>
                                      {detailedData.emptyAlt > 0 && (
                                        <li>• <strong>{detailedData.emptyAlt}</strong> images with empty alt text (alt="")</li>
                                      )}
                                      <li>• <strong>{detailedData.total}</strong> total images on page</li>
                                      <li>• <strong>{detailedData.total - detailedData.count - detailedData.emptyAlt}</strong> images with proper alt text</li>
                                    </ul>
                                  </div>
                                )}

                                {detailedData.type === 'headingHierarchy' && (
                                  <div>
                                    <p className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                                      <DocumentIcon className="w-4 h-4 mr-1" /> Heading Hierarchy Problems:
                                    </p>
                                    <ul className="space-y-1">
                                      {detailedData.issues.map((hIssue, hIndex) => (
                                        <li key={hIndex} className="text-sm text-red-800">
                                          • {hIssue}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {detailedData.type === 'h1' && (
                                  <div>
                                    <p className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                                      <DocumentIcon className="w-4 h-4 mr-1" /> H1 Tag Details:
                                    </p>
                                    <ul className="space-y-1 text-sm text-red-800">
                                      <li>• Found <strong>{detailedData.count}</strong> H1 tag(s) (should be exactly 1)</li>
                                      {detailedData.content && detailedData.content.length > 0 && (
                                        <li>• H1 content: <strong>"{detailedData.content.join('", "')}"</strong></li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-400">
                              <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center">
                                <LightbulbIcon className="w-4 h-4 mr-1" /> How to fix:
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
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-blue-300">
                  {selectedScore >= 90 ? (
                    <>
                      <div className="mb-4 flex justify-center">
                        <CelebrationIcon className="w-16 h-16 text-green-500" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">Excellent! No critical issues found.</p>
                      <p className="text-gray-600">This category is performing well.</p>
                    </>
                  ) : selectedScore >= 75 ? (
                    <>
                      <div className="mb-4 flex justify-center">
                        <CheckIcon className="w-16 h-16 text-blue-500" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">Good performance, but room for improvement</p>
                      <p className="text-gray-600 mb-4">
                        Your score is {selectedScore}/100. While there are no critical issues, there may be optimization opportunities to reach 90+.
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
                      <p className="text-lg font-semibold text-gray-900 mb-2">Score: {selectedScore}/100 - Needs Attention</p>
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
          </div>
        </div>
      )}

      {/* Top 5 Fixes - Enhanced Design */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full mr-3"></div>
          <h2 className="text-2xl font-bold text-gray-900">Top 5 High-Impact Fixes</h2>
        </div>
        <div className="space-y-4">
          {report.topFixes.map((fix, index) => (
            <div
              key={index}
              className="relative bg-gradient-to-r from-gray-50 to-white rounded-lg border-l-4 border-blue-500 p-5 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getScoreGradient(100 - (index * 10))} flex items-center justify-center text-white font-bold shadow-md`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-blue-600 transition-colors">
                    {fix.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">{fix.description}</p>

                  {fix.estimatedImpact && (
                    <div className="mb-3 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                      <p className="text-xs text-blue-800 font-medium flex items-center">
                        <LightbulbIcon className="w-3 h-3 mr-1" /> {fix.estimatedImpact}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      fix.impact === 'High' ? 'bg-red-100 text-red-800 border border-red-200' :
                      fix.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {fix.impact} Impact
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      fix.difficulty === 'Easy' ? 'bg-green-100 text-green-800 border border-green-200' :
                      fix.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {fix.difficulty}
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">How to fix:</p>
                    <p className="text-sm text-gray-600">{fix.fix}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default ReportSummary;
