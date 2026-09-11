import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { CompassLogo } from './CompassLogo';
import {
  Bookmark,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Compass,
  Moon,
  Sun,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';
import { LanguageSelector } from './LanguageSelector';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { savedSchemeIds, handleCheckEligibility, startTour, theme, toggleTheme } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHowItWorksClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname === '/' || location.pathname === '') {
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById('how-it-works');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/80 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <CompassLogo size="sm" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/70 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-md">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'text-teal-950 dark:text-emerald-300 bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>

            <NavLink
              id="nav-explore"
              to="/explore"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'text-teal-950 dark:text-emerald-300 bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {t('nav.explore')}
            </NavLink>

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all duration-200 cursor-pointer"
            >
              {t('nav.howItWorks')}
            </a>

            <NavLink
              id="nav-ai-advisor"
              to="/assistant"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 relative group ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-teal-800 to-slate-950 dark:from-teal-700 dark:to-slate-900 shadow-xs'
                    : 'text-teal-900 dark:text-emerald-300 bg-teal-100/70 dark:bg-teal-950/60 hover:bg-teal-200/70 dark:hover:bg-teal-900/60 border border-teal-300/60 dark:border-teal-700/60'
                }`
              }
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>{t('nav.aiAdvisor')}</span>
              </div>
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'text-teal-950 dark:text-emerald-300 bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {t('nav.about')}
            </NavLink>
          </nav>

          {/* Right Action Icons & CTA */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Unified Utility Cluster */}
            <div className="flex items-center space-x-1 bg-slate-100/70 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-md">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer shadow-3xs hover:shadow-xs"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
                )}
              </button>

              {/* Interactive Tour Button */}
              <button
                type="button"
                onClick={startTour}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold text-teal-800 dark:text-emerald-300 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer shadow-3xs hover:shadow-xs"
                title="Take interactive product tour"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">{t('nav.tour')}</span>
              </button>

              {/* Language Selector Dropdown */}
              <LanguageSelector variant="navbar" align="right" />

              {/* Bookmarks Icon */}
              <Link
                id="nav-saved-schemes"
                to="/dashboard"
                className="relative p-1.5 text-slate-600 dark:text-slate-300 hover:text-teal-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title={t('nav.savedSchemes')}
              >
                <Bookmark className="w-4 h-4" />
                {savedSchemeIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-[17px] text-[9.5px] font-black text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full px-1 shadow-xs ring-2 ring-white dark:ring-slate-900">
                    {savedSchemeIds.length}
                  </span>
                )}
              </Link>
            </div>

            {/* Check Eligibility CTA */}
            <button
              id="nav-check-eligibility"
              type="button"
              onClick={() => handleCheckEligibility(navigate)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-950 hover:from-teal-800 hover:to-slate-900 text-white text-xs font-extrabold rounded-xl shadow-sm shadow-teal-900/25 hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer group"
            >
              <Compass className="w-4 h-4 text-emerald-300 group-hover:rotate-45 transition-transform duration-300" />
              <span className="whitespace-nowrap">{t('nav.checkEligibility')}</span>
            </button>
          </div>

          {/* Mobile Action Controls */}
          <div className="flex md:hidden items-center space-x-1.5">
            {/* Theme Toggle on mobile bar */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all"
              aria-label="Toggle Theme"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Compact Language Selector */}
            <LanguageSelector variant="compact" align="right" />

            {/* Mobile Drawer Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:outline-hidden cursor-pointer active:scale-95 transition-all"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2.5 animate-in slide-in-from-top-2 duration-200 shadow-xl max-w-full overflow-hidden">
          <div className="space-y-1">
            <NavLink
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-teal-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <span>{t('nav.home')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <NavLink
              to="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-teal-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <span>{t('nav.explore')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            >
              <span>{t('nav.howItWorks')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>

            <NavLink
              to="/assistant"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-900 dark:bg-teal-900 text-white shadow-xs'
                    : 'bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-emerald-300'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{t('nav.aiAdvisor')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <NavLink
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-teal-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <span>{t('nav.about')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <NavLink
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-teal-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                <span>{t('nav.savedSchemes')} ({savedSchemeIds.length})</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                startTour();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-teal-800 dark:text-emerald-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors cursor-pointer border border-teal-200/50 dark:border-teal-800/50"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                <span>{t('nav.tour')} ✨</span>
              </div>
              <ChevronRight className="w-4 h-4 text-teal-500" />
            </button>

            {/* Mobile Theme Switcher Row */}
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>
            </div>

            {/* Mobile Language Switcher Row */}
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('nav.language')}:</span>
              </div>
              <LanguageSelector variant="compact" align="right" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleCheckEligibility(navigate);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-slate-950 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              <Compass className="w-4 h-4 text-emerald-300" />
              <span>{t('nav.checkEligibility')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
