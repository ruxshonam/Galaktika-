import * as THREE from 'three';
import type { RingConfig, TexturePreset } from '../types/astronomy';
import { isSoftwareGl } from '../utils/webgl';

export interface PlanetTextureSet {
  map: THREE.CanvasTexture;
  bumpMap?: THREE.CanvasTexture;
  roughnessMap?: THREE.CanvasTexture;
  roughness: number;
  metalness: number;
  bumpScale: number;
}

const textureCache = new Map<TexturePreset, PlanetTextureSet>();
const ringTextureCache = new Map<string, THREE.CanvasTexture>();
let cachedCloudTexture: THREE.CanvasTexture | null = null;
let cachedGlowTexture: THREE.CanvasTexture | null = null;

/** Fast deterministic hash for 3D lattice coordinates */
function hash3(ix: number, iy: number, iz: number, seed: number): number {
  let n = ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1597334677;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 3D Value Noise on seamless spherical coordinates */
function noise3D(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);

  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const fz = smooth(z - iz);

  const c000 = hash3(ix, iy, iz, seed);
  const c100 = hash3(ix + 1, iy, iz, seed);
  const c010 = hash3(ix, iy + 1, iz, seed);
  const c110 = hash3(ix + 1, iy + 1, iz, seed);
  const c001 = hash3(ix, iy, iz + 1, seed);
  const c101 = hash3(ix + 1, iy, iz + 1, seed);
  const c011 = hash3(ix, iy + 1, iz + 1, seed);
  const c111 = hash3(ix + 1, iy + 1, iz + 1, seed);

  const x00 = lerp(c000, c100, fx);
  const x10 = lerp(c010, c110, fx);
  const x01 = lerp(c001, c101, fx);
  const x11 = lerp(c011, c111, fx);

  const y0 = lerp(x00, x10, fy);
  const y1 = lerp(x01, x11, fy);

  return lerp(y0, y1, fz);
}

function fbm3D(x: number, y: number, z: number, seed: number, octaves = 4): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    value += amp * noise3D(x * freq, y * freq, z * freq, seed + i * 31);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return value / norm;
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function mixRgb(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [
    c1[0] + (c2[0] - c1[0]) * k,
    c1[1] + (c2[1] - c1[1]) * k,
    c1[2] + (c2[2] - c1[2]) * k,
  ];
}

/**
 * Generates seamless equirectangular albedo, bump, and roughness textures
 * for any planetary preset using 3D spherical coordinates (zero UV seam).
 */
