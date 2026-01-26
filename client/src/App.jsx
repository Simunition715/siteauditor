import { useState } from 'react';
import AuditForm from './components/AuditForm';
import QualityHubForm from './components/QualityHubForm';
import LoadingScreen from './components/LoadingScreen';
import QualityHubLoadingScreen from './components/QualityHubLoadingScreen';
import ReportView from './components/ReportView';
import QualityHubReportView from './components/QualityHubReportView';

function App() {
  const [activeTab, setActiveTab] = useState('website'); // 'website' or 'quality'
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qualityProgress, setQualityProgress] = useState({ progress: 0, message: '', logs: [] });

  const handleAuditSubmit = async (url) => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // Submit audit job
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to start audit');
      }

      const { jobId } = await response.json();

      // Poll for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/audit/${jobId}`);
          const status = await statusResponse.json();

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setLoading(false);
            setReport(status.result);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setLoading(false);
            setError(status.error || 'Audit failed');
          }
        } catch (err) {
          clearInterval(pollInterval);
          setLoading(false);
          setError('Failed to check audit status');
        }
      }, 2000);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (loading) {
          setLoading(false);
          setError('Audit timed out. Please try again.');
        }
      }, 120000);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'An error occurred');
    }
  };

  const handleQualityScan = async (repoPath) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setQualityProgress({ progress: 0, message: 'Initializing...', logs: [] });

    console.log('Sending repoPath to server:', repoPath);

    try {
      const response = await fetch('/api/quality/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoPath: repoPath.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start quality scan');
      }

      const { jobId } = await response.json();

      // Poll for results with progress tracking
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/quality/${jobId}`);
          const status = await statusResponse.json();

          // Update progress and logs - always update if status is running
          if (status.status === 'running' || status.progress !== undefined) {
            setQualityProgress(prev => {
              const newLogs = [...prev.logs];
              // Add new message to logs if it changed
              if (status.message && status.message !== prev.message) {
                newLogs.push({
                  message: status.message,
                  timestamp: new Date().toISOString(),
                  type: 'info'
                });
              }
              return {
                progress: status.progress !== undefined ? status.progress : prev.progress,
                message: status.message || prev.message,
                logs: newLogs
              };
            });
          }

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setLoading(false);
            setReport(status.result);
            setQualityProgress({ progress: 100, message: 'Scan complete!', logs: [] });
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setLoading(false);
            setError(status.error || 'Quality scan failed');
            setQualityProgress(prev => ({
              ...prev,
              logs: [...prev.logs, {
                message: `Error: ${status.error || 'Scan failed'}`,
                timestamp: new Date().toISOString(),
                type: 'error'
              }]
            }));
          }
        } catch (err) {
          clearInterval(pollInterval);
          setLoading(false);
          setError('Failed to check scan status');
        }
      }, 1000); // Poll every second for better responsiveness

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (loading) {
          setLoading(false);
          setError('Scan timed out. Please try again.');
        }
      }, 300000);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'An error occurred');
    }
  };

  const handleNewAudit = () => {
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      {!report && !loading && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab('website');
                  setError(null);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'website'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Website Audit
              </button>
              <button
                onClick={() => {
                  setActiveTab('quality');
                  setError(null);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'quality'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Code Quality
              </button>
            </nav>
          </div>
        </div>
      )}

      {!report && !loading && activeTab === 'website' && (
        <AuditForm onSubmit={handleAuditSubmit} error={error} />
      )}
      {!report && !loading && activeTab === 'quality' && (
        <QualityHubForm onSubmit={handleQualityScan} error={error} loading={loading} />
      )}
      {loading && activeTab === 'website' && <LoadingScreen />}
      {loading && activeTab === 'quality' && (
        <QualityHubLoadingScreen
          progress={qualityProgress.progress}
          message={qualityProgress.message}
          logs={qualityProgress.logs}
        />
      )}
      {report && activeTab === 'website' && (
        <ReportView report={report} onNewAudit={handleNewAudit} />
      )}
      {report && activeTab === 'quality' && (
        <QualityHubReportView report={report} onNewScan={handleNewAudit} />
      )}
    </div>
  );
}

export default App;

