import React, { useMemo, useState } from 'react';
import { Bookmark, Compass } from 'lucide-react';
import { CELESTIAL_BODIES } from '../data/celestialData';
import { UI_TEXT, tText } from '../data/translations';
import type { CelestialBody, Language } from '../types/astronomy';

interface PlanetsSectionProps {
  lang: Language;
  onToggleLanguage: (lang: Language) => void;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onFlyToIn3D: (bodyId: string) => void;
}

export const PlanetsSection: React.FC<PlanetsSectionProps> = ({
  lang,
  onToggleLanguage,
  bookmarks,
  onToggleBookmark,
  onFlyToIn3D,
}) => {
  const ui = UI_TEXT[lang];
  const [groupFilter, setGroupFilter] = useState<'all' | 'planet' | 'dwarf-planet'>('all');
  const [activePlanetId, setActivePlanetId] = useState<string>('earth');
  const [selectedMoonId, setSelectedMoonId] = useState<string | null>(null);

  // Comparison Lab state
  const [compareAId, setCompareAId] = useState<string>('earth');
  const [compareBId, setCompareBId] = useState<string>('jupiter');
  const [earthWeightKg, setEarthWeightKg] = useState<number>(70);

  const catalogBodies = useMemo(
    () =>
      CELESTIAL_BODIES.filter((b) => {
        if (groupFilter === 'planet') return b.category === 'planet';
        if (groupFilter === 'dwarf-planet') return b.category === 'dwarf-planet';
        return b.category === 'planet' || b.category === 'dwarf-planet';
      }),
    [groupFilter]
  );

  const activePlanet: CelestialBody = useMemo(
    () =>
      CELESTIAL_BODIES.find((b) => b.id === activePlanetId) ??
      CELESTIAL_BODIES.find((b) => b.id === 'earth')!,
    [activePlanetId]
  );

  const planetMoons = useMemo(
    () => CELESTIAL_BODIES.filter((b) => b.parentId === activePlanet.id),
    [activePlanet.id]
  );

  const inspectedTarget = useMemo(() => {
    if (selectedMoonId) {
      const m = planetMoons.find((item) => item.id === selectedMoonId);
      if (m) return m;
    }
    return activePlanet;
  }, [selectedMoonId, planetMoons, activePlanet]);

  const comparePool = useMemo(
    () =>
      CELESTIAL_BODIES.filter(
        (b) =>
          b.category === 'planet' ||
          b.category === 'dwarf-planet' ||
          b.category === 'moon'
      ),
    []
  );

  const bodyA = useMemo(
    () => comparePool.find((b) => b.id === compareAId) ?? comparePool[0],
    [comparePool, compareAId]
  );
  const bodyB = useMemo(
    () => comparePool.find((b) => b.id === compareBId) ?? comparePool[4],
    [comparePool, compareBId]
  );

  // True proportional SVG circle radii for Comparison Lab
  const { radiusPxA, radiusPxB, ratioText } = useMemo(() => {
    const dA = bodyA.metrics.diameterKm || 1000;
    const dB = bodyB.metrics.diameterKm || 1000;
    const maxD = Math.max(dA, dB);
    const maxR = 76;
    const rA = Math.max(4, (dA / maxD) * maxR);
    const rB = Math.max(4, (dB / maxD) * maxR);
    const ratio = dA >= dB ? dA / dB : dB / dA;
    const largerName =
      dA >= dB ? tText(bodyA.name, lang) : tText(bodyB.name, lang);
    const smallerName =
      dA >= dB ? tText(bodyB.name, lang) : tText(bodyA.name, lang);

    const text =
      lang === 'uz'
        ? `${largerName} diametri ${smallerName}dan ${ratio.toFixed(2)} marta katta`
        : `${largerName} is ${ratio.toFixed(2)}× wider in diameter than ${smallerName}`;

    return { radiusPxA: rA, radiusPxB: rB, ratioText: text };
  }, [bodyA, bodyB, lang]);

  return (
    <div className="min-h-screen pt-20 pb-20 bg-[#05070E] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Page Header + Sub-Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-blue-400">
              IAU Solar System Inventory · 8 Major Planets · 5 Dwarf Planets
            </p>
            <h1
              className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              {ui.planetsTitle}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {ui.planetsSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="inline-flex items-center p-1 rounded-lg bg-[#0A0F1E] border border-white/10">
              {(
                [
                  { id: 'all', label: ui.catAll },
                  { id: 'planet', label: ui.catPlanets },
                  { id: 'dwarf-planet', label: ui.catDwarf },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGroupFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    groupFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center p-1 rounded-lg bg-[#0A0F1E] border border-white/10">
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
        </div>

        {/* Planet & Dwarf Planet Selector Grid */}
        <section aria-label="Celestial Catalog">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {catalogBodies.map((planet) => {
              const isSelected = activePlanet.id === planet.id;
              return (
                <div
                  key={planet.id}
                  onClick={() => {
                    setActivePlanetId(planet.id);
                    setSelectedMoonId(null);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActivePlanetId(planet.id);
                      setSelectedMoonId(null);
                    }
                  }}
                  className={`group cursor-pointer rounded-xl p-5 transition-colors border ${
                    isSelected
                      ? 'bg-[#0E162B] border-blue-400/60'
                      : 'bg-[#090E1C] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 truncate">
                        {planet.category === 'dwarf-planet'
                          ? lang === 'uz'
                            ? 'Mitti sayyora'
                            : 'Dwarf Planet'
                          : tText(planet.subtype, lang)}
                      </p>
                      <h2 className="mt-1 font-display text-xl font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                        {tText(planet.name, lang)}
                      </h2>
                    </div>

                    {/* Stylized 3D-lit Planetary Sphere Emblem */}
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <div
                        className="w-10 h-10 rounded-full shadow-inner"
                        style={{
                          background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${planet.accentColor} 48%, #05070e 95%)`,
                        }}
                      />
                      {planet.ring && (
                        <div
                          className="absolute w-14 h-4 rounded-full border border-amber-200/50 pointer-events-none"
                          style={{ transform: 'rotate(-18deg)' }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Clean unboxed typographic metadata */}
                  <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                    <span>{tText(planet.metrics.diameterDisplay, lang).split('(')[0].trim()}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {planet.metrics.distanceFromSunAu !== null
                        ? `${planet.metrics.distanceFromSunAu} AU`
                        : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dedicated Planet & Interactive Moon Detail Deck */}
        <section
          aria-label="Detailed Planetary Dossier"
          className="bg-[#090E1C] border border-white/10 rounded-xl p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: World Visual, Moon Selector & 3D Fly-To */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <div
                    className="w-20 h-20 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 30% 28%, #ffffff 0%, ${inspectedTarget.accentColor} 45%, #04060d 92%)`,
                      boxShadow: `0 0 36px ${inspectedTarget.accentColor}26`,
                    }}
                  />
                  {inspectedTarget.ring && (
                    <div
                      className="absolute w-28 h-7 rounded-full border-2 border-amber-200/55 pointer-events-none"
                      style={{ transform: 'rotate(-18deg)' }}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-blue-300">
                    {tText(inspectedTarget.subtype, lang)}
                  </p>
                  <h2 className="mt-0.5 font-display text-3xl font-bold text-white">
                    {tText(inspectedTarget.name, lang)}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400 font-mono tabular-nums">
                    {tText(inspectedTarget.metrics.distanceDisplay, lang)}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {tText(inspectedTarget.summary, lang)}
              </p>

              {/* Interactive Moon Selector */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-white">
                    {ui.majorMoonsIn3D} (
                    {activePlanet.metrics.knownMoons ?? 0}{' '}
                    {lang === 'uz' ? 'jami tasdiqlangan' : 'confirmed total'})
                  </span>
                </div>

                {planetMoons.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMoonId(null)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                        selectedMoonId === null
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-[#050811] text-slate-300 border-white/10 hover:text-white'
                      }`}
                    >
                      {tText(activePlanet.name, lang)}
                    </button>
                    {planetMoons.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMoonId(m.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                          selectedMoonId === m.id
                            ? 'bg-violet-600 text-white border-violet-400'
                            : 'bg-[#050811] text-slate-300 border-white/10 hover:text-white'
                        }`}
                      >
                        {tText(m.name, lang)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    {activePlanet.metrics.knownMoons === 0
                      ? lang === 'uz'
                        ? 'Ushbu sayyoraning tabiiy yo‘ldoshlari yo‘q.'
                        : 'This world has 0 natural moons.'
                      : lang === 'uz'
                        ? `Tasdiqlangan kichik yo‘ldoshlar soni: ${activePlanet.metrics.knownMoons}`
                        : `Confirmed moons: ${activePlanet.metrics.knownMoons}`}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onFlyToIn3D(inspectedTarget.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Compass className="w-4 h-4" />
                  <span>{ui.inspectIn3D}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleBookmark(inspectedTarget.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    bookmarks.includes(inspectedTarget.id)
                      ? 'bg-blue-600/20 text-blue-300 border-blue-400/50'
                      : 'bg-[#050811] text-slate-300 border-white/12 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>
                    {bookmarks.includes(inspectedTarget.id)
                      ? ui.savedBookmark
                      : ui.saveBookmark}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Quantitative Metrics, Facts & Exploration */}
            <div className="lg:col-span-7 space-y-6 lg:border-l lg:border-white/10 lg:pl-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                <div>
                  <p className="text-xs text-slate-400">{ui.diameter}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {tText(inspectedTarget.metrics.diameterDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.mass}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {tText(inspectedTarget.metrics.massDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.gravity}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {tText(inspectedTarget.metrics.gravityDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.orbitalPeriod}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {tText(inspectedTarget.metrics.orbitalPeriodDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.meanTemperature}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {tText(inspectedTarget.metrics.temperatureDisplay, lang)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{ui.knownMoons}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {inspectedTarget.metrics.knownMoons !== null
                      ? inspectedTarget.metrics.knownMoons
                      : ui.dataUnavailable}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-slate-400">{ui.atmosphere}</p>
                <p className="mt-1 font-mono text-xs sm:text-sm text-slate-200">
                  {tText(inspectedTarget.metrics.atmosphereDisplay, lang)}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-white mb-2">
                    {ui.factsHeading}
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {inspectedTarget.facts.map((fact, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-400 shrink-0">·</span>
                        <span>{tText(fact, lang)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-white mb-2">
                    {ui.explorationHeading}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {tText(inspectedTarget.explorationHistory, lang)}
                  </p>
                  <p className="mt-2.5 text-xs text-slate-400">
                    {inspectedTarget.missions.join(' · ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Planetary Comparison Lab */}
        <section
          aria-label="Planetary Comparison Tool"
          className="bg-[#090E1C] border border-white/10 rounded-xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                {ui.compareTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-400">{ui.compareSubtitle}</p>
            </div>

            {/* Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <span>{ui.bodyA}:</span>
                <select
                  value={compareAId}
                  onChange={(e) => setCompareAId(e.target.value)}
                  className="bg-[#050811] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                >
                  {comparePool.map((b) => (
                    <option key={b.id} value={b.id}>
                      {tText(b.name, lang)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <span>{ui.bodyB}:</span>
                <select
                  value={compareBId}
                  onChange={(e) => setCompareBId(e.target.value)}
                  className="bg-[#050811] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400"
                >
                  {comparePool.map((b) => (
                    <option key={b.id} value={b.id}>
                      {tText(b.name, lang)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* True Relative Scale Visual Diagram + Gravity Weight Lab */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-white/10 items-center">
            <div className="lg:col-span-5 flex flex-col items-center justify-center py-6 bg-[#050811] rounded-xl border border-white/8">
              <div className="flex items-center justify-center gap-10 h-44">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-36 flex items-center justify-center">
                    <div
                      className="rounded-full"
                      style={{
                        width: `${radiusPxA * 2}px`,
                        height: `${radiusPxA * 2}px`,
                        background: `radial-gradient(circle at 35% 30%, #ffffff, ${bodyA.accentColor} 58%, #05070e 100%)`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-blue-300">
                    {tText(bodyA.name, lang)}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="h-36 flex items-center justify-center">
                    <div
                      className="rounded-full"
                      style={{
                        width: `${radiusPxB * 2}px`,
                        height: `${radiusPxB * 2}px`,
                        background: `radial-gradient(circle at 35% 30%, #ffffff, ${bodyB.accentColor} 58%, #05070e 100%)`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-violet-300">
                    {tText(bodyB.name, lang)}
                  </span>
                </div>
              </div>
              <p className="mt-4 px-4 text-center text-xs font-mono text-slate-400">
                {ratioText}
              </p>
            </div>

            {/* Side-by-Side Comparison Metrics Table + Weight Calculator */}
            <div className="lg:col-span-7 space-y-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2.5 pr-4 font-medium">
                        {lang === 'uz' ? 'Ko‘rsatkich' : 'Parameter'}
                      </th>
                      <th className="py-2.5 px-4 font-semibold text-blue-300">
                        {tText(bodyA.name, lang)}
                      </th>
                      <th className="py-2.5 pl-4 font-semibold text-violet-300">
                        {tText(bodyB.name, lang)}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8 font-mono tabular-nums text-xs">
                    <tr>
                      <td className="py-2.5 pr-4 font-sans text-slate-400">
                        {ui.diameter}
                      </td>
                      <td className="py-2.5 px-4 text-slate-100">
                        {tText(bodyA.metrics.diameterDisplay, lang)}
                      </td>
                      <td className="py-2.5 pl-4 text-slate-100">
                        {tText(bodyB.metrics.diameterDisplay, lang)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 font-sans text-slate-400">
                        {ui.gravity}
                      </td>
                      <td className="py-2.5 px-4 text-slate-100">
                        {tText(bodyA.metrics.gravityDisplay, lang)}
                      </td>
                      <td className="py-2.5 pl-4 text-slate-100">
                        {tText(bodyB.metrics.gravityDisplay, lang)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 font-sans text-slate-400">
                        {ui.orbitalPeriod}
                      </td>
                      <td className="py-2.5 px-4 text-slate-100">
                        {tText(bodyA.metrics.orbitalPeriodDisplay, lang)}
                      </td>
                      <td className="py-2.5 pl-4 text-slate-100">
                        {tText(bodyB.metrics.orbitalPeriodDisplay, lang)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 font-sans text-slate-400">
                        {ui.meanTemperature}
                      </td>
                      <td className="py-2.5 px-4 text-slate-100">
                        {tText(bodyA.metrics.temperatureDisplay, lang)}
                      </td>
                      <td className="py-2.5 pl-4 text-slate-100">
                        {tText(bodyB.metrics.temperatureDisplay, lang)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 font-sans text-slate-400">
                        {lang === 'uz' ? 'Ikkinchi kosmik tezlik' : 'Escape Velocity'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-100">
                        {bodyA.metrics.escapeVelocityKms
                          ? `${bodyA.metrics.escapeVelocityKms} km/s`
                          : ui.dataUnavailable}
                      </td>
                      <td className="py-2.5 pl-4 text-slate-100">
                        {bodyB.metrics.escapeVelocityKms
                          ? `${bodyB.metrics.escapeVelocityKms} km/s`
                          : ui.dataUnavailable}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Interactive Weight on Surface Calculator */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="earth-mass-slider"
                    className="text-xs text-slate-300 block"
                  >
                    {lang === 'uz'
                      ? `Yerdagi vazningiz: ${earthWeightKg} kg`
                      : `Your Reference Mass on Earth: ${earthWeightKg} kg`}
                  </label>
                  <input
                    id="earth-mass-slider"
                    type="range"
                    min={20}
                    max={150}
                    step={1}
                    value={earthWeightKg}
                    onChange={(e) => setEarthWeightKg(Number(e.target.value))}
                    className="w-52 accent-blue-500"
                  />
                </div>

                <div className="flex items-center gap-6 font-mono tabular-nums">
                  <div>
                    <p className="text-[11px] text-slate-400">
                      {tText(bodyA.name, lang)}
                    </p>
                    <p className="text-base font-bold text-blue-300">
                      {bodyA.metrics.gravityMs2 !== null
                        ? `${((earthWeightKg * bodyA.metrics.gravityMs2) / 9.807).toFixed(1)} kg`
                        : ui.dataUnavailable}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">
                      {tText(bodyB.name, lang)}
                    </p>
                    <p className="text-base font-bold text-violet-300">
                      {bodyB.metrics.gravityMs2 !== null
                        ? `${((earthWeightKg * bodyB.metrics.gravityMs2) / 9.807).toFixed(1)} kg`
                        : ui.dataUnavailable}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
