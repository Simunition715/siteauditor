import { ConversionIcon } from './Icons';

function UxAuditLoadingScreen({ progress = 0, message = '' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ConversionIcon className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Running UX Audit...
        </h2>
        {message && (
          <p className="text-gray-600 mb-4">{message}</p>
        )}
        {progress > 0 && (
          <div className="w-64 mx-auto mb-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
          </div>
        )}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Analyzing user experience and conversion effectiveness
        </p>
      </div>
    </div>
  );
}

export default UxAuditLoadingScreen;

