import { useState } from 'react';
import AuditForm from './components/AuditForm';
import LoadingScreen from './components/LoadingScreen';
import ReportView from './components/ReportView';

function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleNewAudit = () => {
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!report && !loading && (
        <AuditForm onSubmit={handleAuditSubmit} error={error} />
      )}
      {loading && <LoadingScreen />}
      {report && <ReportView report={report} onNewAudit={handleNewAudit} />}
    </div>
  );
}

export default App;

