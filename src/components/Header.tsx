import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, FileText, Building2, User } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/industry-insights', icon: Building2, label: 'Industry Insights' },
    { path: '/trends', icon: TrendingUp, label: 'Trends' },
    { path: '/research', icon: FileText, label: 'Research' },
    { path: '/industries', icon: Building2, label: 'Industries' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-light-border dark:border-dark-border shadow-sm">
      <div className="max-w-[1400px] mx-auto px-8 py-4">
        <div className="flex items-center gap-8">
          {/* Left: Navigation */}
          <nav className="flex items-center gap-2 min-w-0 overflow-x-auto">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path || 
                (path !== '/' && location.pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark font-medium'
                      : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-bg'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right: Stats & User */}
          <div className="flex items-center gap-8 flex-shrink-0">
            {/* Live Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center min-w-[80px]">
                <div className="text-2xl font-bold text-primary-light dark:text-primary-dark">487</div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">Startups funded</div>
              </div>
              <div className="text-center min-w-[80px]">
                <div className="text-2xl font-bold text-success-light dark:text-success-dark">$12.3B</div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">Raised</div>
              </div>
              <div className="text-center min-w-[80px]">
                <div className="text-2xl font-bold text-insight-light dark:text-insight-dark">23</div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">New papers</div>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-insight-light flex items-center justify-center text-white font-semibold">
                  <User className="w-5 h-5" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-lg border border-light-border dark:border-dark-border overflow-hidden animate-fade-in">
                  <Link
                    to="/my-tracker"
                    className="block px-4 py-3 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="font-medium">My Tracker</div>
                  </Link>
                  <Link
                    to="/my-tracker"
                    className="block px-4 py-3 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="font-medium">Saved Items</div>
                  </Link>
                  <div className="border-t border-light-border dark:border-dark-border"></div>
                  <button className="w-full text-left px-4 py-3 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors text-red-500">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}

