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
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';
import { LanguageSelector } from './LanguageSelector';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { savedSchemeIds, handleCheckEligibility } = useAppStore();
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
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <CompassLogo size="md" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-teal-900 bg-slate-100'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>

            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-teal-900 bg-slate-100'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                }`
              }
            >
              {t('nav.explore')}
            </NavLink>

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-all cursor-pointer"
            >
              {t('nav.howItWorks')}
            </a>

            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all text-teal-800 bg-teal-50 hover:bg-teal-100 flex items-center gap-1.5 font-bold ${
                  isActive ? 'ring-1 ring-teal-300' : ''
                }`
              }
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
              <span>{t('nav.aiAdvisor')}</span>
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-teal-900 bg-slate-100'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                }`
              }
            >
              {t('nav.about')}
            </NavLink>
          </nav>

          {/* Right Action Icons & CTA */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Language Selector Dropdown */}
            <LanguageSelector variant="navbar" align="right" />

            {/* Bookmarks Icon */}
            <Link
              to="/dashboard"
              className="relative p-2.5 text-slate-700 hover:text-teal-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title={t('nav.savedSchemes')}
            >
              <Bookmark className="w-5 h-5" />
              {savedSchemeIds.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-teal-600 rounded-full px-1 shadow-xs ring-2 ring-white">
                  {savedSchemeIds.length}
                </span>
              )}
            </Link>

            {/* Check Eligibility CTA */}
            <button
              type="button"
              onClick={() => handleCheckEligibility(navigate)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white text-sm font-bold rounded-xl shadow-sm shadow-teal-900/20 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Compass className="w-4 h-4 text-emerald-300" />
              <span>{t('nav.checkEligibility')}</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button & Mobile Language Selector */}
          <div className="flex md:hidden items-center space-x-1.5">
            <LanguageSelector variant="compact" align="right" />

            <Link
              to="/dashboard"
              className="relative p-2 text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <Bookmark className="w-5 h-5" />
              {savedSchemeIds.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {savedSchemeIds.length}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <NavLink
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
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
                `flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <span>{t('nav.explore')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <span>{t('nav.howItWorks')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>

            <NavLink
              to="/assistant"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>{t('nav.aiAdvisor')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <NavLink
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
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
                `flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-teal-600" />
                <span>{t('nav.savedSchemes')} ({savedSchemeIds.length})</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            {/* Mobile Language Switcher Row */}
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">{t('nav.language')}:</span>
              </div>
              <LanguageSelector variant="compact" align="right" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleCheckEligibility(navigate);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer"
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
