import React from 'react';
import { CELESTIAL_BODIES } from '../data/celestialData';
import { UI_TEXT, tText } from '../data/translations';
import type { Language } from '../types/astronomy';

interface WebGLFallbackAtlasProps {
  selectedBodyId: string | null;
  onSelectBody: (id: string) => void;
  lang: Language;
}

export const WebGLFallbackAtlas: React.FC<WebGLFallbackAtlasProps> = ({
  selectedBodyId,
  onSelectBody,
  lang,
}) => {
  const ui = UI_TEXT[lang];
  const majorBodies = CELESTIAL_BODIES.filter(
    (b) => b.category === 'star' || b.category === 'planet' || b.id === 'pluto'
  );

  return (
    <div className="w-full h-full bg-[#05070E] flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-6">
        <h2 className="font-display text-xl font-semibold text-white">
          {ui.webglFallbackTitle}
        </h2>
        <p className="text-sm text-slate-400 mt-1.5">{ui.webglFallbackDesc}</p>

        {/* Interactive SVG Orbital Diagram */}
        <div className="mt-6 flex items-center justify-start lg:justify-center gap-5 overflow-x-auto py-8 px-4 bg-[#060913] rounded-lg border border-white/5">
          {majorBodies.map((body) => {
            const isSelected = selectedBodyId === body.id;
            const sizePx =
              body.id === 'sun'
                ? 68
                : Math.max(18, Math.round(body.sceneRadius * 16));
            return (
              <button
                key={body.id}
                type="button"
                onClick={() => onSelectBody(body.id)}
                className="group flex flex-col items-center gap-2.5 shrink-0 focus:outline-none"
              >
                <div
                  className={`rounded-full transition-transform group-hover:scale-110 ${
                    isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#060913]' : ''
                  }`}
                  style={{
                    width: `${sizePx}px`,
                    height: `${sizePx}px`,
                    background: `radial-gradient(circle at 35% 32%, #ffffff, ${body.accentColor} 58%, #090d16 100%)`,
                  }}
                />
                <span
                  className={`text-xs whitespace-nowrap ${
                    isSelected ? 'text-blue-300 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {tText(body.name, lang)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
