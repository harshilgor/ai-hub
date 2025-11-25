import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import UseCasesSection from '../components/landing/UseCasesSection';
import CTASection from '../components/landing/CTASection';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <UseCasesSection />
      <CTASection />
      
      {/* Footer */}
      <footer className="bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-xs text-gray-500 dark:text-dark-text-secondary">
              © Copyright 2025 Insider Info
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 dark:text-dark-text-secondary">
              <Link to="/research" className="hover:text-gray-900 dark:hover:text-dark-text transition-colors">
                Research
              </Link>
              <Link to="/trends" className="hover:text-gray-900 dark:hover:text-dark-text transition-colors">
                Trends
              </Link>
              <Link to="/yc-explorer" className="hover:text-gray-900 dark:hover:text-dark-text transition-colors">
                Startups
              </Link>
              <Link to="/my-tracker" className="hover:text-gray-900 dark:hover:text-dark-text transition-colors">
                My Tracker
              </Link>
              <span className="text-gray-400">|</span>
              <a href="#" className="hover:text-gray-900 dark:hover:text-dark-text transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-dark-text transition-colors">
                Terms & Conditions
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

