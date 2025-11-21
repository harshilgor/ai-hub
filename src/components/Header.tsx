import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Home, TrendingUp, Network, FileText, Building2, Search, Bell, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/yc-explorer', icon: Building2, label: 'YC Explorer' },
    { path: '/trends', icon: TrendingUp, label: 'Trends' },
    { path: '/knowledge-graph', icon: Network, label: 'Knowledge Graph' },
    { path: '/research', icon: FileText, label: 'Research' },
    { path: '/industries', icon: Building2, label: 'Industries' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-light-border dark:border-dark-border shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-6 flex-1">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="text-3xl group-hover:scale-110 transition-transform">🤖</div>
              <div className="hidden lg:block">
                <div className="font-bold text-lg bg-gradient-to-r from-primary-light to-insight-light bg-clip-text text-transparent">
                  AI Intelligence Hub
                </div>
              </div>
            </Link>

            <div className="relative flex-1 max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
              <input
                type="text"
                placeholder="Search startups, papers, topics..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden xl:flex items-center gap-1 mx-6">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path || 
                (path !== '/' && location.pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
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

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            <button className="relative p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
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

        {/* Mobile Navigation */}
        <nav className="xl:hidden flex items-center gap-2 mt-4 overflow-x-auto pb-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || 
              (path !== '/' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-sm ${
                  isActive
                    ? 'bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark font-medium'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-bg'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

