import { useState } from 'react';
import ReportSummary from './ReportSummary';
import ReportDetails from './ReportDetails';
import { PerformanceIcon, AnalyticsIcon, SEOIcon, PlusIcon } from './Icons';

function ReportView({ report, onNewAudit }) {
  const [currentPage, setCurrentPage] = useState(1);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade) => {
    if (grade === 'Excellent') return 'bg-green-100 text-green-800 border-green-300';
    if (grade === 'Good') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (grade === 'Needs Work') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Header - Enhanced */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <PerformanceIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Audit Report
                </h1>
                <p className="text-sm text-gray-600 mt-1 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  {report.url}
                </p>
              </div>
            </div>
            <button
              onClick={onNewAudit}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <PlusIcon className="w-4 h-4 mr-1" /> New Audit
            </button>
          </div>
        </div>
      </div>

      {/* Navigation - Enhanced */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(1)}
              className={`px-6 py-3 text-sm font-semibold rounded-t-lg transition-all duration-200 ${currentPage === 1
                  ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg transform translate-y-[-2px]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <AnalyticsIcon className="w-4 h-4 mr-1 inline" /> Summary
            </button>
            <button
              onClick={() => setCurrentPage(2)}
              className={`px-6 py-3 text-sm font-semibold rounded-t-lg transition-all duration-200 ${currentPage === 2
                  ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg transform translate-y-[-2px]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <SEOIcon className="w-4 h-4 mr-1 inline" /> Details
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 1 && <ReportSummary report={report} getScoreColor={getScoreColor} getGradeColor={getGradeColor} />}
        {currentPage === 2 && <ReportDetails report={report} getScoreColor={getScoreColor} />}
      </div>
    </div>
  );
}

export default ReportView;
