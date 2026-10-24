import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Bookmark, Search, Trash2, X } from 'lucide-react';
import { CELESTIAL_BODIES } from '../data/celestialData';
import { NOTABLE_STARS, SPACE_MISSIONS } from '../data/starsAndMissions';
import { UI_TEXT, tText } from '../data/translations';
import type { Language } from '../types/astronomy';

interface SearchAndBookmarksModalProps {
  open: boolean;
  initialTab: 'search' | 'bookmarks';
  onClose: () => void;
  lang: Language;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onSelectCelestial: (bodyId: string) => void;
  onSelectStar: (starId: string) => void;
  onSelectMission: (missionId: string) => void;
}

export const SearchAndBookmarksModal: React.FC<SearchAndBookmarksModalProps> = ({
  open,
  initialTab,
  onClose,
  lang,
  bookmarks,
  onToggleBookmark,
  onSelectCelestial,
  onSelectStar,
  onSelectMission,
}) => {
  const [tab, setTab] = useState<'search' | 'bookmarks'>(initialTab);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const ui = UI_TEXT[lang];

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bodies = CELESTIAL_BODIES.filter(
      (b) =>
        !q ||
        b.name.en.toLowerCase().includes(q) ||
        b.name.uz.toLowerCase().includes(q) ||
        b.subtype.en.toLowerCase().includes(q) ||
        b.subtype.uz.toLowerCase().includes(q)
    );
    const stars = NOTABLE_STARS.filter(
      (s) =>
        !q ||
        s.name.en.toLowerCase().includes(q) ||
        s.name.uz.toLowerCase().includes(q) ||
        s.spectralClass.toLowerCase().includes(q) ||
        s.constellation.en.toLowerCase().includes(q)
    );
    const missions = SPACE_MISSIONS.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.agency.toLowerCase().includes(q) ||
        m.targetDisplay.en.toLowerCase().includes(q) ||
        m.targetDisplay.uz.toLowerCase().includes(q)
    );
    return { bodies, stars, missions };
  }, [query]);

  const savedItems = useMemo(() => {
    return bookmarks
      .map((id) => {
        const body = CELESTIAL_BODIES.find((b) => b.id === id);
        if (body) {
          return {
            id: body.id,
            kind: 'celestial' as const,
            title: tText(body.name, lang),
            meta: `${tText(body.subtype, lang)} · ${tText(body.metrics.distanceDisplay, lang)}`,
            accent: body.accentColor,
          };
        }
        const star = NOTABLE_STARS.find((s) => s.id === id);
        if (star) {
          return {
            id: star.id,
            kind: 'star' as const,
            title: tText(star.name, lang),
            meta: `${star.spectralClass} · ${tText(star.distanceDisplay, lang)}`,
            accent: star.colorHex,
          };
        }
        return null;
      })
      .filter(Boolean) as {
      id: string;
      kind: 'celestial' | 'star';
      title: string;
      meta: string;
      accent: string;
    }[];
  }, [bookmarks, lang]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 pt-20 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={ui.navSearchAction}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#090E1C] border border-white/15 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Segmented Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="inline-flex items-center gap-1 p-1 bg-[#050811] rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setTab('search')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{ui.navSearchAction}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('bookmarks')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'bookmarks'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>
                {ui.bookmarks} ({savedItems.length})
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {tab === 'search' ? (
          <div>
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ui.searchPlaceholder}
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {lang === 'uz' ? 'Tozalash' : 'Clear'}
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/5">
              {results.bodies.length === 0 &&
              results.stars.length === 0 &&
              results.missions.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  {ui.noSearchResults}
                </div>
              ) : (
                <>
                  {results.bodies.length > 0 && (
                    <div className="p-3">
                      <p className="px-2 pb-1.5 text-xs font-medium text-slate-400">
                        {lang === 'uz'
                          ? 'Quyosh tizimi jismlari (3D)'
                          : 'Solar System Bodies (3D)'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {results.bodies.slice(0, 12).map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              onSelectCelestial(b.id);
                              onClose();
                            }}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors group"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-100 group-hover:text-blue-300 truncate">
                                {tText(b.name, lang)}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {tText(b.subtype, lang)}
                              </p>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.stars.length > 0 && (
                    <div className="p-3">
                      <p className="px-2 pb-1.5 text-xs font-medium text-slate-400">
                        {lang === 'uz' ? 'Mashhur yulduzlar' : 'Notable Stars'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {results.stars.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onSelectStar(s.id);
                              onClose();
                            }}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors group"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-100 group-hover:text-violet-300 truncate">
                                {tText(s.name, lang)}
                              </p>
                              <p className="text-xs text-slate-500 font-mono truncate">
                                {s.spectralClass} · {s.temperatureK} K
                              </p>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.missions.length > 0 && (
                    <div className="p-3">
                      <p className="px-2 pb-1.5 text-xs font-medium text-slate-400">
                        {lang === 'uz' ? 'Kosmik missiyalar' : 'Space Missions'}
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {results.missions.slice(0, 5).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              onSelectMission(m.id);
                              onClose();
                            }}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors group"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-100 group-hover:text-blue-300 truncate">
                                {m.name}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {m.agency} · {tText(m.targetDisplay, lang)}
                              </p>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {savedItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400 max-w-md mx-auto">
                {ui.noBookmarks}
              </p>
            ) : (
              <div className="space-y-1.5">
                {savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-[#050811] border border-white/10"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (item.kind === 'celestial') {
                          onSelectCelestial(item.id);
                        } else {
                          onSelectStar(item.id);
                        }
                        onClose();
                      }}
                      className="flex-1 text-left min-w-0 group"
                    >
                      <p className="text-sm font-medium text-white group-hover:text-blue-300 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.meta}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(item.id)}
                      aria-label="Remove bookmark"
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
