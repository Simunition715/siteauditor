import { useState, useEffect, useRef } from 'react';

function QualityHubLoadingScreen({ progress, message, logs = [] }) {
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getProgressColor = (progress) => {
    if (progress < 30) return 'from-purple-500 to-pink-500';
    if (progress < 60) return 'from-purple-600 to-pink-600';
    if (progress < 90) return 'from-purple-700 to-pink-700';
    return 'from-green-500 to-emerald-500';
  };

  const getStageIcon = (message) => {
    if (message?.toLowerCase().includes('build')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }
    if (message?.toLowerCase().includes('discover') || message?.toLowerCase().includes('file')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    }
    if (message?.toLowerCase().includes('analyze') || message?.toLowerCase().includes('eslint') || message?.toLowerCase().includes('typescript')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (message?.toLowerCase().includes('report') || message?.toLowerCase().includes('read')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div
              className={`absolute inset-0 border-4 rounded-full border-t-transparent animate-spin bg-gradient-to-r ${getProgressColor(progress)}`}
              style={{
                borderImage: `linear-gradient(to right, transparent, transparent) 1`,
                borderTopColor: 'transparent'
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getProgressColor(progress)} flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Running Quality Scan...
          </h2>
          <p className="text-gray-600 mb-4">
            {message || 'Initializing scan...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Progress</span>
            <span className="text-sm font-bold text-purple-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getProgressColor(progress)} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Activity Log
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {logs.length} entries
            </span>
          </div>

          <div
            ref={logContainerRef}
            className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm space-y-2"
            style={{ maxHeight: '16rem' }}
          >
            {logs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Waiting for activity...
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5 text-purple-600">
                    {getStageIcon(log.message || log)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800">
                      {typeof log === 'string' ? log : log.message || 'Processing...'}
                    </div>
                    {log.timestamp && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  {log.type === 'success' && (
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {log.type === 'error' && (
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Scan in progress - This may take 1-3 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QualityHubLoadingScreen;

