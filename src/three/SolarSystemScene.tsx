import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as THREE from 'three';
import type { CelestialBody, Language } from '../types/astronomy';
import { CELESTIAL_BODIES } from '../data/celestialData';
import { tText } from '../data/translations';
import {
  computeKeplerianScenePosition,
  daysSinceJ2000,
  generateOrbitCurvePoints,
  isSoftwareGl,
} from '../utils/webgl';
import {
  getEarthCloudTexture,
  getPlanetTextures,
  getPlanetaryRingTexture,
  getRadialGlowTexture,
} from './proceduralTextures';

// Pre-allocated math Scratchpad (Zero GC inside useFrame)
const _scratchPos: [number, number, number] = [0, 0, 0];
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();

const SUN_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SUN_FRAGMENT = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vWorldPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec3(0.13);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float ndotv = max(0.0, dot(normalize(vNormal), viewDir));

    vec3 p = normalize(vPos) * 10.5 + vec3(uTime * 0.11, -uTime * 0.08, uTime * 0.09);
    float n1 = fbm(p);
    float n2 = fbm(p * 2.3 - vec3(uTime * 0.19));
    float gran = smoothstep(0.22, 0.85, n1 * 0.65 + n2 * 0.35);

    vec3 deepOrange = vec3(0.88, 0.28, 0.03);
    vec3 goldCore = vec3(1.0, 0.74, 0.22);
    vec3 whiteHot = vec3(1.0, 0.97, 0.86);

    vec3 col = mix(deepOrange, goldCore, gran);
    col = mix(col, whiteHot, pow(gran, 2.4) * 0.78);

    float limb = pow(ndotv, 0.42);
    col *= (0.66 + 0.48 * limb);

    float rim = pow(1.0 - ndotv, 2.8);
    col += vec3(1.0, 0.52, 0.12) * rim * 0.8;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const ATMO_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const ATMO_FRAGMENT = `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(0.0, dot(normalize(vNormal), viewDir));
    float intensity = pow(rim, 3.2) * 0.72;
    gl_FragColor = vec4(uColor, intensity);
  }
`;

/** Builds a radial-UV RingGeometry so 1D radial textures wrap 360° seamlessly */
function createRadialRingGeometry(innerR: number, outerR: number, segments = 96): THREE.RingGeometry {
  const geo = new THREE.RingGeometry(innerR, outerR, segments, 1);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const u = (r - innerR) / Math.max(0.0001, outerR - innerR);
    uv.setXY(i, Math.min(1, Math.max(0, u)), 0.5);
  }
  uv.needsUpdate = true;
  return geo;
}

