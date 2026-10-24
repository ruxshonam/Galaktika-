import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { ASTRONOMY_QUIZ } from '../data/starsAndMissions';
import { UI_TEXT, tText } from '../data/translations';
import type { Language } from '../types/astronomy';

import nebulaHeroImg from '../assets/images/astronomy_deep_nebula_1792840798144.jpg';

const LIGHT_SPEED_KMS = 299792.458;

interface SignalTarget {
  id: string;
  name: { en: string; uz: string };
  sunDistKm: number;
  earthMinDistKm: number;
}

const SIGNAL_TARGETS: SignalTarget[] = [
  {
    id: 'moon',
    name: { en: 'Earth’s Moon', uz: 'Oy (Luna)' },
    sunDistKm: 149_597_870,
    earthMinDistKm: 384_400,
  },
  {
    id: 'mars',
    name: { en: 'Mars', uz: 'Mars' },
    sunDistKm: 227_943_824,
    earthMinDistKm: 55_700_000,
  },
  {
    id: 'jupiter',
    name: { en: 'Jupiter', uz: 'Yupiter' },
    sunDistKm: 778_340_821,
    earthMinDistKm: 588_500_000,
  },
  {
    id: 'saturn',
    name: { en: 'Saturn', uz: 'Saturn' },
    sunDistKm: 1_426_666_422,
    earthMinDistKm: 1_204_000_000,
  },
  {
    id: 'neptune',
    name: { en: 'Neptune', uz: 'Neptun' },
    sunDistKm: 4_498_396_441,
    earthMinDistKm: 4_306_000_000,
  },
  {
    id: 'pluto',
    name: { en: 'Pluto (Mean)', uz: 'Pluton (O‘rtacha)' },
    sunDistKm: 5_906_440_628,
    earthMinDistKm: 5_750_000_000,
  },
  {
    id: 'voyager1',
    name: { en: 'Voyager 1 (~166 AU)', uz: 'Voyager 1 (~166 a.b.)' },
    sunDistKm: 24_833_000_000,
    earthMinDistKm: 24_700_000_000,
  },
  {
    id: 'sirius',
    name: { en: 'Sirius (8.60 ly)', uz: 'Sirius yulduzi (8,60 y.y.)' },
    sunDistKm: 81_362_000_000_000,
    earthMinDistKm: 81_362_000_000_000,
  },
];

