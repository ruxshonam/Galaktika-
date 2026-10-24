import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  visible: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#04060D] text-slate-100"
      role="status"
      aria-live="polite"
    >
      {/* Custom Rotating Planet & Tilted Ring Animation */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Subtle Solar Rim Glow */}
        <div
          className="absolute w-20 h-20 rounded-full opacity-55"
          style={{
            background:
              'radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(139,92,246,0.2) 60%, transparent 100%)',
          }}
        />

        {/* Rotating Planet Sphere */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          className="relative w-16 h-16 rounded-full overflow-hidden border border-blue-300/30 shadow-lg"
          style={{
            background:
              'radial-gradient(circle at 32% 30%, #93c5fd 0%, #2563eb 42%, #1e1b4b 88%)',
          }}
        >
          {/* Procedural surface bands */}
          <div className="absolute inset-x-0 top-3 h-2 bg-cyan-200/20 -rotate-12" />
          <div className="absolute inset-x-0 top-7 h-3 bg-indigo-300/25 -rotate-12" />
          <div className="absolute inset-x-0 bottom-3 h-2 bg-blue-200/15 -rotate-12" />
        </motion.div>

        {/* Orbiting Moon & Elliptical Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
          className="absolute w-28 h-28 rounded-full border border-blue-400/30"
          style={{ transform: 'rotateX(68deg) rotateZ(-18deg)' }}
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-100 shadow" />
        </motion.div>
      </div>

      <h2 className="mt-6 font-display text-xl font-semibold tracking-tight text-white">
        Solar System 3D
      </h2>
      <p className="mt-1.5 text-xs text-slate-400 font-mono">
        Synthesizing J2000 Ephemeris &amp; Planetary Surfaces...
      </p>
    </motion.div>
  );
};
