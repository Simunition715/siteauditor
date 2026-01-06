import { PerformanceIcon, RocketIcon, TrophyIcon, PhoneIcon, EmailIcon } from './Icons';

function ReportUpsell() {
  const packages = [
    {
      name: 'Quick Fix Sprint',
      duration: '1-2 weeks',
      price: 'Starting at $2,500',
      features: [
        'Fix top 5 high-impact issues',
        'Performance optimization',
        'SEO basics implementation',
        'Accessibility quick wins',
        'Basic conversion improvements'
      ],
      icon: <PerformanceIcon className="w-8 h-8" />,
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      name: 'Optimization Package',
      duration: '4-6 weeks',
      price: 'Starting at $7,500',
      features: [
        'Comprehensive audit & fix',
        'Full performance optimization',
        'Complete SEO overhaul',
        'Accessibility compliance',
        'Conversion rate optimization',
        'Ongoing monitoring setup'
      ],
      icon: <RocketIcon className="w-8 h-8" />,
      gradient: 'from-purple-500 to-pink-600',
      popular: true
    },
    {
      name: 'Full Redesign / Rebuild',
      duration: '12-16 weeks',
      price: 'Custom Quote',
      features: [
        'Complete website redesign',
        'Modern tech stack migration',
        'Full performance optimization',
        'Advanced SEO strategy',
        'WCAG 2.1 AA compliance',
        'Conversion-focused UX/UI',
        'Content strategy & optimization',
        'Ongoing support & maintenance'
      ],
      icon: <TrophyIcon className="w-8 h-8" />,
      gradient: 'from-orange-500 to-red-600'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent mb-4">
          What We Can Do For You
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We offer comprehensive packages to help you fix issues and improve your website's performance, SEO, accessibility, and conversion rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, index) => (
          <div
            key={index}
            className={`relative bg-white rounded-2xl shadow-lg p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
              pkg.popular
                ? 'border-blue-500 scale-105 ring-4 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center text-white mx-auto mb-4 shadow-lg`}>
                {pkg.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              <div className="text-sm text-gray-500 mb-1">{pkg.duration}</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {pkg.price}
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {pkg.features.map((feature, fIndex) => (
                <li key={fIndex} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                pkg.popular
                  ? `bg-gradient-to-r ${pkg.gradient} text-white hover:opacity-90`
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-2xl p-10 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="relative">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Book a free 15-minute consultation call to discuss your needs and get a personalized action plan
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              📞 Book a 15-min Teardown Call
            </button>
            <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-all duration-200 border-2 border-white/30 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              📧 Send Report to Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportUpsell;
