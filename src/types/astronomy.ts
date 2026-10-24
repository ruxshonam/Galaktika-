export type Language = 'en' | 'uz';

export type AppSection =
  | 'home'
  | 'explorer'
  | 'planets'
  | 'stars'
  | 'missions'
  | 'learn';

export type CelestialCategory =
  | 'star'
  | 'planet'
  | 'dwarf-planet'
  | 'moon'
  | 'belt'
  | 'comet'
  | 'neo';

export type TexturePreset =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'moon'
  | 'mars'
  | 'phobos'
  | 'deimos'
  | 'jupiter'
  | 'io'
  | 'europa'
  | 'ganymede'
  | 'callisto'
  | 'saturn'
  | 'titan'
  | 'enceladus'
  | 'uranus'
  | 'titania'
  | 'oberon'
  | 'neptune'
  | 'triton'
  | 'pluto'
  | 'ceres'
  | 'haumea'
  | 'makemake'
  | 'eris'
  | 'comet'
  | 'bennu'
  | 'belt';

export interface LocalizedText {
  en: string;
  uz: string;
}

export interface KeplerianElements {
  /** Semi-major axis in AU */
  a: number;
  /** Eccentricity (0 = circle, <1 = ellipse) */
  e: number;
  /** Inclination to ecliptic in degrees */
  i: number;
  /** Longitude of ascending node in degrees */
  omegaNode: number;
  /** Argument of perihelion in degrees */
  argPeri: number;
  /** Mean anomaly at J2000 epoch in degrees */
  m0: number;
  /** Sidereal orbital period in Earth days */
  periodDays: number;
  /** Retrograde orbit flag (e.g., Triton, Halley) */
  retrograde?: boolean;
}

export interface RingConfig {
  innerRadiusRatio: number;
  outerRadiusRatio: number;
  preset: 'saturn' | 'uranus' | 'jupiter';
  tiltDeg?: number;
}

export interface CelestialBody {
  id: string;
  name: LocalizedText;
  category: CelestialCategory;
  subtype: LocalizedText;
  parentId?: string;
  texturePreset: TexturePreset;

  /** Exploratory 3D scene scale parameters (intelligently scaled for navigability) */
  sceneRadius: number;
  sceneOrbitRadius: number;
  /** Relative proportional radius compared to Earth = 1 (capped only for Sun) */
  earthRadiusRatio: number;
  rotationPeriodHours: number;
  axialTiltDeg: number;
  oblateness?: [number, number, number];
  irregularScale?: [number, number, number];
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
  hasClouds?: boolean;
  hasCryoPlume?: boolean;
  ring?: RingConfig;
  orbitColor: string;
  accentColor: string;

  /** Keplerian orbital parameters for documented J2000 Ephemeris simulation */
  kepler?: KeplerianElements;

  /** Verified physical & orbital metrics from NASA / IAU */
  metrics: {
    diameterKm: number | null;
    diameterDisplay: LocalizedText;
    massDisplay: LocalizedText;
    gravityMs2: number | null;
    gravityDisplay: LocalizedText;
    orbitalPeriodDisplay: LocalizedText;
    distanceFromSunAu: number | null;
    distanceDisplay: LocalizedText;
    meanTempC: number | null;
    temperatureDisplay: LocalizedText;
    atmosphereDisplay: LocalizedText;
    knownMoons: number | null;
    escapeVelocityKms: number | null;
  };

  summary: LocalizedText;
  facts: LocalizedText[];
  explorationHistory: LocalizedText;
  missions: string[];
  sourceCredit: string;
}

export interface NotableStar {
  id: string;
  name: LocalizedText;
  constellation: LocalizedText;
  spectralClass: string;
  starType: LocalizedText;
  distanceLy: number;
  distanceDisplay: LocalizedText;
  temperatureK: number;
  apparentMagnitude: number;
  luminositySolar: number;
  luminosityDisplay: LocalizedText;
  radiusSolar: number;
  radiusDisplay: LocalizedText;
  massSolar: number | null;
  massDisplay: LocalizedText;
  colorHex: string;
  coronaHex: string;
  granulationScale: number;
  oblateness?: number;
  isVariable?: boolean;
  description: LocalizedText;
  scientificHighlight: LocalizedText;
  sourceCredit: string;
}

export interface SpaceMission {
  id: string;
  name: string;
  agency: string;
  launchYear: number;
  launchDateDisplay: LocalizedText;
  status: 'Active' | 'Completed';
  statusLabel: LocalizedText;
  targetBodyIds: string[];
  targetDisplay: LocalizedText;
  imageUrl?: string;
  fallbackGradient: string;
  summary: LocalizedText;
  achievements: LocalizedText[];
  spacecraftSpecs: LocalizedText;
  officialUrl: string;
}

export interface TourStop {
  bodyId: string;
  title: LocalizedText;
  narration: LocalizedText;
}

export interface QuizQuestion {
  id: string;
  question: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  explanation: LocalizedText;
}
