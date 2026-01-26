import { useState } from 'react';

function QualityHubReportView({ report, onNewScan }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedCategory, setSelectedCategory] = useState(null); // 'BUG', 'VULNERABILITY', 'CODE_SMELL', or null for all
  const [expandedFindings, setExpandedFindings] = useState(new Set());
  const [sortedMetrics, setSortedMetrics] = useState(null); // null = use original order

  if (!report) return null;

  const { findings, summary, metrics } = report;

  // Filter findings by selected category
  const filteredFindings = selectedCategory
    ? findings.filter(f => f.category === selectedCategory)
    : findings;

  // Extract dependency-related findings (those with "dependency" tag or DEP- prefix)
  const dependencyFindings = findings.filter(
    f => f.tags?.includes("dependency") || f.id?.startsWith("DEP-") || f.ruleId?.startsWith("DEP-")
  );

  // Use sorted metrics if available, otherwise use original
  const displayMetrics = sortedMetrics || metrics;

  // Toggle finding expansion
  const toggleFinding = (index) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFindings(newExpanded);
  };

  // Handle metric card click
  const handleMetricClick = (category) => {
    if (selectedCategory === category) {
      // If already selected, deselect and show all
      setSelectedCategory(null);
      setActiveTab('findings');
    } else {
      // Select category and switch to findings tab
      setSelectedCategory(category);
      setActiveTab('findings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">QualityHub Report</h1>
              <p className="text-gray-600">Code Quality Analysis Results</p>
            </div>
            <button
              onClick={onNewScan}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              New Scan
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            onClick={() => {
              setSelectedCategory(null);
              setActiveTab('findings');
            }}
            className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedCategory === null && activeTab === 'findings' ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            <div className="text-3xl font-bold text-gray-900">{summary.totalFindings}</div>
            <div className="text-sm text-gray-600 mt-1">Total Findings</div>
            <div className="text-xs text-purple-600 mt-2 font-medium">Click to view all</div>
          </div>
          <div
            onClick={() => handleMetricClick('BUG')}
            className={`bg-red-50 rounded-lg shadow-md p-6 border-l-4 border-red-500 cursor-pointer transition-all hover:shadow-lg ${
              selectedCategory === 'BUG' ? 'ring-2 ring-red-500' : ''
            }`}
          >
            <div className="text-3xl font-bold text-red-600">{summary.byCategory.BUG}</div>
            <div className="text-sm text-gray-600 mt-1">Bugs</div>
            <div className="text-xs text-red-600 mt-2 font-medium">Click to filter</div>
          </div>
          <div
            onClick={() => handleMetricClick('VULNERABILITY')}
            className={`bg-purple-50 rounded-lg shadow-md p-6 border-l-4 border-purple-500 cursor-pointer transition-all hover:shadow-lg ${
              selectedCategory === 'VULNERABILITY' ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            <div className="text-3xl font-bold text-purple-600">{summary.byCategory.VULNERABILITY}</div>
            <div className="text-sm text-gray-600 mt-1">Vulnerabilities</div>
            <div className="text-xs text-purple-600 mt-2 font-medium">Click to filter</div>
          </div>
          <div
            onClick={() => handleMetricClick('CODE_SMELL')}
            className={`bg-yellow-50 rounded-lg shadow-md p-6 border-l-4 border-yellow-500 cursor-pointer transition-all hover:shadow-lg ${
              selectedCategory === 'CODE_SMELL' ? 'ring-2 ring-yellow-500' : ''
            }`}
          >
            <div className="text-3xl font-bold text-yellow-600">{summary.byCategory.CODE_SMELL}</div>
            <div className="text-sm text-gray-600 mt-1">Code Smells</div>
            <div className="text-xs text-yellow-600 mt-2 font-medium">Click to filter</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'summary'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('findings')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'findings'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Findings ({selectedCategory ? filteredFindings.length : findings.length})
                {selectedCategory && ` (${findings.length} total)`}
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'metrics'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Metrics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{summary.totalLoc.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Lines of Code</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{summary.duplicationPercentage.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Duplication</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dependencies</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {dependencyFindings.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">
                            Dependency Vulnerabilities Found: {dependencyFindings.length}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedCategory('VULNERABILITY');
                              setActiveTab('findings');
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            View Details
                          </button>
                        </div>
                        <div className="text-sm text-blue-800">
                          <p className="mb-2">The following dependencies have known security vulnerabilities:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {dependencyFindings.slice(0, 5).map((finding, idx) => (
                              <li key={idx} className="font-mono text-xs">
                                {finding.title}
                                {finding.severity && (
                                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                    finding.severity === 'CRITICAL' || finding.severity === 'BLOCKER'
                                      ? 'bg-red-100 text-red-800'
                                      : finding.severity === 'MAJOR'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {finding.severity}
                                  </span>
                                )}
                              </li>
                            ))}
                            {dependencyFindings.length > 5 && (
                              <li className="text-blue-600 italic">
                                ...and {dependencyFindings.length - 5} more
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">✓ Dependency analysis completed</p>
                        <p className="text-blue-600">
                          No known security vulnerabilities found in dependencies.
                          {summary.byCategory.VULNERABILITY > 0 && (
                            <span className="ml-1">
                              ({summary.byCategory.VULNERABILITY} other vulnerability{summary.byCategory.VULNERABILITY !== 1 ? 'ies' : 'y'} found in code)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">By Severity</h3>
                  <div className="space-y-2">
                    {Object.entries(summary.bySeverity).map(([severity, count]) => (
                      count > 0 && (
                        <div key={severity} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium">{severity}</span>
                          <span className="text-gray-600">{count}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'findings' && (
              <div className="space-y-2">
                {selectedCategory && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        Showing {filteredFindings.length} {selectedCategory === 'BUG' ? 'Bugs' : selectedCategory === 'VULNERABILITY' ? 'Vulnerabilities' : 'Code Smells'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Show all findings
                      </button>
                    </div>
                  </div>
                )}
                {filteredFindings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No findings found for the selected category.
                  </div>
                ) : (
                  filteredFindings.map((finding, idx) => {
                    const isExpanded = expandedFindings.has(idx);
                    return (
                      <div
                        key={idx}
                        className={`rounded-lg border-l-4 overflow-hidden transition-all ${
                          finding.category === 'BUG'
                            ? 'bg-red-50 border-red-500'
                            : finding.category === 'VULNERABILITY'
                            ? 'bg-purple-50 border-purple-500'
                            : 'bg-yellow-50 border-yellow-500'
                        }`}
                      >
                        {/* Collapsed Row */}
                        <div
                          onClick={() => toggleFinding(idx)}
                          className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-sm text-gray-700">{finding.id}</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  finding.severity === 'CRITICAL' || finding.severity === 'BLOCKER'
                                    ? 'bg-red-100 text-red-800'
                                    : finding.severity === 'MAJOR'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : finding.severity === 'MINOR'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {finding.severity}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  finding.category === 'BUG'
                                    ? 'bg-red-200 text-red-900'
                                    : finding.category === 'VULNERABILITY'
                                    ? 'bg-purple-200 text-purple-900'
                                    : 'bg-yellow-200 text-yellow-900'
                                }`}>
                                  {finding.category}
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">{finding.title}</h4>
                              <div className="text-xs text-gray-500 font-mono">
                                {finding.filePath}:{finding.line}
                              </div>
                            </div>
                            <div className="ml-4">
                              <svg
                                className={`w-5 h-5 text-gray-500 transition-transform ${
                                  isExpanded ? 'transform rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-200 bg-white bg-opacity-50">
                            <div className="pt-4 space-y-3">
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-1">Description</h5>
                                <p className="text-sm text-gray-600">{finding.description || 'No description available.'}</p>
                              </div>

                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-1">Location</h5>
                                <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                                  <div><strong>File:</strong> {finding.filePath}</div>
                                  <div><strong>Line:</strong> {finding.line}</div>
                                  {finding.column && <div><strong>Column:</strong> {finding.column}</div>}
                                </div>
                              </div>

                              {finding.remediation && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Remediation</h5>
                                  <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-200">
                                    {finding.remediation}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <strong className="text-gray-700">Category:</strong>
                                  <span className="ml-2 text-gray-600">{finding.category}</span>
                                </div>
                                <div>
                                  <strong className="text-gray-700">Severity:</strong>
                                  <span className="ml-2 text-gray-600">{finding.severity}</span>
                                </div>
                                {finding.fingerprint && (
                                  <div className="col-span-2">
                                    <strong className="text-gray-700">Fingerprint:</strong>
                                    <span className="ml-2 text-gray-600 font-mono text-xs">{finding.fingerprint}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">File Metrics</h3>
                    <div className="text-sm text-gray-600">
                      Showing {metrics.length} files
                    </div>
                  </div>

                  {/* Metrics Explanation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">What are File Metrics?</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>LOC (Lines of Code):</strong> Number of executable lines (excluding comments and blank lines)</p>
                      <p><strong>Complexity:</strong> Average cyclomatic complexity per function in the file (higher = more complex, harder to test)</p>
                      <p><strong>Functions:</strong> Number of functions/methods defined in the file</p>
                      <p><strong>Comment LOC:</strong> Number of comment lines (shown in expanded view)</p>
                    </div>
                  </div>

                  {/* Sort Controls */}
                  <div className="mb-4 flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      Sort by:
                    </label>
                    <select
                      onChange={(e) => {
                        const sortBy = e.target.value;
                        if (sortBy === 'none') {
                          setSortedMetrics(null);
                          return;
                        }
                        const sorted = [...metrics].sort((a, b) => {
                          switch (sortBy) {
                            case 'loc-desc':
                              return b.metrics.loc - a.metrics.loc;
                            case 'loc-asc':
                              return a.metrics.loc - b.metrics.loc;
                            case 'complexity-desc':
                              return b.metrics.fileComplexity - a.metrics.fileComplexity;
                            case 'complexity-asc':
                              return a.metrics.fileComplexity - b.metrics.fileComplexity;
                            case 'functions-desc':
                              return b.metrics.functions.length - a.metrics.functions.length;
                            case 'functions-asc':
                              return a.metrics.functions.length - b.metrics.functions.length;
                            default:
                              return 0;
                          }
                        });
                        setSortedMetrics(sorted);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                      defaultValue="none"
                    >
                      <option value="none">Original Order</option>
                      <option value="loc-desc">LOC (High to Low)</option>
                      <option value="loc-asc">LOC (Low to High)</option>
                      <option value="complexity-desc">Complexity (High to Low)</option>
                      <option value="complexity-asc">Complexity (Low to High)</option>
                      <option value="functions-desc">Functions (High to Low)</option>
                      <option value="functions-asc">Functions (Low to High)</option>
                    </select>
                  </div>

                  {/* File Metrics List */}
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {displayMetrics.map((fileMetric, displayIdx) => {
                      // Find original index for consistent expansion tracking
                      const originalIndex = metrics.findIndex(m => m.filePath === fileMetric.filePath);
                      const idx = originalIndex >= 0 ? originalIndex : displayIdx;
                      const isExpanded = expandedFindings.has(`metric-${idx}`);
                      return (
                        <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                          <div
                            className="cursor-pointer"
                            onClick={() => {
                              const newExpanded = new Set(expandedFindings);
                              if (newExpanded.has(`metric-${idx}`)) {
                                newExpanded.delete(`metric-${idx}`);
                              } else {
                                newExpanded.add(`metric-${idx}`);
                              }
                              setExpandedFindings(newExpanded);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-mono text-sm mb-1 font-semibold">{fileMetric.filePath}</div>
                                <div className="text-xs text-gray-600 flex items-center gap-4">
                                  <span><strong>LOC:</strong> {fileMetric.metrics.loc.toLocaleString()}</span>
                                  <span><strong>Complexity:</strong> {fileMetric.metrics.fileComplexity.toFixed(1)}</span>
                                  <span><strong>Functions:</strong> {fileMetric.metrics.functions.length}</span>
                                  {fileMetric.metrics.commentLoc > 0 && (
                                    <span><strong>Comments:</strong> {fileMetric.metrics.commentLoc}</span>
                                  )}
                                </div>
                              </div>
                              <svg
                                className={`w-5 h-5 text-gray-500 transition-transform ${
                                  isExpanded ? 'transform rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <strong className="text-gray-700">Total Lines:</strong>
                                  <span className="ml-2 text-gray-600">
                                    {(fileMetric.metrics.loc + fileMetric.metrics.commentLoc).toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <strong className="text-gray-700">Comment Lines:</strong>
                                  <span className="ml-2 text-gray-600">
                                    {fileMetric.metrics.commentLoc.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <strong className="text-gray-700">Code Lines:</strong>
                                  <span className="ml-2 text-gray-600">
                                    {fileMetric.metrics.loc.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <strong className="text-gray-700">Avg Complexity:</strong>
                                  <span className="ml-2 text-gray-600">
                                    {fileMetric.metrics.fileComplexity.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {fileMetric.metrics.functions.length > 0 && (
                                <div>
                                  <strong className="text-xs text-gray-700">Functions ({fileMetric.metrics.functions.length}):</strong>
                                  <div className="mt-1 max-h-40 overflow-y-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="text-left p-1">Name</th>
                                          <th className="text-left p-1">Line</th>
                                          <th className="text-left p-1">Complexity</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {fileMetric.metrics.functions.map((func, funcIdx) => (
                                          <tr key={funcIdx} className="border-b border-gray-200">
                                            <td className="p-1 font-mono">{func.name}</td>
                                            <td className="p-1">{func.line}</td>
                                            <td className="p-1">
                                              <span className={`px-1.5 py-0.5 rounded ${
                                                func.complexity > 15
                                                  ? 'bg-red-100 text-red-800'
                                                  : func.complexity > 10
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-green-100 text-green-800'
                                              }`}>
                                                {func.complexity}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {fileMetric.metrics.duplication && fileMetric.metrics.duplication.duplicatedLines > 0 && (
                                <div className="text-xs">
                                  <strong className="text-gray-700">Duplication:</strong>
                                  <span className="ml-2 text-gray-600">
                                    {fileMetric.metrics.duplication.duplicatedLines} lines ({fileMetric.metrics.duplication.duplicationPercentage.toFixed(1)}%)
                                  </span>
                                </div>
                              )}

                              {fileMetric.metrics.coverage && (
                                <div className="text-xs">
                                  <strong className="text-gray-700">Test Coverage:</strong>
                                  <div className="ml-2 mt-1 space-y-1">
                                    <div>Lines: {fileMetric.metrics.coverage.lines.hit}/{fileMetric.metrics.coverage.lines.found} ({fileMetric.metrics.coverage.lines.percent.toFixed(1)}%)</div>
                                    <div>Functions: {fileMetric.metrics.coverage.functions.hit}/{fileMetric.metrics.coverage.functions.found} ({fileMetric.metrics.coverage.functions.percent.toFixed(1)}%)</div>
                                    <div>Branches: {fileMetric.metrics.coverage.branches.hit}/{fileMetric.metrics.coverage.branches.found} ({fileMetric.metrics.coverage.branches.percent.toFixed(1)}%)</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QualityHubReportView;