/** Multi-layered pinpoint stars + galactic dust band + deep nebula glow sprites */
const DeepSpaceBackdrop: React.FC = () => {
  const glowTex = useMemo(() => getRadialGlowTexture(), []);

  const { positions, colors } = useMemo(() => {
    const count = isSoftwareGl ? 1800 : 5200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const palette = [
      new THREE.Color('#DCEBFF'), // Blue-white O/B/A
      new THREE.Color('#F8FAFC'), // Crisp white F
      new THREE.Color('#FEF3C7'), // Solar G
      new THREE.Color('#FDE68A'), // Warm K
      new THREE.Color('#FDBA74'), // Amber M
      new THREE.Color('#C7D2FE'), // Distant violet-blue
    ];

    let seed = 1337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const r = 340 + rand() * 320;
      const theta = rand() * Math.PI * 2;
      // Concentrate 40% of stars gently near a tilted Galactic plane
      const inBand = i % 5 < 2;
      const u = rand() * 2 - 1;
      const phi = inBand
        ? Math.PI / 2 + (u * 0.24) + Math.sin(theta) * 0.35
        : Math.acos(u);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = palette[Math.floor(rand() * palette.length)];
      const brightness = 0.55 + rand() * 0.45;
      col[i * 3] = c.r * brightness;
      col[i * 3 + 1] = c.g * brightness;
      col[i * 3 + 2] = c.b * brightness;
    }
    return { positions: pos, colors: col };
  }, []);

  const nebulaClouds = useMemo(
    () => [
      { pos: [-290, 95, -340] as [number, number, number], scale: 240, color: '#1E3A8A', opacity: 0.14 },
      { pos: [310, -80, -320] as [number, number, number], scale: 260, color: '#4C1D95', opacity: 0.12 },
      { pos: [-180, -110, 360] as [number, number, number], scale: 220, color: '#1D4ED8', opacity: 0.1 },
      { pos: [260, 130, 290] as [number, number, number], scale: 210, color: '#5B21B6', opacity: 0.11 },
    ],
    []
  );

  return (
    <group>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={isSoftwareGl ? 1.4 : 1.35}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </points>

      {nebulaClouds.map((n, idx) => (
        <sprite key={idx} position={n.pos} scale={[n.scale, n.scale * 0.65, 1]}>
          <spriteMaterial
            map={glowTex}
            color={n.color}
            transparent
            opacity={n.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
};

/** Instanced rocky Asteroid Belt & icy Kuiper Belt */
interface BeltFieldProps {
  innerRadius: number;
  outerRadius: number;
  verticalSpread: number;
  count: number;
  baseColor: string;
  secondaryColor: string;
  rotationSpeed: number;
  paused: boolean;
  visible: boolean;
}

const BeltInstancedField: React.FC<BeltFieldProps> = ({
  innerRadius,
  outerRadius,
  verticalSpread,
  count,
  baseColor,
  secondaryColor,
  rotationSpeed,
  paused,
  visible,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    const c1 = new THREE.Color(baseColor);
    const c2 = new THREE.Color(secondaryColor);
    const tempCol = new THREE.Color();

    let seed = Math.round(innerRadius * 97 + count);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const r = innerRadius + Math.pow(rand(), 0.85) * (outerRadius - innerRadius);
      const angle = rand() * Math.PI * 2;
      const y = (rand() - 0.5) * 2 * verticalSpread * (0.4 + rand() * 0.6);

      dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);

      const baseScale = 0.09 + rand() * 0.24;
      dummy.scale.set(
        baseScale * (0.8 + rand() * 0.5),
        baseScale * (0.65 + rand() * 0.45),
        baseScale * (0.8 + rand() * 0.5)
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      tempCol.copy(c1).lerp(c2, rand());
      mesh.setColorAt(i, tempCol);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [innerRadius, outerRadius, verticalSpread, count, baseColor, secondaryColor]);

  useFrame((_, delta) => {
    if (!paused && meshRef.current && visible) {
      meshRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      visible={visible}
      frustumCulled={false}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.86} metalness={0.08} />
    </instancedMesh>
  );
};

/** Glowing animated 3D Sun at [0,0,0] */
const SunObject: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  showLabels: boolean;
  lang: Language;
  paused: boolean;
  onSelect: (id: string) => void;
}> = ({ body, isSelected, showLabels, lang, paused, onSelect }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowTex = useMemo(() => getRadialGlowTexture(), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, delta) => {
    if (!paused) {
      if (shaderRef.current) shaderRef.current.uniforms.uTime.value += delta;
      if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(body.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[body.sceneRadius, isSoftwareGl ? 32 : 56, isSoftwareGl ? 24 : 40]} />
        <shaderMaterial
          ref={shaderRef}
          uniforms={uniforms}
          vertexShader={SUN_VERTEX}
          fragmentShader={SUN_FRAGMENT}
        />
      </mesh>

      {/* Inner & Outer Solar Corona */}
      <sprite scale={[body.sceneRadius * 3.8, body.sceneRadius * 3.8, 1]}>
        <spriteMaterial
          map={glowTex}
          color="#F59E0B"
          transparent
          opacity={0.58}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <sprite scale={[body.sceneRadius * 6.5, body.sceneRadius * 6.5, 1]}>
        <spriteMaterial
          map={glowTex}
          color="#EA580C"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {showLabels && (
        <Html position={[0, body.sceneRadius + 1.3, 0]} center zIndexRange={[10, 0]}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(body.id);
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors border ${
              isSelected
                ? 'bg-amber-500 text-slate-950 border-amber-300 font-semibold'
                : 'bg-[#070B14]/88 text-amber-200 border-amber-400/30 hover:border-amber-300'
            }`}
          >
            {tText(body.name, lang)}
          </button>
        </Html>
      )}
    </group>
  );
};

interface CelestialMeshNodeProps {
  body: CelestialBody;
  worldPositions: Map<string, THREE.Vector3>;
  simTimestampRef: React.MutableRefObject<number>;
  proportionalSizes: boolean;
  showOrbits: boolean;
  showLabels: boolean;
  selectedBodyId: string | null;
  selectedParentId: string | null;
  paused: boolean;
  lang: Language;
  maxAnisotropy: number;
  onSelect: (id: string) => void;
}

const CelestialMeshNode: React.FC<CelestialMeshNodeProps> = ({
  body,
  worldPositions,
  simTimestampRef,
  proportionalSizes,
  showOrbits,
  showLabels,
  selectedBodyId,
  selectedParentId,
  paused,
  lang,
  maxAnisotropy,
  onSelect,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const spinMeshRef = useRef<THREE.Mesh>(null);
  const cloudMeshRef = useRef<THREE.Mesh>(null);
  const cometTailRef = useRef<THREE.Group>(null);
  const moonOrbitGroupRef = useRef<THREE.Group>(null);

  const isBeltAnchor = body.category === 'belt';

  const radius = useMemo(() => {
    if (proportionalSizes) {
      return Math.max(0.14, body.earthRadiusRatio * 0.92);
    }
    return body.sceneRadius;
  }, [proportionalSizes, body.earthRadiusRatio, body.sceneRadius]);

  const textures = useMemo(() => {
    if (isBeltAnchor) return null;
    return getPlanetTextures(body.texturePreset, maxAnisotropy);
  }, [body.texturePreset, isBeltAnchor, maxAnisotropy]);

  const cloudTex = useMemo(() => {
    if (!body.hasClouds) return null;
    return getEarthCloudTexture(maxAnisotropy);
  }, [body.hasClouds, maxAnisotropy]);

  const ringData = useMemo(() => {
    if (!body.ring) return null;
    const inner = radius * body.ring.innerRadiusRatio;
    const outer = radius * body.ring.outerRadiusRatio;
    const geometry = createRadialRingGeometry(inner, outer, isSoftwareGl ? 64 : 112);
    const texture = getPlanetaryRingTexture(body.ring.preset, maxAnisotropy);
    return { geometry, texture };
  }, [body.ring, radius, maxAnisotropy]);

  useEffect(() => {
    return () => {
      ringData?.geometry.dispose();
    };
  }, [ringData]);

  const orbitPoints = useMemo(() => {
    if (!body.kepler || isBeltAnchor) return null;
    return generateOrbitCurvePoints(
      body.kepler,
      body.sceneOrbitRadius,
      body.category === 'moon' ? 72 : 144
    );
  }, [body.kepler, body.sceneOrbitRadius, body.category, isBeltAnchor]);

  const atmoUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(body.atmosphereColor || '#38BDF8') },
    }),
    [body.atmosphereColor]
  );

  const glowTex = useMemo(() => getRadialGlowTexture(), []);

  useFrame((_, delta) => {
    const days = daysSinceJ2000(simTimestampRef.current);

    if (body.kepler && rootGroupRef.current) {
      computeKeplerianScenePosition(
        body.kepler,
        days,
        body.sceneOrbitRadius,
        _scratchPos
      );

      if (body.parentId) {
        const parentPos = worldPositions.get(body.parentId);
        if (parentPos) {
          rootGroupRef.current.position.set(
            parentPos.x + _scratchPos[0],
            parentPos.y + _scratchPos[1],
            parentPos.z + _scratchPos[2]
          );
          if (moonOrbitGroupRef.current) {
            moonOrbitGroupRef.current.position.copy(parentPos);
          }
        }
      } else {
        rootGroupRef.current.position.set(
          _scratchPos[0],
          _scratchPos[1],
          _scratchPos[2]
        );
      }

      let stored = worldPositions.get(body.id);
      if (!stored) {
        stored = new THREE.Vector3();
        worldPositions.set(body.id, stored);
      }
      stored.copy(rootGroupRef.current.position);

      // Orient Comet Halley's dual tail directly away from the Sun [0,0,0]
      if (body.category === 'comet' && cometTailRef.current) {
        _vecA.copy(rootGroupRef.current.position).normalize();
        _quat.setFromUnitVectors(_upAxis, _vecA);
        cometTailRef.current.quaternion.copy(_quat);
      }
    }

    if (!paused && spinMeshRef.current && !isBeltAnchor) {
      const dir = body.rotationPeriodHours < 0 ? -1 : 1;
      const rate = Math.min(2.2, 12 / Math.max(4, Math.abs(body.rotationPeriodHours)));
      spinMeshRef.current.rotation.y += delta * rate * dir;
    }
    if (!paused && cloudMeshRef.current) {
      cloudMeshRef.current.rotation.y += delta * 0.58;
    }
  });

  const isSelected = selectedBodyId === body.id;
  const shouldShowLabel = useMemo(() => {
    if (!showLabels) return false;
    if (isSelected) return true;
    if (body.category === 'planet' || body.category === 'dwarf-planet') return true;
    if (body.category === 'comet' || body.category === 'neo') return true;
    if (body.category === 'belt') return false;
    if (body.category === 'moon') {
      // Show moon label when parent planet or sibling moon is focused, or for Earth's Moon
      return (
        body.id === 'moon' ||
        selectedBodyId === body.parentId ||
        selectedParentId === body.parentId
      );
    }
    return false;
  }, [showLabels, isSelected, body.category, body.id, body.parentId, selectedBodyId, selectedParentId]);

  const showThisOrbit = useMemo(() => {
    if (!showOrbits || !orbitPoints) return false;
    if (body.category === 'moon') {
      return (
        body.id === 'moon' ||
        isSelected ||
        selectedBodyId === body.parentId ||
        selectedParentId === body.parentId
      );
    }
    return true;
  }, [showOrbits, orbitPoints, body.category, body.id, body.parentId, isSelected, selectedBodyId, selectedParentId]);

  const shapeScale: [number, number, number] =
    body.irregularScale || body.oblateness || [1, 1, 1];

  const hitRadius = Math.max(radius * 1.6, body.category === 'moon' ? 0.42 : 0.85);

  return (
    <>
      {showThisOrbit && orbitPoints && (
        <group ref={body.parentId ? moonOrbitGroupRef : undefined}>
          <Line
            points={orbitPoints}
            color={isSelected ? '#60A5FA' : body.orbitColor}
            lineWidth={isSelected ? 1.6 : 1.0}
            transparent
            opacity={
              isSelected
                ? 0.85
                : body.category === 'dwarf-planet' || body.category === 'comet'
                  ? 0.28
                  : 0.36
            }
          />
        </group>
      )}

      <group ref={rootGroupRef}>
        {!isBeltAnchor && textures && (
          <group rotation={[0, 0, THREE.MathUtils.degToRad(body.axialTiltDeg)]}>
            {/* Primary 3D Sphere / Irregular Mesh */}
            <mesh ref={spinMeshRef} scale={shapeScale}>
              <sphereGeometry
                args={[
                  radius,
                  isSoftwareGl ? 24 : body.category === 'moon' ? 28 : 48,
                  isSoftwareGl ? 16 : body.category === 'moon' ? 20 : 36,
                ]}
              />
              <meshStandardMaterial
                map={textures.map}
                bumpMap={textures.bumpMap}
                bumpScale={textures.bumpScale}
                roughnessMap={textures.roughnessMap}
                roughness={textures.roughness}
                metalness={textures.metalness}
              />
            </mesh>

            {/* Invisible generous hit target for effortless raycast selection */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(body.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[hitRadius, 12, 10]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Earth Dynamic Cloud Layer */}
            {cloudTex && (
              <mesh ref={cloudMeshRef}>
                <sphereGeometry args={[radius * 1.022, isSoftwareGl ? 24 : 40, isSoftwareGl ? 16 : 28]} />
                <meshStandardMaterial
                  map={cloudTex}
                  transparent
                  opacity={0.78}
                  depthWrite={false}
                  roughness={0.9}
                />
              </mesh>
            )}

            {/* Atmospheric Rayleigh Fresnel Shell */}
            {body.hasAtmosphere && (
              <mesh scale={body.oblateness || [1, 1, 1]}>
                <sphereGeometry args={[radius * 1.065, 28, 20]} />
                <shaderMaterial
                  uniforms={atmoUniforms}
                  vertexShader={ATMO_VERTEX}
                  fragmentShader={ATMO_FRAGMENT}
                  transparent
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Planetary Ring System (Saturn, Uranus, Jupiter) */}
            {ringData && (
              <mesh geometry={ringData.geometry} rotation={[-Math.PI / 2, 0, 0]}>
                <meshStandardMaterial
                  map={ringData.texture}
                  transparent
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  roughness={0.65}
                  metalness={0.05}
                />
              </mesh>
            )}

            {/* South-Polar Cryovolcanic Geyser Plume (Enceladus & Triton) */}
            {body.hasCryoPlume && (
              <sprite
                position={[0, -radius * 1.45, 0]}
                scale={[radius * 1.4, radius * 2.2, 1]}
              >
                <spriteMaterial
                  map={glowTex}
                  color="#BAE6FD"
                  transparent
                  opacity={0.45}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </sprite>
            )}
          </group>
        )}

        {/* Comet Coma + Anti-Sunward Ion & Dust Tails */}
        {body.category === 'comet' && (
          <>
            <sprite scale={[radius * 5.5, radius * 5.5, 1]}>
              <spriteMaterial
                map={glowTex}
                color="#7DD3FC"
                transparent
                opacity={0.55}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </sprite>
            <group ref={cometTailRef}>
              {/* Blue Ion Tail */}
              <mesh position={[0, 4.4, 0]}>
                <coneGeometry args={[0.65, 8.8, 16, 1, true]} />
                <meshBasicMaterial
                  color="#38BDF8"
                  transparent
                  opacity={0.26}
                  side={THREE.DoubleSide}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              {/* Curved Warm Dust Tail */}
              <mesh position={[0.45, 3.4, 0.2]} rotation={[0, 0, -0.14]}>
                <coneGeometry args={[0.95, 6.8, 16, 1, true]} />
                <meshBasicMaterial
                  color="#FDE68A"
                  transparent
                  opacity={0.18}
                  side={THREE.DoubleSide}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>
          </>
        )}

        {/* Crisp Selectable 3D Label */}
        {shouldShowLabel && (
          <Html
            position={[0, radius + (body.category === 'moon' ? 0.35 : 0.72), 0]}
            center
            zIndexRange={[10, 0]}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(body.id);
              }}
              className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors border ${
                isSelected
                  ? 'bg-blue-500 text-white border-blue-300 font-semibold shadow-sm'
                  : body.category === 'dwarf-planet'
                    ? 'bg-[#090D18]/88 text-purple-200 border-purple-400/25 hover:border-purple-300'
                    : body.category === 'moon'
                      ? 'bg-[#090D18]/85 text-slate-300 border-white/15 hover:border-white/40 text-[10px]'
                      : 'bg-[#090D18]/88 text-slate-100 border-white/15 hover:border-blue-400/60'
              }`}
            >
              {tText(body.name, lang)}
              {body.category === 'dwarf-planet'
                ? lang === 'uz'
                  ? ' · Mitti'
                  : ' · Dwarf'
                : ''}
            </button>
          </Html>
        )}
      </group>
    </>
  );
};

/** Smooth Exponential Camera Fly-To & Real-Time Orbital Target Tracker */
const CameraRig: React.FC<{
  selectedBody: CelestialBody | null;
  worldPositions: Map<string, THREE.Vector3>;
  cameraResetTrigger: number;
  proportionalSizes: boolean;
}> = ({ selectedBody, worldPositions, cameraResetTrigger, proportionalSizes }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const isApproachingRef = useRef(false);
  const prevTargetPosRef = useRef(new THREE.Vector3());
  const hasPrevTargetRef = useRef(false);
  const resettingOverviewRef = useRef(false);

  // Trigger smooth approach whenever selectedBody changes
  useEffect(() => {
    if (selectedBody) {
      isApproachingRef.current = true;
      resettingOverviewRef.current = false;
      hasPrevTargetRef.current = false;
    } else {
      isApproachingRef.current = false;
    }
  }, [selectedBody?.id]);

  // Trigger smooth return to wide solar system overview
  useEffect(() => {
    if (cameraResetTrigger > 0) {
      resettingOverviewRef.current = true;
      isApproachingRef.current = false;
      hasPrevTargetRef.current = false;
    }
  }, [cameraResetTrigger]);

  useFrame((_, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const dt = Math.min(rawDelta, 0.05);
    const alpha = 1 - Math.exp(-5.0 * dt);

    if (resettingOverviewRef.current) {
      _vecA.set(0, 58, 128);
      _vecB.set(0, 0, 0);
      camera.position.lerp(_vecA, alpha);
      controls.target.lerp(_vecB, alpha);
      controls.update();
      if (camera.position.distanceTo(_vecA) < 0.8) {
        resettingOverviewRef.current = false;
      }
      return;
    }

    if (!selectedBody) {
      controls.update();
      return;
    }

    // Special panoramic framing for Asteroid Belt or Kuiper Belt
    if (selectedBody.category === 'belt') {
      const beltR = selectedBody.sceneOrbitRadius;
      _vecB.set(beltR * 0.72, 0, 0);
      _vecA.set(beltR * 0.72, 24, 38);
      controls.target.lerp(_vecB, alpha);
      if (isApproachingRef.current) {
        camera.position.lerp(_vecA, alpha);
        if (camera.position.distanceTo(_vecA) < 0.7) {
          isApproachingRef.current = false;
        }
      }
      controls.update();
      return;
    }

    const targetWorld =
      selectedBody.id === 'sun'
        ? _vecC.set(0, 0, 0)
        : worldPositions.get(selectedBody.id);

    if (!targetWorld) {
      controls.update();
      return;
    }

    // Move camera along with the orbiting planet/moon delta so manual orbit stays locked on it
    if (hasPrevTargetRef.current && !isApproachingRef.current) {
      _vecA.subVectors(targetWorld, prevTargetPosRef.current);
      camera.position.add(_vecA);
      controls.target.add(_vecA);
    } else {
      controls.target.lerp(targetWorld, alpha * 1.35);
    }
    prevTargetPosRef.current.copy(targetWorld);
    hasPrevTargetRef.current = true;

    if (isApproachingRef.current) {
      const effectiveR = proportionalSizes
        ? Math.max(0.18, selectedBody.earthRadiusRatio * 0.92)
        : selectedBody.sceneRadius;
      const dist =
        selectedBody.id === 'sun'
          ? 20
          : selectedBody.ring
            ? effectiveR * 5.2 + 1.8
            : Math.max(1.35, effectiveR * 4.1 + 0.85);

      // Approach from sunlit outward diagonal so the planet's day terminator is beautifully lit
      _vecB.copy(targetWorld);
      if (_vecB.lengthSq() < 0.01) {
        _vecB.set(0.4, 0.35, 1).normalize();
      } else {
        // Angle slightly sunward + upward so user sees illuminated crescent/gibbus face!
        _vecB.normalize().negate().add(_vecA.set(0.42, 0.38, 0.42)).normalize();
      }

      _vecA.copy(targetWorld).addScaledVector(_vecB, dist);
      camera.position.lerp(_vecA, alpha);
      controls.target.lerp(targetWorld, alpha * 1.4);

      if (
        camera.position.distanceTo(_vecA) < 0.18 &&
        controls.target.distanceTo(targetWorld) < 0.08
      ) {
        isApproachingRef.current = false;
      }
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={!isSoftwareGl}
      dampingFactor={0.065}
      minDistance={0.65}
      maxDistance={420}
      onStart={() => {
        // Immediately yield scripted camera approach when user manually drags/zooms
        isApproachingRef.current = false;
        resettingOverviewRef.current = false;
      }}
    />
  );
};

/** Simulation Clock driver inside R3F frame loop */
const SimulationClockTicker: React.FC<{
  simTimestampRef: React.MutableRefObject<number>;
  paused: boolean;
  speedDaysPerSecond: number;
  isRealTimeJ2000: boolean;
  onDateSample: (ms: number) => void;
}> = ({
  simTimestampRef,
  paused,
  speedDaysPerSecond,
  isRealTimeJ2000,
  onDateSample,
}) => {
  const accumRef = useRef(0);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    if (!paused) {
      if (isRealTimeJ2000) {
        simTimestampRef.current += dt * 1000;
      } else {
        simTimestampRef.current += dt * speedDaysPerSecond * 86_400_000;
      }
    }
    accumRef.current += dt;
    if (accumRef.current >= 0.25) {
      accumRef.current = 0;
      onDateSample(simTimestampRef.current);
    }
  });

  return null;
};

export interface SolarSystemSceneProps {
  selectedBodyId: string | null;
  onSelectBody: (id: string | null) => void;
  paused: boolean;
  isRealTimeJ2000: boolean;
  speedDaysPerSecond: number;
  simTimestampRef: React.MutableRefObject<number>;
  onDateSample: (ms: number) => void;
  showOrbits: boolean;
  showLabels: boolean;
  showBelts: boolean;
  proportionalSizes: boolean;
  cameraResetTrigger: number;
  lang: Language;
  onSceneReady?: () => void;
}

export const SolarSystemScene: React.FC<SolarSystemSceneProps> = ({
  selectedBodyId,
  onSelectBody,
  paused,
  isRealTimeJ2000,
  speedDaysPerSecond,
  simTimestampRef,
  onDateSample,
  showOrbits,
  showLabels,
  showBelts,
  proportionalSizes,
  cameraResetTrigger,
  lang,
  onSceneReady,
}) => {
  const [maxAnisotropy, setMaxAnisotropy] = useState(4);
  const [contextLost, setContextLost] = useState(false);

  const worldPositions = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    map.set('sun', new THREE.Vector3(0, 0, 0));
    return map;
  }, []);

  const sunBody = useMemo(
    () => CELESTIAL_BODIES.find((b) => b.id === 'sun')!,
    []
  );

  // Heliocentric bodies first so parent positions are updated before moons
  const primaryBodies = useMemo(
    () => CELESTIAL_BODIES.filter((b) => b.id !== 'sun' && !b.parentId),
    []
  );
  const moonBodies = useMemo(
    () => CELESTIAL_BODIES.filter((b) => Boolean(b.parentId)),
    []
  );

  const selectedBody = useMemo(
    () => CELESTIAL_BODIES.find((b) => b.id === selectedBodyId) ?? null,
    [selectedBodyId]
  );

  return (
    <div className="relative w-full h-full bg-[#04060D] select-none">
      {contextLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#05070E] text-slate-200 p-6 text-center">
          <div>
            <p className="font-display text-lg font-semibold">
              {lang === 'uz'
                ? 'WebGL grafik konteksti qayta tiklanmoqda...'
                : 'Restoring 3D WebGL Graphics Context...'}
            </p>
          </div>
        </div>
      )}

      <Canvas
        dpr={isSoftwareGl ? 1 : [1, 2]}
        camera={{ position: [0, 58, 128], fov: 45, near: 0.1, far: 1400 }}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
        }}
        onPointerMissed={() => {
          // Clicking empty deep space leaves current view calm without accidental jarring resets
        }}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          setMaxAnisotropy(Math.min(8, gl.capabilities.getMaxAnisotropy() || 4));

          // Studio PMREM reflection environment for realistic PBR oceans, ice moons & rings
          const pmremGenerator = new THREE.PMREMGenerator(gl);
          scene.environment = pmremGenerator.fromScene(
            new RoomEnvironment(),
            0.04
          ).texture;
          scene.environmentIntensity = 0.24;
          pmremGenerator.dispose();

          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setContextLost(true);
          });
          canvas.addEventListener('webglcontextrestored', () => {
            setContextLost(false);
          });

          onSceneReady?.();
        }}
      >
        <color attach="background" args={['#04060D']} />
        <fogExp2 attach="fog" args={['#04060D', 0.00075]} />

        {/* Solar PointLight + Cool Cosmic Starlight Fill */}
        <pointLight position={[0, 0, 0]} intensity={2.85} decay={0} color="#FFF7ED" />
        <hemisphereLight args={['#60A5FA', '#0F172A', 0.38]} />

        <SimulationClockTicker
          simTimestampRef={simTimestampRef}
          paused={paused}
          speedDaysPerSecond={speedDaysPerSecond}
          isRealTimeJ2000={isRealTimeJ2000}
          onDateSample={onDateSample}
        />

        <DeepSpaceBackdrop />

        {/* Sun */}
        <SunObject
          body={sunBody}
          isSelected={selectedBodyId === 'sun'}
          showLabels={showLabels}
          lang={lang}
          paused={paused}
          onSelect={(id) => onSelectBody(id)}
        />

        {/* Asteroid Belt (between Mars 41 and Jupiter 68) */}
        <BeltInstancedField
          innerRadius={47.5}
          outerRadius={57.5}
          verticalSpread={2.2}
          count={isSoftwareGl ? 220 : 650}
          baseColor="#94A3B8"
          secondaryColor="#78716C"
          rotationSpeed={0.018}
          paused={paused}
          visible={showBelts}
        />

        {/* Kuiper Belt (beyond Neptune 144: 156 to 198) */}
        <BeltInstancedField
          innerRadius={156}
          outerRadius={198}
          verticalSpread={7.5}
          count={isSoftwareGl ? 260 : 780}
          baseColor="#7DD3FC"
          secondaryColor="#94A3B8"
          rotationSpeed={0.006}
          paused={paused}
          visible={showBelts}
        />

        {/* Primary Planets, Dwarf Planets, Comet Halley & NEO Bennu */}
        {primaryBodies.map((body) => (
          <CelestialMeshNode
            key={body.id}
            body={body}
            worldPositions={worldPositions}
            simTimestampRef={simTimestampRef}
            proportionalSizes={proportionalSizes}
            showOrbits={showOrbits}
            showLabels={showLabels}
            selectedBodyId={selectedBodyId}
            selectedParentId={selectedBody?.parentId ?? null}
            paused={paused}
            lang={lang}
            maxAnisotropy={maxAnisotropy}
            onSelect={(id) => onSelectBody(id)}
          />
        ))}

        {/* Major Moons orbiting their Parent Planets */}
        {moonBodies.map((moon) => (
          <CelestialMeshNode
            key={moon.id}
            body={moon}
            worldPositions={worldPositions}
            simTimestampRef={simTimestampRef}
            proportionalSizes={proportionalSizes}
            showOrbits={showOrbits}
            showLabels={showLabels}
            selectedBodyId={selectedBodyId}
            selectedParentId={selectedBody?.parentId ?? null}
            paused={paused}
            lang={lang}
            maxAnisotropy={maxAnisotropy}
            onSelect={(id) => onSelectBody(id)}
          />
        ))}

        <CameraRig
          selectedBody={selectedBody}
          worldPositions={worldPositions}
          cameraResetTrigger={cameraResetTrigger}
          proportionalSizes={proportionalSizes}
        />
      </Canvas>
    </div>
  );
};
