import { useState } from 'react';
import { AnalyticsIcon, PlusIcon, CloseIcon } from './Icons';

function CompetitorComparison({ currentReport, onAddCompetitor }) {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [loadingCompetitor, setLoadingCompetitor] = useState(false);
  const [error, setError] = useState(null);

  const handleAddCompetitor = async () => {
    if (!competitorUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setError(null);
    setLoadingCompetitor(true);

    try {
      // Validate URL
      let validUrl;
      try {
        validUrl = new URL(competitorUrl.startsWith('http') ? competitorUrl : `https://${competitorUrl}`);
      } catch (e) {
        setError('Invalid URL format');
        setLoadingCompetitor(false);
        return;
      }

      // Submit audit job for competitor
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: validUrl.href }),
      });

      if (!response.ok) {
        throw new Error('Failed to start competitor audit');
      }

      const { jobId } = await response.json();

      // Poll for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/audit/${jobId}`);
          const status = await statusResponse.json();

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setLoadingCompetitor(false);

            // Add competitor to list
            const newCompetitor = {
              id: jobId,
              url: validUrl.href,
              report: status.result,
            };
            setCompetitors([...competitors, newCompetitor]);
            setCompetitorUrl('');

            if (onAddCompetitor) {
              onAddCompetitor(newCompetitor);
            }
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setLoadingCompetitor(false);
            setError(status.error || 'Competitor audit failed');
          }
        } catch (err) {
          clearInterval(pollInterval);
          setLoadingCompetitor(false);
          setError('Failed to check competitor audit status');
        }
      }, 2000);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (loadingCompetitor) {
          setLoadingCompetitor(false);
          setError('Competitor audit timed out. Please try again.');
        }
      }, 120000);

    } catch (err) {
      setLoadingCompetitor(false);
      setError(err.message || 'An error occurred');
    }
  };

  const handleRemoveCompetitor = (id) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  // Category name mapping
  const categoryNames = {
    performance: 'Performance',
    mobile: 'Mobile',
    seo: 'SEO',
    content: 'Content',
    conversion: 'Conversion',
    trust: 'Trust',
    accessibility: 'Accessibility',
    technical: 'Technical',
    security: 'Security',
    analytics: 'Analytics',
    structuredData: 'Structured Data',
    branding: 'Branding',
    legal: 'Legal',
    geo: 'GEO',
    competitive: 'Competitive',
    operational: 'Operational',
  };

  // Prepare data for chart
  const chartData = [];

  if (currentReport && currentReport.categoryScores) {
    const categories = Object.keys(currentReport.categoryScores);

    categories.forEach(category => {
      const dataPoint = {
        category: categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1'),
        categoryKey: category,
        current: currentReport.categoryScores[category] || 0,
        competitors: competitors.map(c => ({
          url: c.url,
          score: c.report?.categoryScores?.[category] || 0
        }))
      };
      chartData.push(dataPoint);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <AnalyticsIcon className="w-6 h-6 mr-2 text-blue-600" />
          Competitor Comparison
        </h2>
      </div>

      {/* Add Competitor Form */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="Enter competitor URL (e.g., example.com)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loadingCompetitor}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddCompetitor();
              }
            }}
          />
          <button
            onClick={handleAddCompetitor}
            disabled={loadingCompetitor || !competitorUrl.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loadingCompetitor ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Auditing...
              </>
            ) : (
              <>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Competitor List */}
      {competitors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Competitors:</h3>
          <div className="flex flex-wrap gap-2">
            {competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <span className="text-sm text-blue-800 truncate max-w-xs">
                  {new URL(competitor.url).hostname}
                </span>
                <button
                  onClick={() => handleRemoveCompetitor(competitor.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {competitors.length > 0 && chartData.length > 0 ? (
        <div className="space-y-4">
          {chartData.map((data, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{data.category}</h4>

              {/* Current Score Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Your Site</span>
                  <span className="text-xs font-bold text-gray-900">{data.current}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${
                      data.current >= 90 ? 'from-green-500 to-emerald-600' :
                      data.current >= 75 ? 'from-blue-500 to-cyan-600' :
                      data.current >= 55 ? 'from-yellow-500 to-orange-500' :
                      'from-red-500 to-rose-600'
                    } transition-all duration-500 rounded-full`}
                    style={{ width: `${data.current}%` }}
                  ></div>
                </div>
              </div>

              {/* Competitor Scores */}
              {data.competitors.map((comp, compIndex) => (
                <div key={compIndex} className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600 truncate max-w-[200px]">
                      {new URL(comp.url).hostname}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{comp.score}</span>
                      <span className={`text-xs font-semibold ${
                        comp.score > data.current ? 'text-red-600' :
                        comp.score < data.current ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {comp.score > data.current ? '↑' : comp.score < data.current ? '↓' : '='}
                        {Math.abs(comp.score - data.current)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${
                        comp.score >= 90 ? 'from-green-400 to-emerald-500' :
                        comp.score >= 75 ? 'from-blue-400 to-cyan-500' :
                        comp.score >= 55 ? 'from-yellow-400 to-orange-400' :
                        'from-red-400 to-rose-500'
                      } transition-all duration-500 rounded-full`}
                      style={{ width: `${comp.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AnalyticsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No competitors added yet</p>
          <p className="text-sm text-gray-500">Add competitor URLs above to compare category scores</p>
        </div>
      )}
    </div>
  );
}

export default CompetitorComparison;

