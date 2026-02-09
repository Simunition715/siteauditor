import { useState } from 'react';

function UxAuditReportView({ report, onNewAudit }) {
  const [expandedIssues, setExpandedIssues] = useState(new Set());

  if (!report) return null;

  const { scores, issues, quickWins, scannedPages } = report;

  const toggleIssue = (index) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedIssues(newExpanded);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getImpactColor = (impact) => {
    if (impact === 'High') return 'bg-red-100 text-red-800';
    if (impact === 'Med') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getEffortColor = (effort) => {
    if (effort === 'S') return 'bg-green-100 text-green-800';
    if (effort === 'M') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const categoryLabels = {
    clarity: 'Clarity',
    direction: 'Direction',
    trust: 'Trust',
    friction: 'Friction',
    mobile: 'Mobile UX',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Conversion & UX Audit Report</h1>
              <p className="text-gray-600">UX Effectiveness Analysis Results</p>
            </div>
            <button
              onClick={onNewAudit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              New Audit
            </button>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center">
            <div className={`inline-block px-8 py-4 rounded-2xl ${getScoreColor(scores.total)}`}>
              <div className="text-5xl font-bold mb-2">{scores.total}</div>
              <div className="text-lg font-semibold">Overall UX Score</div>
            </div>
          </div>
        </div>

        {/* Category Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <div key={key} className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-2">{label}</div>
              <div className={`text-3xl font-bold ${getScoreColor(scores[key]).split(' ')[0]}`}>
                {scores[key]}
              </div>
              <div className="text-xs text-gray-500 mt-1">out of 20</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Top Issues */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Issues</h2>
            {issues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg font-semibold mb-2">🎉 Great job!</p>
                <p>No critical issues found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue, idx) => {
                  const isExpanded = expandedIssues.has(idx);
                  return (
                    <div
                      key={idx}
                      className="border-l-4 border-red-500 bg-red-50 rounded-r-lg overflow-hidden"
                    >
                      <div
                        onClick={() => toggleIssue(idx)}
                        className="p-4 cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-sm text-gray-700">{issue.id}</span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getImpactColor(issue.impact)}`}>
                                {issue.impact}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getEffortColor(issue.effort)}`}>
                                Effort: {issue.effort}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">{issue.title}</h4>
                            <p className="text-sm text-gray-600">{issue.why}</p>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''
                              }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-red-200 bg-white">
                          <div className="pt-4 space-y-3">
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 mb-1">Evidence</h5>
                              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                {issue.page && (
                                  <div><strong>Page:</strong> {issue.page}</div>
                                )}
                                {issue.evidence && issue.evidence.selectors && issue.evidence.selectors.length > 0 && (
                                  <div className="mt-1">
                                    <strong>Selectors:</strong> {issue.evidence.selectors.join(', ')}
                                  </div>
                                )}
                                {issue.evidence && issue.evidence.values && Object.keys(issue.evidence.values).length > 0 && (
                                  <div className="mt-1">
                                    <strong>Values:</strong>{' '}
                                    <pre className="mt-1 text-xs overflow-auto">
                                      {JSON.stringify(issue.evidence.values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>

                            {issue.suggestion && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-1">Suggested Fix</h5>
                                <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-200">
                                  {issue.suggestion}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Quick Wins + Pages Scanned */}
          <div className="space-y-6">
            {/* Quick Wins */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Wins</h2>
              {quickWins.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>No quick wins identified.</p>
                  <p className="text-sm mt-1">Focus on high-impact, low-effort improvements.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quickWins.map((winId, idx) => {
                    const issue = issues.find((i) => i.id === winId);
                    if (!issue) return null;
                    return (
                      <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-green-600 font-bold">✓</span>
                          <span className="font-semibold text-gray-900">{issue.title}</span>
                        </div>
                        <p className="text-sm text-gray-600">{issue.suggestion}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pages Scanned */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pages Scanned</h2>
              <div className="space-y-2">
                {scannedPages.map((page, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">•</span>
                    <a
                      href={page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono"
                    >
                      {page}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UxAuditReportView;

