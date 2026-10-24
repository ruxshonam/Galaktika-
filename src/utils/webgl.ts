import type { KeplerianElements } from '../types/astronomy';

/**
 * Checks whether WebGL or WebGL2 is supported by the current browser/device.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return false;
    if ('getExtension' in gl && typeof gl.getExtension === 'function') {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Detects software WebGL rasterizers (SwiftShader, llvmpipe, softpipe, Basic Render)
 * strictly from the GPU renderer string so rendering cost (pixelRatio, shadows, antialias)
 * adapts gracefully while keeping identical 3D objects, layout, and logic.
 */
export const isSoftwareGl: boolean = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
})();

const DEG2RAD = Math.PI / 180;
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const MS_PER_DAY = 86_400_000;

/**
 * Computes days elapsed since the J2000.0 astronomical epoch (2000-01-01 12:00 TT/UTC).
 */
export function daysSinceJ2000(timestampMs: number): number {
  return (timestampMs - J2000_MS) / MS_PER_DAY;
}

/**
 * Solves Kepler's Equation M = E - e * sin(E) using Newton-Raphson iteration
 * and transforms orbital plane coordinates into 3D ecliptic space (X, Y, Z),
 * where XZ is the ecliptic plane and +Y is ecliptic north.
 *
 * Uses exact angular Keplerian timing while mapping radial distance onto `sceneOrbitRadius`
 * (modulated by eccentricity) so orbits remain navigable without overlapping the Sun.
 */
export function computeKeplerianScenePosition(
  kepler: KeplerianElements,
  daysFromJ2000: number,
  sceneOrbitRadius: number,
  out: [number, number, number] = [0, 0, 0]
): [number, number, number] {
  const direction = kepler.retrograde ? -1 : 1;
  const meanMotionDegPerDay = (360 / kepler.periodDays) * direction;
  let M = (kepler.m0 + meanMotionDegPerDay * daysFromJ2000) % 360;
  if (M < 0) M += 360;
  const mRad = M * DEG2RAD;

  // Solve M = E - e * sin(E)
  const e = Math.min(Math.max(kepler.e, 0), 0.92);
  let E = mRad + e * Math.sin(mRad);
  for (let iter = 0; iter < 6; iter++) {
    const dE = (E - e * Math.sin(E) - mRad) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-6) break;
  }

  // True anomaly nu and normalized heliocentric distance factor r/a
  const xv = Math.cos(E) - e;
  const yv = Math.sqrt(1 - e * e) * Math.sin(E);
  const nu = Math.atan2(yv, xv);
  const rNorm = Math.sqrt(xv * xv + yv * yv); // equals 1 - e*cos(E)

  // Damp extreme eccentricity visually just enough so Halley doesn't pierce the scaled Sun
  const effectiveEccentricScale = 1 + (rNorm - 1) * (e > 0.5 ? 0.52 : 0.85);
  const r = sceneOrbitRadius * effectiveEccentricScale;

  const omega = kepler.omegaNode * DEG2RAD;
  const w = kepler.argPeri * DEG2RAD;
  const inc = kepler.i * DEG2RAD;

  const u = w + nu;
  const cosO = Math.cos(omega);
  const sinO = Math.sin(omega);
  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  // Heliocentric ecliptic -> Three.js (X right, Z forward/ecliptic, Y north)
  const xEcl = r * (cosO * cosU - sinO * sinU * cosI);
  const yEcl = r * (sinO * cosU + cosO * sinU * cosI);
  const zEcl = r * (sinU * sinI);

  out[0] = xEcl;
  out[1] = zEcl;
  out[2] = -yEcl;
  return out;
}

/**
 * Generates closed 3D polyline points for an orbital ellipse using the exact same
 * Keplerian geometry so every planet/comet/moon sits directly on its rendered path.
 */
export function generateOrbitCurvePoints(
  kepler: KeplerianElements,
  sceneOrbitRadius: number,
  segments = 128
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const e = Math.min(Math.max(kepler.e, 0), 0.92);
  const omega = kepler.omegaNode * DEG2RAD;
  const w = kepler.argPeri * DEG2RAD;
  const inc = kepler.i * DEG2RAD;
  const cosO = Math.cos(omega);
  const sinO = Math.sin(omega);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  for (let s = 0; s <= segments; s++) {
    const E = (s / segments) * Math.PI * 2;
    const xv = Math.cos(E) - e;
    const yv = Math.sqrt(1 - e * e) * Math.sin(E);
    const nu = Math.atan2(yv, xv);
    const rNorm = Math.sqrt(xv * xv + yv * yv);
    const effectiveEccentricScale = 1 + (rNorm - 1) * (e > 0.5 ? 0.52 : 0.85);
    const r = sceneOrbitRadius * effectiveEccentricScale;

    const u = w + nu;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);

    const xEcl = r * (cosO * cosU - sinO * sinU * cosI);
    const yEcl = r * (sinO * cosU + cosO * sinU * cosI);
    const zEcl = r * (sinU * sinI);

    points.push([xEcl, zEcl, -yEcl]);
  }
  return points;
}
