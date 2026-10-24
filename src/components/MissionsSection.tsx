import React, { useMemo, useState } from 'react';
import { Compass, ExternalLink, Satellite } from 'lucide-react';
import { SPACE_MISSIONS } from '../data/starsAndMissions';
import { UI_TEXT, tText } from '../data/translations';
import type { Language, SpaceMission } from '../types/astronomy';

import voyagerImg from '../assets/images/mission_voyager_spacecraft_1792840793437.jpg';
import jwstImg from '../assets/images/mission_jwst_telescope_1792840795839.jpg';
import perseveranceImg from '../assets/images/mission_perseverance_mars_1792840797614.jpg';

const MISSION_IMAGE_MAP: Record<string, string> = {
  'voyager-program': voyagerImg,
  jwst: jwstImg,
  perseverance: perseveranceImg,
};

interface MissionsSectionProps {
  lang: Language;
  onToggleLanguage: (lang: Language) => void;
  highlightedMissionId?: string | null;
  onFlyToIn3D: (bodyId: string) => void;
}

const MissionMediaVisual: React.FC<{ mission: SpaceMission }> = ({ mission }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const resolvedSrc = MISSION_IMAGE_MAP[mission.id];

  if (!resolvedSrc || imgFailed) {
    return (
      <div
        className={`w-full aspect-[4/3] bg-gradient-to-br ${mission.fallbackGradient} flex flex-col items-center justify-center p-6 text-center relative overflow-hidden`}
      >
        <div className="w-14 h-14 rounded-full border border-white/15 flex items-center justify-center bg-black/30 mb-3">
          <Satellite className="w-6 h-6 text-blue-300" />
        </div>
        <p className="font-display text-base font-semibold text-white">
          {mission.name}
        </p>
        <p className="font-mono text-xs text-slate-300 mt-1">
          {mission.agency} · {mission.launchYear}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-[4/3] bg-[#060913] relative overflow-hidden">
      <img
        src={resolvedSrc}
        alt={`${mission.name} spacecraft visualization`}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImgFailed(true)}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#090E1C] via-transparent to-transparent opacity-60 pointer-events-none" />
    </div>
  );
};

export const MissionsSection: React.FC<MissionsSectionProps> = ({
  lang,
  onToggleLanguage,
  highlightedMissionId,
  onFlyToIn3D,
}) => {
  const ui = UI_TEXT[lang];
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Completed'>('all');

  const filteredMissions = useMemo(() => {
    const list = SPACE_MISSIONS.filter((m) =>
      statusFilter === 'all' ? true : m.status === statusFilter
    );
    return [...list].sort((a, b) => a.launchYear - b.launchYear);
  }, [statusFilter]);

  return (
    <div className="min-h-screen pt-20 pb-20 bg-[#05070E] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-blue-400">
              NASA · ESA · JAXA · Deep-Space Exploration Archive
            </p>
            <h1
              className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              {ui.missionsTitle}
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-slate-400 leading-relaxed">
              {ui.missionsSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="inline-flex items-center p-1 rounded-lg bg-[#0A0F1E] border border-white/10">
              {(
                [
                  { id: 'all', label: ui.filterAllAgencies },
                  { id: 'Active', label: ui.filterActive },
                  { id: 'Completed', label: ui.filterCompleted },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === tab.id
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

        {/* Chronological Timeline Strip */}
        <section aria-label="Mission Launch Timeline">
          <div className="flex items-center gap-6 overflow-x-auto pb-3 border-b border-white/10">
            {filteredMissions.map((m) => (
              <a
                key={m.id}
                href={`#mission-${m.id}`}
                className="group shrink-0 flex flex-col gap-1 py-1 focus:outline-none"
              >
                <span className="font-mono text-xs font-semibold text-blue-400 tabular-nums">
                  {m.launchYear}
                </span>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white whitespace-nowrap">
                  {m.name}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Mission Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMissions.map((mission) => {
            const isHighlighted = highlightedMissionId === mission.id;
            return (
              <article
                id={`mission-${mission.id}`}
                key={mission.id}
                className={`group bg-[#090E1C] rounded-xl overflow-hidden border transition-colors flex flex-col ${
                  isHighlighted
                    ? 'border-blue-400'
                    : 'border-white/10 hover:border-white/25'
                }`}
              >
                <MissionMediaVisual mission={mission} />

                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    {/* Clean unboxed metadata with typographic separators */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="text-blue-300 font-medium">{mission.agency}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {tText(mission.launchDateDisplay, lang)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          mission.status === 'Active'
                            ? 'text-emerald-400 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        {mission.status === 'Active' ? '● ' : '◆ '}
                        {tText(mission.statusLabel, lang)}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl font-bold text-white">
                      {mission.name}
                    </h2>

                    <p className="text-xs text-violet-300">
                      {tText(mission.targetDisplay, lang)}
                    </p>

                    <p className="text-sm text-slate-300 leading-relaxed">
                      {tText(mission.summary, lang)}
                    </p>

                    <div className="pt-3 border-t border-white/10">
                      <h3 className="text-xs font-semibold text-white mb-2">
                        {ui.keyDiscoveries}
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                        {mission.achievements.map((item, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-blue-400 shrink-0">·</span>
                            <span>{tText(item, lang)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <h3 className="text-xs font-semibold text-white mb-1">
                        {ui.spacecraftSpecs}
                      </h3>
                      <p className="font-mono text-xs text-slate-400 leading-relaxed">
                        {tText(mission.spacecraftSpecs, lang)}
                      </p>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                    {mission.targetBodyIds[0] && (
                      <button
                        type="button"
                        onClick={() => onFlyToIn3D(mission.targetBodyIds[0])}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>{ui.inspectIn3D}</span>
                      </button>
                    )}

                    <a
                      href={mission.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-blue-300 transition-colors whitespace-nowrap"
                    >
                      <span>{ui.officialSource}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
};
