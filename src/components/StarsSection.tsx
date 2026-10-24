import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { NOTABLE_STARS } from '../data/starsAndMissions';
import { UI_TEXT, tText } from '../data/translations';
import type { Language, NotableStar } from '../types/astronomy';
import { Star3DStage } from '../three/Star3DStage';

interface StarsSectionProps {
  lang: Language;
  onToggleLanguage: (lang: Language) => void;
  initialStarId?: string | null;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
}

export const StarsSection: React.FC<StarsSectionProps> = ({
  lang,
  onToggleLanguage,
  initialStarId,
  bookmarks,
  onToggleBookmark,
}) => {
  const ui = UI_TEXT[lang];
  const [selectedStarId, setSelectedStarId] = useState<string>(
    initialStarId || 'star-sirius'
  );
  const [showSun3DRef, setShowSun3DRef] = useState<boolean>(true);
  const [chartMetric, setChartMetric] = useState<
    'radius' | 'temperature' | 'luminosity'
  >('radius');

  useEffect(() => {
    if (initialStarId) {
      setSelectedStarId(initialStarId);
    }
  }, [initialStarId]);

  const activeStar: NotableStar = useMemo(
    () =>
      NOTABLE_STARS.find((s) => s.id === selectedStarId) ?? NOTABLE_STARS[0],
    [selectedStarId]
  );

  return (
    <div className="min-h-screen pt-20 pb-20 bg-[#05070E] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header & Scientific Distinction Notice */}
        <div className="border-b border-white/10 pb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-medium text-violet-300">
                Hipparcos &amp; VLTI Stellar Astrophysics Catalog · 10 Notable Stars
              </p>
              <h1
                className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                {ui.starsTitle}
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-slate-400 leading-relaxed">
                {ui.starsSubtitle}
              </p>
            </div>

            <div className="inline-flex items-center p-1 rounded-lg bg-[#0A0F1E] border border-white/10 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => onToggleLanguage('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onToggleLanguage('uz')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  lang === 'uz' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                O‘Z
              </button>
            </div>
          </div>

          {/* Unboxed clean scientific note distinguishing apparent brightness vs intrinsic luminosity */}
          <p className="text-xs sm:text-sm text-slate-300 bg-[#0A0F1F] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
            {ui.starsScientificNote}
          </p>
        </div>

        {/* Ten Star Selector Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {NOTABLE_STARS.map((star) => {
            const isSelected = star.id === activeStar.id;
            return (
              <button
                key={star.id}
                type="button"
                onClick={() => setSelectedStarId(star.id)}
                className={`flex flex-col items-center p-3 rounded-xl border transition-colors text-center ${
                  isSelected
                    ? 'bg-[#101830] border-blue-400/70'
                    : 'bg-[#090E1C] border-white/10 hover:border-white/25'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full mb-2"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, #ffffff, ${star.colorHex} 55%, ${star.coronaHex} 100%)`,
                    boxShadow: `0 0 16px ${star.coronaHex}55`,
                  }}
                />
                <span className="text-xs font-semibold text-white truncate w-full">
                  {tText(star.name, lang).split('(')[0].trim()}
                </span>
                <span className="mt-0.5 font-mono text-[10px] text-slate-400 tabular-nums">
                  {star.temperatureK} K
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive 3D Star Viewport + Astrophysical Dossier */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#090E1C] border border-white/10 rounded-xl overflow-hidden">
          {/* Left: Interactive 3D Star Photosphere Stage */}
          <div className="lg:col-span-6 relative h-[380px] sm:h-[460px] lg:h-auto min-h-[400px] border-b lg:border-b-0 lg:border-r border-white/10">
            <Star3DStage
              star={activeStar}
              showSunComparison={showSun3DRef}
              lang={lang}
            />

            {/* Overlay Controls inside 3D Star Stage */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
              <span className="text-xs font-mono text-slate-300 bg-[#050811]/90 border border-white/10 px-2.5 py-1 rounded">
                {activeStar.spectralClass} · {activeStar.temperatureK.toLocaleString()} K
              </span>

              {activeStar.id !== 'star-sun' && (
                <button
                  type="button"
                  onClick={() => setShowSun3DRef((v) => !v)}
                  className={`pointer-events-auto px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    showSun3DRef
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                      : 'bg-[#050811]/90 text-slate-300 border-white/15 hover:text-white'
                  }`}
                >
                  {ui.compareWithSun3D}
                </button>
              )}
            </div>

            <div className="absolute bottom-3 left-4 text-[11px] text-slate-400 pointer-events-none">
              {lang === 'uz'
                ? 'Sichqoncha bilan aylantiring va yaqinlashtiring'
                : 'Drag to rotate 3D photosphere · Scroll to zoom'}
            </div>
          </div>

          {/* Right: Star Parameters & Description */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-violet-300">
                    {tText(activeStar.starType, lang)} ·{' '}
                    {tText(activeStar.constellation, lang)}
                  </p>
                  <h2 className="mt-1 font-display text-3xl font-bold text-white">
                    {tText(activeStar.name, lang)}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleBookmark(activeStar.id)}
                  aria-label={ui.saveBookmark}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors shrink-0 ${
                    bookmarks.includes(activeStar.id)
                      ? 'bg-blue-600/20 text-blue-300 border-blue-400/50'
                      : 'bg-[#050811] text-slate-300 border-white/12 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>
                    {bookmarks.includes(activeStar.id)
                      ? ui.savedBookmark
                      : ui.saveBookmark}
                  </span>
                </button>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {tText(activeStar.description, lang)}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-slate-400">{ui.spectralClass}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white">
                    {activeStar.spectralClass}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.distanceEarth}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {tText(activeStar.distanceDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.surfaceTemp}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {activeStar.temperatureK.toLocaleString()} K
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.luminosity}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-amber-300 tabular-nums">
                    {tText(activeStar.luminosityDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.apparentMag}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-blue-300 tabular-nums">
                    {activeStar.apparentMagnitude > 0
                      ? `+${activeStar.apparentMagnitude.toFixed(2)}`
                      : activeStar.apparentMagnitude.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.stellarRadius}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {tText(activeStar.radiusDisplay, lang)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-semibold text-white">
                  {lang === 'uz'
                    ? 'Astrofizik ahamiyati'
                    : 'Astrophysical Significance'}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {tText(activeStar.scientificHighlight, lang)}
                </p>
              </div>
            </div>

            <p className="pt-3 border-t border-white/10 text-[11px] text-slate-500">
              {ui.sourceLabel}: {activeStar.sourceCredit}
            </p>
          </div>
        </section>

        {/* Interactive Stellar Comparison Chart */}
        <section className="bg-[#090E1C] border border-white/10 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                {ui.tempSpectrumTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {lang === 'uz'
                  ? 'Yulduzni 3D sahnada ko‘rish uchun istalgan qatorni bosing (radius va yorqinlik logarifmik shkalada).'
                  : 'Click any star bar to inspect in 3D (radius and luminosity bars use logarithmic scaling across 5 orders of magnitude).'}
              </p>
            </div>

            <div className="inline-flex items-center p-1 rounded-lg bg-[#050811] border border-white/10 self-start">
              {(
                [
                  {
                    id: 'radius',
                    label: lang === 'uz' ? 'Radius (R☉)' : 'Radius (R☉)',
                  },
                  {
                    id: 'temperature',
                    label: lang === 'uz' ? 'Harorat (K)' : 'Temperature (K)',
                  },
                  {
                    id: 'luminosity',
                    label: lang === 'uz' ? 'Yorqinlik (L☉)' : 'Luminosity (L☉)',
                  },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setChartMetric(m.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    chartMetric === m.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {NOTABLE_STARS.map((star) => {
              let pct = 10;
              let valueLabel = '';
              if (chartMetric === 'radius') {
                // Log10 from 1 R_sun to 800 R_sun
                pct = Math.max(
                  4,
                  (Math.log10(Math.max(1, star.radiusSolar * 2.5)) /
                    Math.log10(800 * 2.5)) *
                    100
                );
                valueLabel = `${star.radiusSolar} R☉`;
              } else if (chartMetric === 'temperature') {
                pct = (star.temperatureK / 12500) * 100;
                valueLabel = `${star.temperatureK.toLocaleString()} K`;
              } else {
                pct = Math.max(
                  4,
                  (Math.log10(Math.max(1, star.luminositySolar * 3)) /
                    Math.log10(130000 * 3)) *
                    100
                );
                valueLabel = `${star.luminositySolar.toLocaleString()} L☉ · m_V ${star.apparentMagnitude}`;
              }

              const isSelected = star.id === activeStar.id;

              return (
                <button
                  key={star.id}
                  type="button"
                  onClick={() => setSelectedStarId(star.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors border ${
                    isSelected
                      ? 'bg-[#0F172E] border-blue-400/50'
                      : 'bg-[#050811] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-100">
                      {tText(star.name, lang)}{' '}
                      <span className="text-slate-500 font-mono">
                        · {star.spectralClass}
                      </span>
                    </span>
                    <span className="font-mono text-slate-300 tabular-nums">
                      {valueLabel}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-transform origin-left"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: star.coronaHex,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