export function getPlanetTextures(
  preset: TexturePreset,
  maxAnisotropy = 4
): PlanetTextureSet {
  const existing = textureCache.get(preset);
  if (existing) return existing;

  const width = isSoftwareGl ? 256 : 512;
  const height = width / 2;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const colorCtx = colorCanvas.getContext('2d')!;
  const colorImg = colorCtx.createImageData(width, height);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  const bumpImg = bumpCtx.createImageData(width, height);

  let roughCanvas: HTMLCanvasElement | undefined;
  let roughImg: ImageData | undefined;
  let roughCtx: CanvasRenderingContext2D | undefined;

  if (preset === 'earth') {
    roughCanvas = document.createElement('canvas');
    roughCanvas.width = width;
    roughCanvas.height = height;
    roughCtx = roughCanvas.getContext('2d')!;
    roughImg = roughCtx.createImageData(width, height);
  }

  let roughness = 0.82;
  let metalness = 0.04;
  let bumpScale = 0.03;

  for (let py = 0; py < height; py++) {
    const v = py / (height - 1);
    const lat = (0.5 - v) * Math.PI; // +pi/2 north to -pi/2 south
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const absLat = Math.abs(sinLat);

    for (let px = 0; px < width; px++) {
      const u = px / width;
      const lon = u * Math.PI * 2;
      const nx = cosLat * Math.cos(lon);
      const ny = sinLat;
      const nz = cosLat * Math.sin(lon);

      const idx = (py * width + px) * 4;
      let rgb: [number, number, number] = [180, 180, 180];
      let bumpVal = 128;
      let roughVal = 200;

      switch (preset) {
        case 'mercury': {
          const base = fbm3D(nx * 3.2, ny * 3.2, nz * 3.2, 11, 4);
          const craters = Math.abs(fbm3D(nx * 11, ny * 11, nz * 11, 29, 3) - 0.5) * 2;
          const craterRim = Math.pow(1 - craters, 2.5);
          const shade = base * 0.7 + craterRim * 0.3;
          rgb = mixRgb([92, 88, 84], [176, 170, 162], shade);
          bumpVal = clampByte((base * 0.5 + craterRim * 0.5) * 255);
          roughness = 0.9;
          bumpScale = 0.045;
          break;
        }
        case 'venus': {
          const swirl = fbm3D(nx * 2.5, ny * 4.5, nz * 2.5, 42, 4);
          const chevron = Math.sin(ny * 8 + swirl * 5 + Math.cos(lon) * 1.4) * 0.5 + 0.5;
          const t = swirl * 0.6 + chevron * 0.4;
          rgb = mixRgb([196, 146, 78], [245, 222, 168], t);
          bumpVal = clampByte(t * 180);
          roughness = 0.65;
          bumpScale = 0.008;
          break;
        }
        case 'earth': {
          const cont = fbm3D(nx * 2.1 + 0.4, ny * 2.1, nz * 2.1 - 0.2, 77, 5);
          const detail = fbm3D(nx * 8, ny * 8, nz * 8, 103, 3);
          const iceThreshold = 0.84 - detail * 0.08;
          if (absLat > iceThreshold) {
            rgb = [242, 248, 255];
            bumpVal = 150;
            roughVal = 140;
          } else if (cont > 0.505) {
            // Landmasses
            const elev = Math.min(1, (cont - 0.505) * 5.2);
            const aridity = fbm3D(nx * 4.2, ny * 4.2, nz * 4.2, 199, 3);
            const forest = mixRgb([34, 98, 52], [86, 134, 62], detail);
            const desert = mixRgb([184, 152, 98], [212, 182, 128], detail);
            let land = mixRgb(
              forest,
              desert,
              aridity > 0.55 && absLat < 0.55 ? (aridity - 0.55) * 2.2 : 0
            );
            if (elev > 0.65) {
              land = mixRgb(land, [138, 128, 120], (elev - 0.65) * 2.4);
            }
            rgb = land;
            bumpVal = clampByte(135 + elev * 115);
            roughVal = 225;
          } else {
            // Oceans
            const depth = Math.min(1, (0.505 - cont) * 4.5);
            rgb = mixRgb([28, 108, 168], [10, 38, 88], depth);
            bumpVal = 120;
            roughVal = 55; // Specular ocean glint
          }
          roughness = 1.0;
          metalness = 0.06;
          bumpScale = 0.032;
          break;
        }
        case 'moon': {
          const maria = fbm3D(nx * 2.2, ny * 2.2, nz * 2.2, 305, 4);
          const craters = Math.abs(fbm3D(nx * 10.5, ny * 10.5, nz * 10.5, 317, 3) - 0.5) * 2;
          const highland = maria > 0.47 ? 1 : 0.35;
          const tone = highland * 0.65 + (1 - craters) * 0.35;
          rgb = mixRgb([84, 86, 92], [206, 208, 212], tone);
          bumpVal = clampByte((1 - craters) * 210 + maria * 45);
          roughness = 0.94;
          bumpScale = 0.048;
          break;
        }
        case 'mars': {
          const albedo = fbm3D(nx * 2.6, ny * 2.6, nz * 2.6, 401, 5);
          const fine = fbm3D(nx * 9, ny * 9, nz * 9, 419, 3);
          if (absLat > 0.89 - fine * 0.04) {
            rgb = [245, 240, 236];
            bumpVal = 175;
          } else {
            const basalt = albedo < 0.44 ? (0.44 - albedo) * 2.2 : 0;
            const rust = mixRgb([168, 76, 42], [222, 126, 76], fine);
            rgb = mixRgb(rust, [86, 52, 42], basalt);
            bumpVal = clampByte((albedo * 0.6 + fine * 0.4) * 255);
          }
          roughness = 0.88;
          bumpScale = 0.042;
          break;
        }
        case 'phobos':
        case 'deimos':
        case 'bennu': {
          const n = fbm3D(nx * 4.5, ny * 4.5, nz * 4.5, preset === 'bennu' ? 501 : 521, 4);
          const baseCol: [number, number, number] =
            preset === 'bennu'
              ? [54, 56, 62]
              : preset === 'phobos'
                ? [112, 98, 88]
                : [134, 122, 110];
          const hiCol: [number, number, number] =
            preset === 'bennu' ? [96, 100, 108] : [168, 152, 138];
          rgb = mixRgb(baseCol, hiCol, n);
          bumpVal = clampByte(n * 255);
          roughness = 0.95;
          bumpScale = 0.06;
          break;
        }
        case 'jupiter': {
          const turb = fbm3D(nx * 4.5, ny * 9.0, nz * 4.5, 601, 4);
          const bands = Math.sin(lat * 18 + (turb - 0.5) * 2.6);
          const fineBands = Math.cos(lat * 38 + turb * 4.0) * 0.5 + 0.5;
          let col = mixRgb(
            [176, 118, 78],
            [240, 224, 198],
            bands * 0.5 + 0.5
          );
          col = mixRgb(col, [206, 152, 108], fineBands * 0.35);

          // Great Red Spot around 22 deg South, lon ~ 1.8 rad
          const dLat = (lat + 0.38) / 0.16;
          const dLon = Math.sin((lon - 1.9) * 0.5) * 2 / 0.28;
          const grsDist = dLat * dLat + dLon * dLon;
          if (grsDist < 1.0) {
            const grsFactor = Math.pow(1 - grsDist, 1.4);
            col = mixRgb(col, [198, 72, 46], grsFactor * 0.9);
          }
          if (absLat > 0.82) {
            col = mixRgb(col, [112, 126, 148], (absLat - 0.82) * 3.5);
          }
          rgb = col;
          bumpVal = clampByte((turb * 0.5 + 0.5) * 140);
          roughness = 0.58;
          bumpScale = 0.006;
          break;
        }
        case 'io': {
          const sulfur = fbm3D(nx * 3.6, ny * 3.6, nz * 3.6, 701, 4);
          const calderas = fbm3D(nx * 10, ny * 10, nz * 10, 733, 3);
          let col = mixRgb([214, 142, 42], [244, 228, 98], sulfur);
          if (calderas > 0.72) {
            col = mixRgb(col, [48, 32, 26], (calderas - 0.72) * 3.2);
          } else if (calderas < 0.28) {
            col = mixRgb(col, [212, 68, 32], (0.28 - calderas) * 2.5);
          }
          rgb = col;
          bumpVal = clampByte(calderas * 200);
          roughness = 0.76;
          bumpScale = 0.02;
          break;
        }
        case 'europa': {
          const ice = fbm3D(nx * 3.0, ny * 3.0, nz * 3.0, 751, 4);
          const crack1 = Math.abs(fbm3D(nx * 7.5, ny * 7.5, nz * 7.5, 769, 3) - 0.5);
          const crack2 = Math.abs(fbm3D(nx * 11, ny * 5, nz * 11, 787, 2) - 0.5);
          const lineae = crack1 < 0.035 || crack2 < 0.025 ? 1 : 0;
          const baseIce = mixRgb([204, 220, 232], [244, 248, 252], ice);
          rgb = lineae ? mixRgb(baseIce, [158, 96, 68], 0.72) : baseIce;
          bumpVal = lineae ? 90 : 160;
          roughness = 0.42;
          bumpScale = 0.018;
          break;
        }
        case 'ganymede':
        case 'callisto': {
          const terrain = fbm3D(nx * 3.2, ny * 3.2, nz * 3.2, preset === 'ganymede' ? 809 : 829, 4);
          const scars = fbm3D(nx * 12, ny * 12, nz * 12, 853, 3);
          const darkCol: [number, number, number] =
            preset === 'ganymede' ? [92, 86, 80] : [68, 64, 62];
          const lightCol: [number, number, number] =
            preset === 'ganymede' ? [196, 192, 186] : [164, 158, 152];
          let col = mixRgb(darkCol, lightCol, terrain);
          if (scars > 0.76) {
            col = mixRgb(col, [235, 240, 245], (scars - 0.76) * 3.5);
          }
          rgb = col;
          bumpVal = clampByte((terrain * 0.5 + scars * 0.5) * 255);
          roughness = 0.78;
          bumpScale = 0.032;
          break;
        }
        case 'saturn': {
          const turb = fbm3D(nx * 3.5, ny * 8.0, nz * 3.5, 907, 3);
          const band = Math.sin(lat * 16 + (turb - 0.5) * 1.2) * 0.5 + 0.5;
          let col = mixRgb([198, 172, 122], [244, 228, 184], band);
          if (absLat > 0.84) {
            col = mixRgb(col, [138, 154, 158], (absLat - 0.84) * 4);
          }
          rgb = col;
          bumpVal = 128;
          roughness = 0.6;
          bumpScale = 0.004;
          break;
        }
        case 'titan': {
          const haze = fbm3D(nx * 2.5, ny * 3.5, nz * 2.5, 941, 3);
          let col = mixRgb([204, 134, 48], [238, 178, 86], haze);
          if (sinLat > 0.65) {
            col = mixRgb(col, [156, 102, 44], (sinLat - 0.65) * 1.8);
          }
          rgb = col;
          roughness = 0.68;
          bumpScale = 0.004;
          break;
        }
        case 'enceladus': {
          const ice = fbm3D(nx * 4.5, ny * 4.5, nz * 4.5, 977, 3);
          const stripes = sinLat < -0.68 && Math.abs(Math.sin(nx * 18 + nz * 14)) < 0.22;
          rgb = stripes
            ? [116, 198, 238]
            : mixRgb([228, 238, 248], [252, 254, 255], ice);
          bumpVal = stripes ? 85 : clampByte(150 + ice * 80);
          roughness = 0.34;
          bumpScale = 0.022;
          break;
        }
        case 'uranus': {
          const band = Math.sin(lat * 8) * 0.5 + 0.5;
          const haze = fbm3D(nx * 2.2, ny * 4.0, nz * 2.2, 1013, 3);
          rgb = mixRgb([122, 208, 224], [186, 240, 248], band * 0.65 + haze * 0.35);
          roughness = 0.55;
          bumpScale = 0.002;
          break;
        }
        case 'titania':
        case 'oberon': {
          const n = fbm3D(nx * 4.2, ny * 4.2, nz * 4.2, preset === 'titania' ? 1049 : 1069, 4);
          const rift = Math.abs(fbm3D(nx * 8, ny * 8, nz * 8, 1087, 2) - 0.5) < 0.03;
          rgb = rift
            ? [96, 98, 108]
            : mixRgb([126, 124, 130], [198, 196, 204], n);
          bumpVal = rift ? 70 : clampByte(n * 240);
          roughness = 0.78;
          bumpScale = 0.032;
          break;
        }
        case 'neptune': {
          const turb = fbm3D(nx * 3.8, ny * 7.5, nz * 3.8, 1103, 4);
          const band = Math.sin(lat * 14 + turb * 2.0) * 0.5 + 0.5;
          let col = mixRgb([26, 68, 178], [58, 122, 236], band);
          // High-altitude white methane cirrus streaks
          if (turb > 0.71 && absLat < 0.65) {
            col = mixRgb(col, [218, 238, 255], (turb - 0.71) * 2.8);
          }
          rgb = col;
          roughness = 0.52;
          bumpScale = 0.005;
          break;
        }
        case 'triton': {
          const cantaloupe = fbm3D(nx * 9.0, ny * 9.0, nz * 9.0, 1151, 3);
          if (sinLat < -0.25) {
            rgb = mixRgb([224, 202, 204], [246, 238, 240], cantaloupe);
          } else {
            rgb = mixRgb([158, 152, 156], [206, 198, 202], cantaloupe);
          }
          bumpVal = clampByte(cantaloupe * 230);
          roughness = 0.58;
          bumpScale = 0.025;
          break;
        }
        case 'pluto': {
          const tholin = fbm3D(nx * 3.0, ny * 3.0, nz * 3.0, 1201, 4);
          let col = mixRgb([132, 92, 72], [208, 176, 148], tholin);
          // Heart-shaped Sputnik Planitia / Tombaugh Regio near equator
          const dLat = (lat - 0.08) / 0.42;
          const dLon = Math.sin((lon - 2.6) * 0.5) * 2 / 0.52;
          if (dLat * dLat + dLon * dLon < 1.0) {
            const heart = Math.pow(1 - (dLat * dLat + dLon * dLon), 0.7);
            col = mixRgb(col, [246, 238, 224], heart * 0.92);
          }
          rgb = col;
          bumpVal = clampByte(tholin * 220);
          roughness = 0.72;
          bumpScale = 0.028;
          break;
        }
        case 'ceres': {
          const reg = fbm3D(nx * 4.5, ny * 4.5, nz * 4.5, 1249, 4);
          let col = mixRgb([76, 76, 80], [132, 130, 134], reg);
          // Bright Occator salt faculae spot
          const spot = (lat - 0.34) ** 2 + (Math.sin((lon - 1.4) * 0.5) * 2) ** 2;
          if (spot < 0.04) {
            col = [245, 248, 255];
          }
          rgb = col;
          bumpVal = clampByte(reg * 240);
          roughness = 0.88;
          bumpScale = 0.038;
          break;
        }
        case 'haumea':
        case 'eris': {
          const frost = fbm3D(nx * 3.5, ny * 3.5, nz * 3.5, preset === 'eris' ? 1289 : 1301, 3);
          rgb = mixRgb([212, 218, 228], [248, 250, 255], frost);
          bumpVal = clampByte(frost * 180);
          roughness = 0.42;
          bumpScale = 0.018;
          break;
        }
        case 'makemake': {
          const thol = fbm3D(nx * 3.5, ny * 3.5, nz * 3.5, 1327, 4);
          rgb = mixRgb([166, 104, 78], [224, 168, 136], thol);
          bumpVal = clampByte(thol * 200);
          roughness = 0.64;
          bumpScale = 0.022;
          break;
        }
        case 'comet':
        case 'belt':
        default: {
          const rock = fbm3D(nx * 5.0, ny * 5.0, nz * 5.0, 1409, 4);
          rgb = mixRgb([62, 66, 74], [136, 144, 156], rock);
          bumpVal = clampByte(rock * 255);
          roughness = 0.92;
          bumpScale = 0.05;
          break;
        }
      }

      colorImg.data[idx] = clampByte(rgb[0]);
      colorImg.data[idx + 1] = clampByte(rgb[1]);
      colorImg.data[idx + 2] = clampByte(rgb[2]);
      colorImg.data[idx + 3] = 255;

      bumpImg.data[idx] = bumpVal;
      bumpImg.data[idx + 1] = bumpVal;
      bumpImg.data[idx + 2] = bumpVal;
      bumpImg.data[idx + 3] = 255;

      if (roughImg) {
        roughImg.data[idx] = roughVal;
        roughImg.data[idx + 1] = roughVal;
        roughImg.data[idx + 2] = roughVal;
        roughImg.data[idx + 3] = 255;
      }
    }
  }

  colorCtx.putImageData(colorImg, 0, 0);
  bumpCtx.putImageData(bumpImg, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;

  let roughnessMap: THREE.CanvasTexture | undefined;
  if (roughCanvas && roughCtx && roughImg) {
    roughCtx.putImageData(roughImg, 0, 0);
    roughnessMap = new THREE.CanvasTexture(roughCanvas);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  }

  const bundle: PlanetTextureSet = {
    map,
    bumpMap,
    roughnessMap,
    roughness,
    metalness,
    bumpScale,
  };
  textureCache.set(preset, bundle);
  return bundle;
}

/**
 * Generates an animated-capable transparent cloud deck for Earth.
 */
export function getEarthCloudTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  if (cachedCloudTexture) return cachedCloudTexture;
  const width = isSoftwareGl ? 256 : 512;
  const height = width / 2;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(width, height);

  for (let py = 0; py < height; py++) {
    const v = py / (height - 1);
    const lat = (0.5 - v) * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);

    for (let px = 0; px < width; px++) {
      const lon = (px / width) * Math.PI * 2;
      const nx = cosLat * Math.cos(lon);
      const ny = sinLat;
      const nz = cosLat * Math.sin(lon);

      const n = fbm3D(nx * 3.8, ny * 4.8, nz * 3.8, 1777, 4);
      const alpha = n > 0.49 ? Math.min(235, ((n - 0.49) / 0.34) * 240) : 0;
      const idx = (py * width + px) * 4;
      img.data[idx] = 250;
      img.data[idx + 1] = 252;
      img.data[idx + 2] = 255;
      img.data[idx + 3] = clampByte(alpha);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = maxAnisotropy;
  cachedCloudTexture = tex;
  return tex;
}

/**
 * Generates radial ring color + optical depth alpha texture (Cassini & Encke gaps for Saturn).
 * Mapped along U in [0, 1] from innerRadius to outerRadius.
 */
export function getPlanetaryRingTexture(
  preset: RingConfig['preset'],
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const existing = ringTextureCache.get(preset);
  if (existing) return existing;

  const width = 512;
  const height = 8;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(width, height);

  for (let x = 0; x < width; x++) {
    const t = x / (width - 1); // 0 = inner edge, 1 = outer edge
    let r = 220;
    let g = 205;
    let b = 175;
    let alpha = 0;

    if (preset === 'saturn') {
      const fine = Math.sin(t * 210) * 0.08 + Math.cos(t * 95) * 0.06;
      if (t < 0.18) {
        // C Ring (faint dusky inner ring)
        r = 165;
        g = 152;
        b = 136;
        alpha = (0.12 + t * 0.9) * 140;
      } else if (t < 0.58) {
        // B Ring (bright, optically dense)
        const bFactor = Math.sin(((t - 0.18) / 0.4) * Math.PI);
        r = 242 + fine * 30;
        g = 224 + fine * 25;
        b = 186 + fine * 20;
        alpha = (0.68 + bFactor * 0.26 + fine) * 255;
      } else if (t < 0.65) {
        // Cassini Division (dark prominent gap!)
        r = 120;
        g = 112;
        b = 102;
        alpha = 18;
      } else if (t < 0.94) {
        // A Ring + narrow Encke Gap around t=0.87
        const encke = Math.abs(t - 0.87) < 0.012;
        r = 216 + fine * 25;
        g = 202 + fine * 20;
        b = 176 + fine * 18;
        alpha = encke ? 24 : (0.52 + fine * 0.8) * 230;
      } else if (t > 0.97 && t < 0.992) {
        // Narrow F Ring
        r = 235;
        g = 226;
        b = 208;
        alpha = 135;
      }
    } else if (preset === 'uranus') {
      // Narrow discrete epsilon & inner dark ice rings
      r = 175;
      g = 228;
      b = 242;
      const ringBands =
        Math.abs(t - 0.22) < 0.018 ||
        Math.abs(t - 0.48) < 0.015 ||
        Math.abs(t - 0.72) < 0.02 ||
        Math.abs(t - 0.92) < 0.032;
      alpha = ringBands ? 145 : 12;
    } else {
      // Jupiter tenuous gossamer halo ring
      r = 212;
      g = 176;
      b = 138;
      alpha = Math.sin(t * Math.PI) * 36;
    }

    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      img.data[idx] = clampByte(r);
      img.data[idx + 1] = clampByte(g);
      img.data[idx + 2] = clampByte(b);
      img.data[idx + 3] = clampByte(alpha);
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  ringTextureCache.set(preset, tex);
  return tex;
}

/**
 * Soft radial sprite texture for solar corona, star halos, and nebula clouds.
 */
export function getRadialGlowTexture(): THREE.CanvasTexture {
  if (cachedGlowTexture) return cachedGlowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.22, 'rgba(255, 255, 255, 0.65)');
  grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.16)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedGlowTexture = tex;
  return tex;
}
