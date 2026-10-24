import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Globe,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { CELESTIAL_BODIES, GUIDED_TOUR_STOPS } from '../data/celestialData';
import { UI_TEXT, tText } from '../data/translations';
import type {
  AppSection,
  CelestialBody,
  Language,
} from '../types/astronomy';

interface ExplorerOverlayProps {
  mode: 'home' | 'explorer';
  onNavigate: (section: AppSection) => void;
  selectedBodyId: string | null;
  onSelectBody: (id: string | null) => void;
  paused: boolean;
  onTogglePause: () => void;
  isRealTimeJ2000: boolean;
  onSetRealTimeJ2000: (live: boolean) => void;
  speedDaysPerSecond: number;
  onChangeSpeed: (daysPerSec: number) => void;
  onSyncUtcNow: () => void;
  onResetOverview: () => void;
  simDateMs: number;
  showOrbits: boolean;
  onToggleOrbits: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showBelts: boolean;
  onToggleBelts: () => void;
  proportionalSizes: boolean;
  onToggleProportionalSizes: () => void;
  dockCollapsed: boolean;
  onToggleDock: () => void;
  tourStep: number | null;
  onStartTour: () => void;
  onChangeTourStep: (step: number | null) => void;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onOpenBookmarksModal: () => void;
  lang: Language;
  onToggleLanguage: (lang: Language) => void;
}

const SPEED_PRESETS = [
  { label: '1h/s', daysPerSec: 1 / 24 },
  { label: '1d/s', daysPerSec: 1 },
  { label: '15d/s', daysPerSec: 15 },
  { label: '90d/s', daysPerSec: 90 },
];

