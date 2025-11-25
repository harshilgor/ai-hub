import { Link, useLocation } from 'react-router-dom';
import { Brain, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const location = useLocation();
  const [showFeaturesMenu, setShowFeaturesMenu] = useState(false);
  const isLandingPage = location.pathname === '/';

  // Show simplified header on landing page
  if (isLandingPage) {
    return (
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-xl font-bold">
              <Brain className="w-7 h-7" />
              <span>Insider Info</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <div className="relative">
                <button
                  onMouseEnter={() => setShowFeaturesMenu(true)}
                  onMouseLeave={() => setShowFeaturesMenu(false)}
                  className="flex items-center gap-1 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text transition-colors"
                >
                  Features
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showFeaturesMenu && (
                  <div
                    onMouseEnter={() => setShowFeaturesMenu(true)}
                    onMouseLeave={() => setShowFeaturesMenu(false)}
                    className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-200 dark:border-dark-border overflow-hidden"
                  >
                    <Link to="/research" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                      <div className="font-medium">Research Papers</div>
                      <div className="text-xs text-gray-500 dark:text-dark-text-secondary">Latest AI research</div>
                    </Link>
                    <Link to="/yc-explorer" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                      <div className="font-medium">YC Explorer</div>
                      <div className="text-xs text-gray-500 dark:text-dark-text-secondary">Discover startups</div>
                    </Link>
                    <Link to="/trends" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                      <div className="font-medium">Trends</div>
                      <div className="text-xs text-gray-500 dark:text-dark-text-secondary">Market insights</div>
                    </Link>
                    <Link to="/industry-insights" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                      <div className="font-medium">Industry Insights</div>
                      <div className="text-xs text-gray-500 dark:text-dark-text-secondary">Sector analysis</div>
                    </Link>
                  </div>
                )}
              </div>
              <Link to="/home" className="text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text transition-colors">
                Dashboard
              </Link>
              <Link to="/my-tracker" className="text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text transition-colors">
                My Tracker
              </Link>
            </nav>

            {/* CTA Button */}
            <Link
              to="/home"
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Original header for other pages
  return (
    <header className="sticky top-0 z-50 glass-card border-b border-light-border dark:border-dark-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <Brain className="w-7 h-7" />
            <span>AI Hub</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link to="/home" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors">
              Home
            </Link>
            <Link to="/research" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors">
              Research
            </Link>
            <Link to="/trends" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors">
              Trends
            </Link>
            <Link to="/my-tracker" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors">
              My Tracker
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

