import { useState } from 'react';
import { ConversionIcon, GlobeIcon, WarningIcon, RocketIcon } from './Icons';

function UxAuditForm({ onSubmit, error }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-lg w-full">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-2xl">
              <ConversionIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-gray-900 bg-clip-text text-transparent mb-3">
            Conversion & UX Audit
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Analyze your website's user experience, conversion effectiveness, and product clarity
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-3">
                Website URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <GlobeIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-lg"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                <WarningIcon className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
            >
              <RocketIcon className="w-5 h-5 mr-2" /> Run UX Audit
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">This audit checks:</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Clarity & Messaging</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Call-to-Action Effectiveness</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Trust Signals</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Friction Reduction</span>
              </div>
              <div className="flex items-center space-x-2 col-span-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Mobile UX Optimization</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UxAuditForm;

