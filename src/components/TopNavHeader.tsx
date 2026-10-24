import React, { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import type { AppSection, Language } from '../types/astronomy';
import { UI_TEXT } from '../data/translations';

interface TopNavHeaderProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  onOpenSearch: () => void;
  lang: Language;
  onToggleLanguage: (lang: Language) => void;
}

export const TopNavHeader: React.FC<TopNavHeaderProps> = ({
  activeSection,
  onNavigate,
  onOpenSearch,
  lang,
  onToggleLanguage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const ui = UI_TEXT[lang];

  const navItems: { id: AppSection; label: string }[] = [
    { id: 'explorer', label: ui.navExplorer },
    { id: 'planets', label: ui.navPlanets },
    { id: 'stars', label: ui.navStars },
    { id: 'missions', label: ui.navMissions },
    { id: 'learn', label: ui.navLearn },
  ];

  const handleSelect = (section: AppSection) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 bg-[#050811]/95 border-b border-white/10">
        {/* Zone 1: Single text element Brand wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleSelect('home');
          }}
          className="font-display text-lg font-bold tracking-tight text-white hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-400 rounded"
        >
          Solar System 3D
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(item.id);
                }}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 rounded ${
                  isActive
                    ? 'text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-blue-400'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action (Desktop) + Mobile menu trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label={ui.navSearchAction}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-300"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{ui.navSearchAction}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/15 text-slate-200 hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-14 z-40 md:hidden bg-[#070B16] border-b border-white/15 px-5 py-4 shadow-2xl">
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            <button
              type="button"
              onClick={() => handleSelect('home')}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                activeSection === 'home'
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {lang === 'uz' ? 'Bosh sahifa' : 'Home'}
            </button>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  activeSection === item.id
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {lang === 'uz' ? 'Tilni tanlash' : 'Interface Language'}
            </span>
            <div className="inline-flex rounded-lg bg-[#0D1324] p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => onToggleLanguage('en')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onToggleLanguage('uz')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  lang === 'uz' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                O‘Z
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