export const ExplorerOverlay: React.FC<ExplorerOverlayProps> = ({
  mode,
  onNavigate,
  selectedBodyId,
  onSelectBody,
  paused,
  onTogglePause,
  isRealTimeJ2000,
  onSetRealTimeJ2000,
  speedDaysPerSecond,
  onChangeSpeed,
  onSyncUtcNow,
  onResetOverview,
  simDateMs,
  showOrbits,
  onToggleOrbits,
  showLabels,
  onToggleLabels,
  showBelts,
  onToggleBelts,
  proportionalSizes,
  onToggleProportionalSizes,
  dockCollapsed,
  onToggleDock,
  tourStep,
  onStartTour,
  onChangeTourStep,
  bookmarks,
  onToggleBookmark,
  onOpenBookmarksModal,
  lang,
  onToggleLanguage,
}) => {
  const ui = UI_TEXT[lang];
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'planet' | 'moon' | 'dwarf-planet' | 'small'
  >('all');
  const [quickFilter, setQuickFilter] = useState('');

  const selectedBody: CelestialBody | null = useMemo(
    () => CELESTIAL_BODIES.find((b) => b.id === selectedBodyId) ?? null,
    [selectedBodyId]
  );

  const childMoons = useMemo(() => {
    if (!selectedBody) return [];
    const targetParentId =
      selectedBody.category === 'moon' ? selectedBody.parentId : selectedBody.id;
    if (!targetParentId) return [];
    return CELESTIAL_BODIES.filter((b) => b.parentId === targetParentId);
  }, [selectedBody]);

  const parentBody = useMemo(() => {
    if (!selectedBody?.parentId) return null;
    return CELESTIAL_BODIES.find((b) => b.id === selectedBody.parentId) ?? null;
  }, [selectedBody]);

  const filteredBodies = useMemo(() => {
    const q = quickFilter.trim().toLowerCase();
    return CELESTIAL_BODIES.filter((b) => {
      if (categoryFilter === 'planet' && b.category !== 'planet') return false;
      if (categoryFilter === 'moon' && b.category !== 'moon') return false;
      if (categoryFilter === 'dwarf-planet' && b.category !== 'dwarf-planet')
        return false;
      if (
        categoryFilter === 'small' &&
        b.category !== 'belt' &&
        b.category !== 'comet' &&
        b.category !== 'neo'
      )
        return false;

      if (q) {
        return (
          b.name.en.toLowerCase().includes(q) ||
          b.name.uz.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categoryFilter, quickFilter]);

  const formattedUtc = useMemo(() => {
    try {
      const d = new Date(simDateMs);
      return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    } catch {
      return 'J2000 Epoch';
    }
  }, [simDateMs]);

  const activeTourStop =
    tourStep !== null ? GUIDED_TOUR_STOPS[tourStep] ?? null : null;

  return (
    <div className="pointer-events-none fixed inset-0 top-14 z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Sub-Toolbar: Ephemeris Clock, Language Switch, Bookmarks & Return Button */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-[#070B16]/92 border border-white/10 rounded-lg px-3 py-1.5">
          <span className="font-mono text-xs text-slate-200 tabular-nums">
            {formattedUtc}
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="text-xs text-slate-400">
            {isRealTimeJ2000 ? ui.liveJ2000Desc : ui.eduSimDesc}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {selectedBody && (
            <button
              type="button"
              onClick={() => {
                onSelectBody(null);
                onResetOverview();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{ui.returnToSystem}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenBookmarksModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#070B16]/92 hover:bg-[#0E1528] text-slate-200 border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {ui.bookmarks} ({bookmarks.length})
            </span>
          </button>

          {/* Language Toggle EN / O‘Z */}
          <div
            role="group"
            aria-label="Language switcher"
            className="inline-flex items-center bg-[#070B16]/92 border border-white/10 rounded-lg p-0.5"
          >
            <button
              type="button"
              onClick={() => onToggleLanguage('en')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                lang === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onToggleLanguage('uz')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                lang === 'uz'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              O‘Z
            </button>
          </div>
        </div>
      </div>

      {/* HOME MODE: Cinematic Editorial Hero Overlay (Non-Occluding Left Anchor) */}
      {mode === 'home' && !selectedBody && tourStep === null && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto my-auto max-w-xl bg-gradient-to-r from-[#04060D]/92 via-[#04060D]/80 to-transparent p-5 sm:p-7 rounded-2xl border border-white/10"
        >
          <p className="text-xs font-medium text-blue-300">
            NASA JPL J2000 Ephemeris · WebGL 3D Observatory
          </p>

          <h1
            className="mt-2 font-display font-bold tracking-tight text-white leading-[1.08]"
            style={{
              fontSize: 'clamp(2.25rem, 4vw, 3.6rem)',
              textWrap: 'balance',
            }}
          >
            {ui.heroHeadline}
          </h1>

          <p className="mt-2.5 font-display text-lg sm:text-xl font-medium text-violet-200">
            {ui.heroSubtitle}
          </p>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-[56ch]">
            {ui.heroDescription}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('explorer')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Compass className="w-4 h-4" />
              <span>{ui.ctaExploreCosmos}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('planets')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-100 bg-[#0D1426] hover:bg-[#15203B] border border-white/15 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-4 h-4 text-violet-400" />
              <span>{ui.ctaViewPlanets}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('explorer');
                onStartTour();
              }}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              {ui.heroQuickTour}
            </button>
          </div>

          <p className="mt-5 text-xs text-slate-400 leading-relaxed">
            {ui.heroScaleNotice}
          </p>
        </motion.div>
      )}

      {/* Guided Tour Active Step Narration Card */}
      {activeTourStop && tourStep !== null && (
        <div className="pointer-events-auto mx-auto max-w-lg w-full bg-[#070B16]/95 border border-blue-400/30 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-blue-300 tabular-nums">
              {String(tourStep + 1).padStart(2, '0')} / {GUIDED_TOUR_STOPS.length}
            </span>
            <button
              type="button"
              onClick={() => onChangeTourStep(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              {ui.exitTour}
            </button>
          </div>
          <h3 className="mt-1 font-display text-base font-semibold text-white">
            {tText(activeTourStop.title, lang)}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {tText(activeTourStop.narration, lang)}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={tourStep === 0}
              onClick={() => onChangeTourStep(Math.max(0, tourStep - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 disabled:opacity-40 whitespace-nowrap"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{ui.prevStop}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (tourStep + 1 < GUIDED_TOUR_STOPS.length) {
                  onChangeTourStep(tourStep + 1);
                } else {
                  onChangeTourStep(null);
                }
              }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap"
            >
              <span>
                {tourStep + 1 < GUIDED_TOUR_STOPS.length
                  ? ui.nextStop
                  : ui.exitTour}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Contextual Celestial Inspector Drawer (Appears ONLY when a celestial body is clicked) */}
      <AnimatePresence>
        {selectedBody && (
          <motion.aside
            key={selectedBody.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            aria-label={tText(selectedBody.name, lang)}
            className="pointer-events-auto fixed right-4 sm:right-6 top-28 bottom-28 w-[calc(100vw-2rem)] sm:w-96 bg-[#080C18]/96 border border-white/12 rounded-xl flex flex-col overflow-hidden shadow-2xl z-30"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  {tText(selectedBody.subtype, lang)}
                  {parentBody
                    ? ` · ${ui.parentBody}: ${tText(parentBody.name, lang)}`
                    : ''}
                </p>
                <h2 className="mt-0.5 font-display text-2xl font-bold text-white truncate">
                  {tText(selectedBody.name, lang)}
                </h2>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(selectedBody.id)}
                  aria-label={ui.saveBookmark}
                  className={`p-2 rounded-lg border transition-colors ${
                    bookmarks.includes(selectedBody.id)
                      ? 'bg-blue-600/25 border-blue-400/50 text-blue-300'
                      : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectBody(null)}
                  aria-label="Close inspector"
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Scientific Details */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <p className="text-sm text-slate-300 leading-relaxed">
                {tText(selectedBody.summary, lang)}
              </p>

              {/* Parent Back-Button if inspecting a Moon */}
              {parentBody && (
                <button
                  type="button"
                  onClick={() => onSelectBody(parentBody.id)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#0D1426] hover:bg-[#131D36] border border-white/10 text-xs font-medium text-blue-300"
                >
                  <span>
                    {lang === 'uz'
                      ? `${tText(parentBody.name, lang)} sayyorasiga o‘tish`
                      : `Return to ${tText(parentBody.name, lang)}`}
                  </span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              )}

              {/* Clickable Moons System */}
              {childMoons.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 mb-2">
                    {ui.majorMoonsIn3D} ({childMoons.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {childMoons.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelectBody(m.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                          m.id === selectedBody.id
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-[#0D1426] text-slate-200 border-white/10 hover:border-blue-400/50'
                        }`}
                      >
                        {tText(m.name, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Physical & Orbital Metrics */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-white/10">
                <div>
                  <p className="text-[11px] text-slate-400">{ui.diameter}</p>
                  <p className="font-mono text-xs font-medium text-slate-100 tabular-nums mt-0.5">
                    {tText(selectedBody.metrics.diameterDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">{ui.mass}</p>
                  <p className="font-mono text-xs font-medium text-slate-100 tabular-nums mt-0.5">
                    {tText(selectedBody.metrics.massDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">{ui.gravity}</p>
                  <p className="font-mono text-xs font-medium text-slate-100 tabular-nums mt-0.5">
                    {tText(selectedBody.metrics.gravityDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">{ui.orbitalPeriod}</p>
                  <p className="font-mono text-xs font-medium text-slate-100 tabular-nums mt-0.5">
                    {tText(selectedBody.metrics.orbitalPeriodDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">{ui.distanceFromSun}</p>
                  <p className="font-mono text-xs font-medium text-slate-100 tabular-nums mt-0.5">
                    {tText(selectedBody.metrics.distanceDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">{ui.meanTemperature}</p>
                  <p className="font-mono text-xs font-medium text-slate-100 tabular-nums mt-0.5">
                    {tText(selectedBody.metrics.temperatureDisplay, lang)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-slate-400">{ui.atmosphere}</p>
                  <p className="font-mono text-xs text-slate-200 mt-0.5">
                    {tText(selectedBody.metrics.atmosphereDisplay, lang)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-slate-400">{ui.knownMoons}</p>
                  <p className="font-mono text-xs text-slate-200 tabular-nums mt-0.5">
                    {selectedBody.metrics.knownMoons !== null
                      ? String(selectedBody.metrics.knownMoons)
                      : ui.dataUnavailable}
                  </p>
                </div>
              </div>

              {/* Confirmed Scientific Facts */}
              <div className="pt-3 border-t border-white/10">
                <h3 className="text-xs font-semibold text-white mb-2">
                  {ui.factsHeading}
                </h3>
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  {selectedBody.facts.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-400 shrink-0">·</span>
                      <span>{tText(f, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exploration History & Missions */}
              <div className="pt-3 border-t border-white/10">
                <h3 className="text-xs font-semibold text-white mb-1.5">
                  {ui.explorationHeading}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tText(selectedBody.explorationHistory, lang)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {selectedBody.missions.join(' · ')}
                </p>
              </div>

              {/* Source Attribution */}
              <div className="pt-3 border-t border-white/10 text-[11px] text-slate-500">
                {ui.sourceLabel}: {selectedBody.sourceCredit}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Unified Collapsible Bottom Control Dock (Zero Center Occlusion) */}
      <div className="pointer-events-auto mx-auto w-full max-w-[960px] flex flex-col items-center">
        {/* Collapse / Expand Cinema Toggle */}
        <button
          type="button"
          onClick={onToggleDock}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-[#080C18]/95 border border-b-0 border-white/12 text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>{ui.showControls} (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>{ui.hideControls} (H)</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="w-full bg-[#080C18]/95 border border-white/12 rounded-xl p-3 shadow-2xl space-y-2.5">
            {/* Explorer Mode: Filterable Celestial Quick-Jump Bar */}
            {mode === 'explorer' && (
              <div className="pb-2.5 border-b border-white/10 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {(
                      [
                        { id: 'all', label: ui.catAll },
                        { id: 'planet', label: ui.catPlanets },
                        { id: 'moon', label: ui.catMoons },
                        { id: 'dwarf-planet', label: ui.catDwarf },
                        { id: 'small', label: ui.catSmall },
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          categoryFilter === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={quickFilter}
                    onChange={(e) => setQuickFilter(e.target.value)}
                    placeholder={
                      lang === 'uz' ? 'Jismni filtrlash...' : 'Filter bodies...'
                    }
                    aria-label="Filter celestial bodies"
                    className="w-40 sm:w-48 px-2.5 py-1 text-xs rounded-md bg-[#040710] border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Horizontal Scrollable Celestial Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {filteredBodies.map((body) => {
                    const active = selectedBodyId === body.id;
                    return (
                      <button
                        key={body.id}
                        type="button"
                        onClick={() => onSelectBody(body.id)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-blue-600 text-white border-blue-400 font-medium'
                            : 'bg-[#0D1324] text-slate-300 border-white/8 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {tText(body.name, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Playback, Speed, Visual Layers & Camera Presets Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Left: Play/Pause + Speed Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={onTogglePause}
                  aria-label={paused ? ui.play : ui.pause}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {paused ? (
                    <Play className="w-3.5 h-3.5" />
                  ) : (
                    <Pause className="w-3.5 h-3.5" />
                  )}
                  <span>{paused ? ui.play : ui.pause}</span>
                </button>

                <div className="inline-flex items-center bg-[#040710] border border-white/10 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => onSetRealTimeJ2000(true)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      isRealTimeJ2000
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ui.liveJ2000}
                  </button>
                  {SPEED_PRESETS.map((sp) => {
                    const active =
                      !isRealTimeJ2000 &&
                      Math.abs(speedDaysPerSecond - sp.daysPerSec) < 0.001;
                    return (
                      <button
                        key={sp.label}
                        type="button"
                        onClick={() => {
                          onSetRealTimeJ2000(false);
                          onChangeSpeed(sp.daysPerSec);
                        }}
                        className={`px-2 py-1 font-mono text-xs rounded-md transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sp.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={onSyncUtcNow}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#0D1324] hover:bg-[#15203B] text-slate-300 border border-white/10 whitespace-nowrap shrink-0"
                >
                  {ui.resetNow}
                </button>
              </div>

              {/* Right: Layer Toggles, Scale Toggle, Tour & Reset */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={onToggleOrbits}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    showOrbits
                      ? 'bg-blue-600/20 text-blue-300 border-blue-400/40'
                      : 'bg-[#0D1324] text-slate-400 border-white/10'
                  }`}
                >
                  {ui.orbitsToggle}
                </button>
                <button
                  type="button"
                  onClick={onToggleLabels}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    showLabels
                      ? 'bg-blue-600/20 text-blue-300 border-blue-400/40'
                      : 'bg-[#0D1324] text-slate-400 border-white/10'
                  }`}
                >
                  {ui.labelsToggle}
                </button>
                <button
                  type="button"
                  onClick={onToggleBelts}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    showBelts
                      ? 'bg-blue-600/20 text-blue-300 border-blue-400/40'
                      : 'bg-[#0D1324] text-slate-400 border-white/10'
                  }`}
                >
                  {ui.beltsToggle}
                </button>
                <button
                  type="button"
                  onClick={onToggleProportionalSizes}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    proportionalSizes
                      ? 'bg-violet-600/25 text-violet-200 border-violet-400/50'
                      : 'bg-[#0D1324] text-slate-300 border-white/10'
                  }`}
                >
                  {proportionalSizes
                    ? ui.proportionalToggle
                    : ui.exploratoryToggle}
                </button>
                <button
                  type="button"
                  onClick={onStartTour}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#0D1324] hover:bg-[#15203B] text-violet-300 border border-violet-400/30 whitespace-nowrap shrink-0"
                >
                  {ui.startTour}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectBody(null);
                    onResetOverview();
                  }}
                  aria-label={ui.resetCamera}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#0D1324] hover:bg-[#15203B] text-slate-300 border border-white/10 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{ui.resetCamera}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
