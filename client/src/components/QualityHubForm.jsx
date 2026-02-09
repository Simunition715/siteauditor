import { useState } from 'react';
import { RocketIcon, WarningIcon } from './Icons';

function QualityHubForm({ onSubmit, error, loading }) {
  const [repoPath, setRepoPath] = useState('');

  const handleBrowseFolder = async () => {
    // Check if File System Access API is supported (Chrome, Edge, newer browsers)
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        // Try to start at a high level - browsers don't allow starting at root (C:\) for security
        // Remove startIn to use browser default, or use 'desktop' which is closer to root
        // User can navigate up to root from there
        const directoryHandle = await window.showDirectoryPicker({
          mode: 'read'
          // No startIn - browser will use default (often last used location or user's home)
          // This gives user more control and may start closer to where they need to be
        });

        const folderName = directoryHandle.name;

        // Try to get the actual path by reading a file from the directory
        // This is a workaround - we read a file and extract its path, then remove the filename
        let extractedPath = '';

        try {
          // Try to find a file in the directory to get the path
          const entries = directoryHandle.entries();
          let foundFile = false;

          for await (const entry of entries) {
            const [name, handle] = entry;

            // Try to get a file handle
            if (handle.kind === 'file') {
              try {
                // Request the file to get its path
                const file = await handle.getFile();

                // Try to get path from file object
                // Modern browsers don't expose this, but we can try
                if (file.path) {
                  // Remove the filename to get the directory path
                  extractedPath = file.path.replace(/\\[^\\]*$/, '').replace(/\/[^\/]*$/, '');
                  console.log('Extracted path from file.path:', extractedPath);
                  foundFile = true;
                  break;
                }

                // Try webkitRelativePath as fallback
                if (file.webkitRelativePath) {
                  const parts = file.webkitRelativePath.split('/');
                  if (parts.length > 1) {
                    // We have relative path, but need absolute
                    // This won't work, but we'll try the name approach
                  }
                }
              } catch (fileErr) {
                // Continue trying other files
              }
            }

            // Limit search to first few entries
            if (entries.length > 10) break;
          }
        } catch (e) {
          console.log('Could not extract path from directory handle:', e);
        }

        // If we couldn't extract the path, try to use the folder name
        // The backend will try to resolve it from common locations
        if (!extractedPath) {
          // Set the folder name - backend will try to find it in common locations
          setRepoPath(folderName);
          console.log('Using folder name, backend will try to resolve:', folderName);
        } else {
          // Use the extracted path
          setRepoPath(extractedPath);
          console.log('Using extracted path:', extractedPath);
        }

      } catch (err) {
        // User cancelled or error occurred
        if (err.name !== 'AbortError') {
          console.error('Error selecting folder:', err);
          alert('Error opening folder picker. Please enter the path manually.');
        }
      }
    } else {
      // Fallback: Use file input with webkitdirectory
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.directory = true;
      input.multiple = true;
      input.style.display = 'none';
      document.body.appendChild(input);

      input.onchange = async (e) => {
        const files = e.target.files;
        if (files.length > 0) {
          const firstFile = files[0];
          let extractedPath = '';

          // Try multiple methods to get the path
          // Method 1: Direct path property (some browsers)
          if (firstFile.path) {
            extractedPath = firstFile.path.replace(/\\[^\\]*$/, '').replace(/\/[^\/]*$/, '');
            console.log('Extracted path from file.path:', extractedPath);
          }
          // Method 2: Try to get from file input's value (some browsers expose this)
          else if (input.value) {
            // Some browsers include the full path in the input value
            const value = input.value;
            console.log('Input value:', value);
            if (value.includes('\\') || value.includes('/')) {
              // Remove the filename from the path
              extractedPath = value.replace(/\\[^\\]*$/, '').replace(/\/[^\/]*$/, '');
              console.log('Extracted path from input.value:', extractedPath);
            }
          }
          // Method 3: Try webkitRelativePath - but this only gives relative path
          // We need to combine with the file's actual path if available
          else if (firstFile.webkitRelativePath) {
            const folderName = firstFile.webkitRelativePath.split('/')[0];

            // Try to get more info from the File object
            // Check if there's any path information in the file object
            const fileObj = firstFile;
            let foundPathInObject = false;

            for (const key in fileObj) {
              if (typeof fileObj[key] === 'string' && (fileObj[key].includes('\\') || fileObj[key].includes('/'))) {
                const potentialPath = fileObj[key];
                // Check if it looks like an absolute path
                if (potentialPath.length > folderName.length &&
                  (potentialPath.includes('C:') || potentialPath.startsWith('/') || potentialPath.startsWith('\\\\'))) {
                  // This looks like a full path - extract directory
                  extractedPath = potentialPath.replace(/\\[^\\]*$/, '').replace(/\/[^\/]*$/, '');
                  foundPathInObject = true;
                  console.log('Found path in file object property:', key, extractedPath);
                  break;
                }
              }
            }

            // If we still don't have a path, use the folder name
            // The backend will try to resolve it from common locations
            if (!foundPathInObject) {
              extractedPath = folderName;
              console.log('Using folder name, backend will try to resolve:', folderName);
            }
          }

          // Set the extracted path
          if (extractedPath) {
            console.log('Setting path to:', extractedPath);
            setRepoPath(extractedPath);
          } else {
            // Fallback: just use folder name
            const folderName = firstFile.webkitRelativePath?.split('/')[0] || 'selected-folder';
            console.log('Could not extract path, using folder name:', folderName);
            setRepoPath(folderName);
          }
        }

        // Clean up
        setTimeout(() => {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
        }, 100);
      };

      input.click();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoPath.trim()) {
      onSubmit(repoPath.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-lg w-full">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 bg-clip-text text-transparent mb-3">
            Code Quality Analysis
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Analyze your codebase for bugs, vulnerabilities, code smells, and quality metrics
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="repoPath" className="block text-sm font-semibold text-gray-700 mb-3">
                Repository Folder Path
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="repoPath"
                    value={repoPath}
                    onChange={(e) => setRepoPath(e.target.value)}
                    placeholder="C:\Users\username\myproject or /home/user/myproject"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg font-mono text-sm"
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  disabled={loading}
                  className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl border-2 border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Browse
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {typeof window !== 'undefined' && 'showDirectoryPicker' in window
                  ? 'Click "Browse" to select a folder, or enter the absolute path manually'
                  : 'Enter the absolute path to your repository folder (e.g., C:\\Users\\username\\myproject)'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                <WarningIcon className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RocketIcon className="w-5 h-5 mr-2" />
              {loading ? 'Analyzing...' : 'Run Quality Scan'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">This scan checks:</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Bugs & Errors</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Security Issues</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Code Smells</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Code Metrics</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Duplication</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Dependencies</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QualityHubForm;

