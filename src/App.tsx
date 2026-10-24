import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AppSection, Language } from './types/astronomy';
import { GUIDED_TOUR_STOPS } from './data/celestialData';
import { isWebGLAvailable } from './utils/webgl';
import { TopNavHeader } from './components/TopNavHeader';
import { LoadingScreen } from './components/LoadingScreen';
import { ExplorerOverlay } from './components/ExplorerOverlay';
import { SearchAndBookmarksModal } from './components/SearchAndBookmarksModal';
import { WebGLFallbackAtlas } from './components/WebGLFallbackAtlas';
import { SolarSystemScene } from './three/SolarSystemScene';

// Lazy-load secondary educational and catalog pages for fast progressive startup
const PlanetsSection = lazy(() =>
  import('./components/PlanetsSection').then((m) => ({ default: m.PlanetsSection }))
);
const StarsSection = lazy(() =>
  import('./components/StarsSection').then((m) => ({ default: m.StarsSection }))
);
const MissionsSection = lazy(() =>
  import('./components/MissionsSection').then((m) => ({ default: m.MissionsSection }))
);
const LearningCenterSection = lazy(() =>
  import('./components/LearningCenterSection').then((m) => ({
    default: m.LearningCenterSection,
  }))
);

const BOOKMARKS_STORAGE_KEY = 'solar_system_3d_bookmarks_v1';
const LANGUAGE_STORAGE_KEY = 'solar_system_3d_lang_v1';

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'uz') return saved;
    } catch {
      // Ignore storage access errors in restricted iframes
    }
    return 'en';
  });

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage parse errors
    }
    return ['earth', 'saturn', 'europa', 'star-sirius'];
  });

  // 3D Solar System Simulation State
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
  const [paused, setPaused] = useState<boolean>(false);
  const [isRealTimeJ2000, setIsRealTimeJ2000] = useState<boolean>(false);
  const [speedDaysPerSecond, setSpeedDaysPerSecond] = useState<number>(1);
  const simTimestampRef = useRef<number>(Date.now());
  const [simDateMs, setSimDateMs] = useState<number>(() => Date.now());

  // 3D Visual Layer Toggles
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showBelts, setShowBelts] = useState<boolean>(true);
  const [proportionalSizes, setProportionalSizes] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);

  // Guided Tour & Cross-Page Deep Links
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [focusedStarId, setFocusedStarId] = useState<string | null>(null);
  const [highlightedMissionId, setHighlightedMissionId] = useState<string | null>(null);

  // Global Search / Bookmarks Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalInitialTab, setModalInitialTab] = useState<'search' | 'bookmarks'>('search');

  const webglSupported = useMemo(() => isWebGLAvailable(), []);

  // Safe fallback timer so loading screen always clears smoothly
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 850);
    return () => window.clearTimeout(timer);
  }, []);

  const handleToggleLanguage = useCallback((nextLang: Language) => {
    setLang(nextLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleToggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const handleNavigate = useCallback((section: AppSection) => {
    setActiveSection(section);
    if (section !== 'home' && section !== 'explorer') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleFlyToCelestial = useCallback((bodyId: string) => {
    setTourStep(null);
    setSelectedBodyId(bodyId);
    setActiveSection('explorer');
  }, []);

  const handleSelectStarFromSearch = useCallback((starId: string) => {
    setFocusedStarId(starId);
    setActiveSection('stars');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectMissionFromSearch = useCallback((missionId: string) => {
    setHighlightedMissionId(missionId);
    setActiveSection('missions');
    setTimeout(() => {
      document.getElementById(`mission-${missionId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 120);
  }, []);

  const handleStartTour = useCallback(() => {
    setTourStep(0);
    setSelectedBodyId(GUIDED_TOUR_STOPS[0].bodyId);
  }, []);

  const handleChangeTourStep = useCallback((step: number | null) => {
    setTourStep(step);
    if (step !== null && GUIDED_TOUR_STOPS[step]) {
      setSelectedBodyId(GUIDED_TOUR_STOPS[step].bodyId);
    }
  }, []);

  const handleSyncUtcNow = useCallback(() => {
    const now = Date.now();
    simTimestampRef.current = now;
    setSimDateMs(now);
  }, []);

  const handleResetOverview = useCallback(() => {
    setTourStep(null);
    setCameraResetTrigger((c) => c + 1);
  }, []);

  // Global Keyboard Shortcuts (Search, Dock Toggle, Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setModalInitialTab('search');
        setModalOpen(true);
        return;
      }

      if (isInput) return;

      if (e.key === '/') {
        e.preventDefault();
        setModalInitialTab('search');
        setModalOpen(true);
      } else if (
        (e.key === 'h' || e.key === 'H') &&
        (activeSection === 'home' || activeSection === 'explorer')
      ) {
        setDockCollapsed((v) => !v);
      } else if (e.key === 'Escape' && !modalOpen) {
        if (tourStep !== null) {
          setTourStep(null);
        } else if (selectedBodyId) {
          setSelectedBodyId(null);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSection, modalOpen, tourStep, selectedBodyId]);

  const is3DViewportActive =
    activeSection === 'home' || activeSection === 'explorer';

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100">
      <AnimatePresence>
        {isLoading && <LoadingScreen visible={isLoading} />}
      </AnimatePresence>

      <TopNavHeader
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenSearch={() => {
          setModalInitialTab('search');
          setModalOpen(true);
        }}
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
      />

      {is3DViewportActive ? (
        <main className="fixed inset-0 pt-14 overflow-hidden">
          {webglSupported ? (
            <SolarSystemScene
              selectedBodyId={selectedBodyId}
              onSelectBody={(id) => {
                setSelectedBodyId(id);
                if (id && activeSection === 'home') {
                  setActiveSection('explorer');
                }
              }}
              paused={paused}
              isRealTimeJ2000={isRealTimeJ2000}
              speedDaysPerSecond={speedDaysPerSecond}
              simTimestampRef={simTimestampRef}
              onDateSample={setSimDateMs}
              showOrbits={showOrbits}
              showLabels={showLabels}
              showBelts={showBelts}
              proportionalSizes={proportionalSizes}
              cameraResetTrigger={cameraResetTrigger}
              lang={lang}
              onSceneReady={() => setIsLoading(false)}
            />
          ) : (
            <WebGLFallbackAtlas
              selectedBodyId={selectedBodyId}
              onSelectBody={(id) => {
                setSelectedBodyId(id);
                if (activeSection === 'home') setActiveSection('explorer');
              }}
              lang={lang}
            />
          )}

          <ExplorerOverlay
            mode={activeSection}
            onNavigate={handleNavigate}
            selectedBodyId={selectedBodyId}
            onSelectBody={(id) => {
              setSelectedBodyId(id);
              if (id && activeSection === 'home') {
                setActiveSection('explorer');
              }
            }}
            paused={paused}
            onTogglePause={() => setPaused((p) => !p)}
            isRealTimeJ2000={isRealTimeJ2000}
            onSetRealTimeJ2000={setIsRealTimeJ2000}
            speedDaysPerSecond={speedDaysPerSecond}
            onChangeSpeed={setSpeedDaysPerSecond}
            onSyncUtcNow={handleSyncUtcNow}
            onResetOverview={handleResetOverview}
            simDateMs={simDateMs}
            showOrbits={showOrbits}
            onToggleOrbits={() => setShowOrbits((v) => !v)}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels((v) => !v)}
            showBelts={showBelts}
            onToggleBelts={() => setShowBelts((v) => !v)}
            proportionalSizes={proportionalSizes}
            onToggleProportionalSizes={() => setProportionalSizes((v) => !v)}
            dockCollapsed={dockCollapsed}
            onToggleDock={() => setDockCollapsed((v) => !v)}
            tourStep={tourStep}
            onStartTour={handleStartTour}
            onChangeTourStep={handleChangeTourStep}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onOpenBookmarksModal={() => {
              setModalInitialTab('bookmarks');
              setModalOpen(true);
            }}
            lang={lang}
            onToggleLanguage={handleToggleLanguage}
          />
        </main>
      ) : (
        <>
          <main>
            <Suspense
              fallback={
                <div className="min-h-screen pt-28 flex items-center justify-center bg-[#05070E] text-sm text-slate-400 font-mono">
                  {lang === 'uz' ? 'Yuklanmoqda...' : 'Loading astronomy module...'}
                </div>
              }
            >
              {activeSection === 'planets' && (
                <PlanetsSection
                  lang={lang}
                  onToggleLanguage={handleToggleLanguage}
                  bookmarks={bookmarks}
                  onToggleBookmark={handleToggleBookmark}
                  onFlyToIn3D={handleFlyToCelestial}
                />
              )}

              {activeSection === 'stars' && (
                <StarsSection
                  lang={lang}
                  onToggleLanguage={handleToggleLanguage}
                  initialStarId={focusedStarId}
                  bookmarks={bookmarks}
                  onToggleBookmark={handleToggleBookmark}
                />
              )}

              {activeSection === 'missions' && (
                <MissionsSection
                  lang={lang}
                  onToggleLanguage={handleToggleLanguage}
                  highlightedMissionId={highlightedMissionId}
                  onFlyToIn3D={handleFlyToCelestial}
                />
              )}

              {activeSection === 'learn' && (
                <LearningCenterSection
                  lang={lang}
                  onToggleLanguage={handleToggleLanguage}
                />
              )}
            </Suspense>
          </main>

          {/* Quiet Scientific Attribution Footer */}
          <footer className="border-t border-white/10 bg-[#04060D] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
              <div>
                <p className="font-display font-semibold text-slate-200">
                  Solar System 3D
                </p>
                <p className="mt-1">
                  {lang === 'uz'
                    ? 'Astronomik ko‘rsatkichlar manbasi: NASA Solar System Exploration, JPL Horizons J2000 efemeridasi, ESA va Xalqaro Astronomiya Ittifoqi (IAU).'
                    : 'Astronomical data grounded in NASA Solar System Exploration, JPL Horizons J2000 Ephemeris, Hipparcos/VLTI, ESA, and the International Astronomical Union (IAU).'}
                </p>
              </div>
              <div className="flex items-center gap-5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleNavigate('explorer')}
                  className="hover:text-white transition-colors"
                >
                  {lang === 'uz' ? '3D Quyosh tizimi' : '3D Solar System'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('planets')}
                  className="hover:text-white transition-colors"
                >
                  {lang === 'uz' ? 'Sayyoralar' : 'Planets'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('stars')}
                  className="hover:text-white transition-colors"
                >
                  {lang === 'uz' ? 'Yulduzlar' : 'Stars'}
                </button>
              </div>
            </div>
          </footer>
        </>
      )}

      <SearchAndBookmarksModal
        open={modalOpen}
        initialTab={modalInitialTab}
        onClose={() => setModalOpen(false)}
        lang={lang}
        bookmarks={bookmarks}
        onToggleBookmark={handleToggleBookmark}
        onSelectCelestial={handleFlyToCelestial}
        onSelectStar={handleSelectStarFromSearch}
        onSelectMission={handleSelectMissionFromSearch}
      />
    </div>
  );
}