function formatLightDuration(seconds: number, lang: Language): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)} ${lang === 'uz' ? 'soniya' : 'seconds'}`;
  }
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return lang === 'uz' ? `${m} daqiqa ${s} soniya` : `${m} min ${s} sec`;
  }
  if (seconds < 86400 * 30) {
    const h = (seconds / 3600).toFixed(2);
    return lang === 'uz' ? `${h} soat` : `${h} hours`;
  }
  const years = (seconds / (86400 * 365.25)).toFixed(2);
  return lang === 'uz' ? `${years} yil` : `${years} years`;
}

/** Interactive Animated Keplerian Eccentricity SVG Lab */
const KeplerOrbitLab: React.FC<{ eccentricity: number; lang: Language }> = ({
  eccentricity,
  lang,
}) => {
  const [meanAnomaly, setMeanAnomaly] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setMeanAnomaly((prev) => (prev + dt * 1.15) % (Math.PI * 2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const a = 115; // SVG semi-major axis
  const b = a * Math.sqrt(1 - eccentricity * eccentricity);
  const c = a * eccentricity; // Sun focus offset from center

  // Solve M = E - e sin E
  let E = meanAnomaly;
  for (let i = 0; i < 5; i++) {
    E = E - (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
  }

  const px = 160 + a * Math.cos(E);
  const py = 115 - b * Math.sin(E);
  const sunX = 160 + c;
  const sunY = 115;

  const speedRatio = ((1 + eccentricity) / Math.max(0.05, 1 - eccentricity)).toFixed(2);

  return (
    <div className="bg-[#050811] border border-white/10 rounded-xl p-4 flex flex-col items-center">
      <svg
        viewBox="0 0 320 230"
        className="w-full max-w-[340px] h-auto"
        role="img"
        aria-label="Keplerian elliptical orbit simulation"
      >
        {/* Center coordinate hairlines */}
        <line x1="20" y1="115" x2="300" y2="115" stroke="rgba(255,255,255,0.08)" />
        <line x1="160" y1="15" x2="160" y2="215" stroke="rgba(255,255,255,0.08)" />

        {/* Orbital Ellipse */}
        <ellipse
          cx={160}
          cy={115}
          rx={a}
          ry={b}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={1.6}
          strokeDasharray="4 3"
        />

        {/* Radius Vector from Sun Focus to Planet */}
        <line
          x1={sunX}
          y1={sunY}
          x2={px}
          y2={py}
          stroke="rgba(139,92,246,0.55)"
          strokeWidth={1.2}
        />

        {/* Sun at Principal Focus */}
        <circle cx={sunX} cy={sunY} r={9} fill="#F59E0B" />
        <circle cx={sunX} cy={sunY} r={15} fill="rgba(245,158,11,0.22)" />

        {/* Orbiting Planet */}
        <circle cx={px} cy={py} r={6} fill="#38BDF8" />

        {/* Perihelion & Aphelion labels */}
        <text x={282} y={132} fill="#94A3B8" fontSize="9" textAnchor="end">
          {lang === 'uz' ? 'Perigeliy' : 'Perihelion'}
        </text>
        <text x={38} y={132} fill="#94A3B8" fontSize="9">
          {lang === 'uz' ? 'Afeliy' : 'Aphelion'}
        </text>
      </svg>

      <p className="mt-2 font-mono text-xs text-slate-300 tabular-nums">
        {lang === 'uz'
          ? `Perigeliy / Afeliy tezlik nisbati: ${speedRatio}×`
          : `Perihelion-to-Aphelion Orbital Speed Ratio: ${speedRatio}×`}
      </p>
    </div>
  );
};

interface LearningCenterSectionProps {
  lang: Language;
  onToggleLanguage: (lang: Language) => void;
}

export const LearningCenterSection: React.FC<LearningCenterSectionProps> = ({
  lang,
  onToggleLanguage,
}) => {
  const ui = UI_TEXT[lang];
  const [nebulaImgFailed, setNebulaImgFailed] = useState(false);

  // Lab 1 State: Speed of Light
  const [signalOrigin, setSignalOrigin] = useState<'sun' | 'earth'>('sun');
  const [targetId, setTargetId] = useState<string>('mars');

  // Lab 2 State: Kepler Eccentricity
  const [eccentricity, setEccentricity] = useState<number>(0.42);

  // Quiz State
  const [currentQ, setCurrentQ] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const selectedSignalTarget = useMemo(
    () => SIGNAL_TARGETS.find((t) => t.id === targetId) ?? SIGNAL_TARGETS[0],
    [targetId]
  );

  const signalStats = useMemo(() => {
    const distKm =
      signalOrigin === 'sun'
        ? selectedSignalTarget.sunDistKm
        : selectedSignalTarget.earthMinDistKm;
    const seconds = distKm / LIGHT_SPEED_KMS;
    const au = distKm / 149_597_870.7;
    return {
      distKm,
      au,
      durationText: formatLightDuration(seconds, lang),
    };
  }, [selectedSignalTarget, signalOrigin, lang]);

  const activeQuestion = ASTRONOMY_QUIZ[currentQ];

  const handleCheckAnswer = () => {
    if (selectedOption === null || submitted) return;
    setSubmitted(true);
    if (selectedOption === activeQuestion.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQ + 1 < ASTRONOMY_QUIZ.length) {
      setCurrentQ((q) => q + 1);
      setSelectedOption(null);
      setSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQ(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-20 bg-[#05070E] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Hero Banner with Generated Deep-Space Nebula Backdrop & Measured Scrim */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#080D1A]">
          {!nebulaImgFailed && (
            <img
              src={nebulaHeroImg}
              alt="Deep space blue and violet emission nebula"
              referrerPolicy="no-referrer"
              onError={() => setNebulaImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover opacity-45"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070E] via-[#05070E]/85 to-[#05070E]/45" />

          <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-blue-300">
                Interactive Astrophysics &amp; Planetary Science Curriculum
              </p>
              <h1
                className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                {ui.learnTitle}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                {ui.learnSubtitle}
              </p>
            </div>

            <div className="inline-flex items-center p-1 rounded-lg bg-[#050811]/90 border border-white/15 self-start shrink-0">
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

        {/* Two Interactive Physics Labs */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Lab 1: Speed-of-Light & Spacecraft Signal Calculator */}
          <div className="bg-[#090E1C] border border-white/10 rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                {ui.lightTimeTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {ui.lightTimeDesc}
              </p>

              {/* Origin Toggle */}
              <div className="inline-flex items-center p-1 rounded-lg bg-[#050811] border border-white/10">
                <button
                  type="button"
                  onClick={() => setSignalOrigin('sun')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    signalOrigin === 'sun'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ui.fromSun}
                </button>
                <button
                  type="button"
                  onClick={() => setSignalOrigin('earth')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    signalOrigin === 'earth'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ui.fromEarth}
                </button>
              </div>

              {/* Destination Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {SIGNAL_TARGETS.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => setTargetId(target.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors text-left truncate ${
                      target.id === targetId
                        ? 'bg-blue-600/20 border-blue-400 text-white'
                        : 'bg-[#050811] border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    {tText(target.name, lang)}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Readout */}
            <div className="pt-5 border-t border-white/10 space-y-2">
              <p className="text-xs text-slate-400">
                {signalOrigin === 'sun' ? ui.fromSun : ui.fromEarth} →{' '}
                <span className="text-white font-medium">
                  {tText(selectedSignalTarget.name, lang)}
                </span>
              </p>
              <p className="font-mono text-3xl font-bold text-blue-300 tabular-nums">
                {signalStats.durationText}
              </p>
              <p className="font-mono text-xs text-slate-400 tabular-nums">
                {signalStats.distKm.toLocaleString()} km ·{' '}
                {signalStats.au < 1000
                  ? `${signalStats.au.toFixed(3)} AU`
                  : `${(signalStats.au / 63241.1).toFixed(2)} ly`}
              </p>
            </div>
          </div>

          {/* Lab 2: Kepler's Laws & Eccentricity Simulator */}
          <div className="bg-[#090E1C] border border-white/10 rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                {ui.keplerLabTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {ui.keplerLabDesc}
              </p>
            </div>

            <KeplerOrbitLab eccentricity={eccentricity} lang={lang} />

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="eccentricity-slider" className="text-slate-300 font-medium">
                  {ui.eccentricityLabel}
                </label>
                <span className="font-mono text-blue-300 tabular-nums font-semibold">
                  e = {eccentricity.toFixed(2)}
                </span>
              </div>
              <input
                id="eccentricity-slider"
                type="range"
                min={0}
                max={0.78}
                step={0.01}
                value={eccentricity}
                onChange={(e) => setEccentricity(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: 'Earth (0.02)', val: 0.02 },
                  { label: 'Mars (0.09)', val: 0.09 },
                  { label: 'Mercury (0.21)', val: 0.21 },
                  { label: 'Pluto (0.25)', val: 0.25 },
                  { label: 'Comet (0.75)', val: 0.75 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEccentricity(preset.val)}
                    className="px-2.5 py-1 text-[11px] font-mono rounded bg-[#050811] border border-white/10 text-slate-300 hover:text-white hover:border-blue-400/50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Beginner-Friendly Planet Classification & Astrophysics Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#090E1C] border border-white/10 rounded-xl p-6 space-y-2.5">
            <p className="font-mono text-xs text-blue-400">01 · Inner System (0.39 – 1.52 AU)</p>
            <h3 className="font-display text-lg font-bold text-white">
              {lang === 'uz'
                ? 'Yer guruhidagi tosh sayyoralar'
                : 'Terrestrial Rocky Worlds'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {lang === 'uz'
                ? 'Merkuriy, Venera, Yer va Mars silikat jinslar hamda metall yadrodan tuzilgan qattiq sirtga ega. Ularning yo‘ldoshlari kam (Yorda 1 ta, Marsda 2 ta) va halqalari yo‘q.'
                : 'Mercury, Venus, Earth, and Mars feature solid silicate crusts over dense metallic iron-nickel cores, few or zero moons, and zero planetary ring systems.'}
            </p>
          </div>

          <div className="bg-[#090E1C] border border-white/10 rounded-xl p-6 space-y-2.5">
            <p className="font-mono text-xs text-amber-300">02 · Outer Giants (5.2 – 30.1 AU)</p>
            <h3 className="font-display text-lg font-bold text-white">
              {lang === 'uz'
                ? 'Gaz gigantlari va Muz gigantlari'
                : 'Gas Giants vs. Ice Giants'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {lang === 'uz'
                ? 'Yupiter va Saturn asosan vodorod va geliydan iborat gaz gigantlaridir. Uran va Neptun esa sirt ostida suv, ammiak hamda metan “muzlari” ustun bo‘lgan muz gigantlaridir.'
                : 'Jupiter and Saturn are hydrogen-helium gas giants; Uranus and Neptune are ice giants whose mantles are dominated by supercritical water, ammonia, and methane volatiles.'}
            </p>
          </div>

          <div className="bg-[#090E1C] border border-white/10 rounded-xl p-6 space-y-2.5">
            <p className="font-mono text-xs text-violet-300">03 · IAU 2006 Resolution</p>
            <h3 className="font-display text-lg font-bold text-white">
              {lang === 'uz'
                ? 'Nega Pluton mitti sayyora deyiladi?'
                : 'Why Pluto Is a Dwarf Planet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {lang === 'uz'
                ? 'Sayyora bo‘lish uchun jism Quyosh atrofida aylanishi, sharsimon shaklga kirishi va o‘z orbitasi atrofini boshqa jismlardan tozalashi shart. Pluton Koyper kamaridagi minglab jismlar bilan bir hududni bo‘lishadi.'
                : 'An IAU planet must orbit the Sun, achieve hydrostatic roundness, AND gravitationally clear its orbital neighborhood. Pluto shares the Kuiper Belt with thousands of icy bodies.'}
            </p>
          </div>
        </section>

        {/* Interactive 8-Question Astronomy Quiz */}
        <section
          aria-label="Astronomy Knowledge Quiz"
          className="bg-[#090E1C] border border-white/10 rounded-xl p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                {ui.quizTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {ui.quizSubtitle}
              </p>
            </div>
            <span className="font-mono text-xs text-blue-300 tabular-nums">
              {quizFinished
                ? `${score} / ${ASTRONOMY_QUIZ.length}`
                : `${lang === 'uz' ? 'Savol' : 'Question'} ${currentQ + 1} / ${ASTRONOMY_QUIZ.length}`}
            </span>
          </div>

          {quizFinished ? (
            <div className="py-8 text-center max-w-md mx-auto space-y-4">
              <p className="text-xs font-medium text-blue-400">{ui.quizComplete}</p>
              <p className="font-mono text-4xl font-bold text-white tabular-nums">
                {score} / {ASTRONOMY_QUIZ.length}
              </p>
              <p className="text-sm text-slate-300">
                {score >= 7
                  ? lang === 'uz'
                    ? 'Ajoyib natija! Siz Quyosh tizimi va yulduzlar astrofizikasini mukammal bilasiz.'
                    : 'Outstanding mastery of Solar System dynamics and stellar astrophysics!'
                  : lang === 'uz'
                    ? 'Yaxshi urinish! 3D sahnani va yulduzlar bo‘limini kuzatib bilimingizni yanada boyiting.'
                    : 'Great effort! Explore the 3D Solar System and Notable Stars catalog to master every detail.'}
              </p>
              <button
                type="button"
                onClick={handleRestartQuiz}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{ui.restartQuiz}</span>
              </button>
            </div>
          ) : (
            <div className="pt-6 space-y-6 max-w-3xl">
              <h3 className="font-display text-lg sm:text-xl font-semibold text-white leading-snug">
                {tText(activeQuestion.question, lang)}
              </h3>

              <div className="space-y-2.5">
                {activeQuestion.options.map((opt, idx) => {
                  const isPicked = selectedOption === idx;
                  const isCorrect = idx === activeQuestion.correctIndex;
                  let styleClass =
                    'bg-[#050811] border-white/10 text-slate-200 hover:border-white/25';

                  if (submitted) {
                    if (isCorrect) {
                      styleClass =
                        'bg-emerald-950/50 border-emerald-400/60 text-emerald-100';
                    } else if (isPicked && !isCorrect) {
                      styleClass =
                        'bg-rose-950/50 border-rose-400/60 text-rose-100';
                    } else {
                      styleClass = 'bg-[#050811] border-white/5 text-slate-500';
                    }
                  } else if (isPicked) {
                    styleClass =
                      'bg-blue-600/20 border-blue-400 text-white font-medium';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={submitted}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-left text-xs sm:text-sm transition-colors ${styleClass}`}
                    >
                      <span>{tText(opt, lang)}</span>
                      {submitted && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {submitted && isPicked && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="p-4 rounded-lg bg-[#050811] border border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {tText(activeQuestion.explanation, lang)}
                </div>
              )}

              <div className="flex items-center gap-3">
                {!submitted ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleCheckAnswer}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg transition-colors"
                  >
                    {ui.checkAnswer}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                  >
                    {currentQ + 1 < ASTRONOMY_QUIZ.length
                      ? ui.nextQuestion
                      : ui.quizComplete}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
