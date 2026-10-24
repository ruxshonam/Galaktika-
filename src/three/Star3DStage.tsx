import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Language, NotableStar } from '../types/astronomy';
import { isSoftwareGl, isWebGLAvailable } from '../utils/webgl';
import { getRadialGlowTexture } from './proceduralTextures';
import { tText } from '../data/translations';

const STAR_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const STAR_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uCoronaColor;
  uniform float uGranulation;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

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
      p = p * 2.04 + vec3(0.17);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float ndotv = max(0.0, dot(normalize(vNormal), viewDir));

    vec3 samplePos = normalize(vPosition) * uGranulation + vec3(uTime * 0.14, -uTime * 0.09, uTime * 0.11);
    float cells = fbm(samplePos);
    float fine = fbm(samplePos * 2.4 - vec3(uTime * 0.22));
    float convection = smoothstep(0.24, 0.82, cells * 0.68 + fine * 0.32);

    // Physical limb darkening + hot convective bright core
    float limb = pow(ndotv, 0.45);
    vec3 hotCore = mix(uBaseColor, vec3(1.0, 0.99, 0.96), 0.45);
    vec3 coolLane = uCoronaColor * 0.68;

    vec3 surface = mix(coolLane, hotCore, convection * 0.72 + 0.28);
    surface *= (0.58 + 0.56 * limb);

    // Subtle chromospheric rim flare
    float rim = pow(1.0 - ndotv, 3.0);
    surface += uCoronaColor * rim * 0.65;

    gl_FragColor = vec4(surface, 1.0);
  }
`;

interface AnimatedStarMeshProps {
  star: NotableStar;
  showSunComparison: boolean;
  lang: Language;
}

const AnimatedStarMesh: React.FC<AnimatedStarMeshProps> = ({
  star,
  showSunComparison,
  lang,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const sunShaderRef = useRef<THREE.ShaderMaterial>(null);

  const glowTex = useMemo(() => getRadialGlowTexture(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(star.colorHex) },
      uCoronaColor: { value: new THREE.Color(star.coronaHex) },
      uGranulation: { value: star.granulationScale },
    }),
    [star.colorHex, star.coronaHex, star.granulationScale]
  );

  const sunUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color('#FFF1C1') },
      uCoronaColor: { value: new THREE.Color('#F59E0B') },
      uGranulation: { value: 16.0 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += delta;
    }
    if (sunShaderRef.current) {
      sunShaderRef.current.uniforms.uTime.value += delta;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.14;
    }
  });

  // Compute comparison display scale intelligently
  const { starRadius3D, sunRadius3D, sunOffsetX } = useMemo(() => {
    if (!showSunComparison || star.id === 'star-sun') {
      return { starRadius3D: 2.05, sunRadius3D: 0, sunOffsetX: 0 };
    }
    // True ratio up to 35x, compressed gently only for 680-764x supergiants so Sun remains >2px visible
    const trueRatio = star.radiusSolar;
    if (trueRatio <= 30) {
      const mainR = 2.15;
      const sunR = Math.max(0.08, mainR / trueRatio);
      return { starRadius3D: mainR, sunRadius3D: sunR, sunOffsetX: -(mainR + sunR + 1.1) };
    }
    // Supergiants (Canopus, Rigel, Antares, Betelgeuse): show Sun as tiny pinpoint dot beside giant limb
    const mainR = 2.45;
    const sunR = Math.max(0.035, mainR / Math.min(trueRatio, 90));
    return { starRadius3D: mainR, sunRadius3D: sunR, sunOffsetX: -(mainR + 0.95) };
  }, [showSunComparison, star.id, star.radiusSolar]);

  const oblateY = star.oblateness ?? 1;

  return (
    <group>
      <group
        ref={groupRef}
        position={[showSunComparison && star.id !== 'star-sun' ? 0.55 : 0, 0, 0]}
        scale={[1, oblateY, 1]}
      >
        <mesh>
          <sphereGeometry args={[starRadius3D, isSoftwareGl ? 36 : 64, isSoftwareGl ? 24 : 48]} />
          <shaderMaterial
            ref={shaderRef}
            key={star.id}
            uniforms={uniforms}
            vertexShader={STAR_VERTEX_SHADER}
            fragmentShader={STAR_FRAGMENT_SHADER}
          />
        </mesh>

        {/* Volumetric Corona Sprite */}
        <sprite scale={[starRadius3D * 4.1, starRadius3D * 4.1, 1]}>
          <spriteMaterial
            map={glowTex}
            color={star.coronaHex}
            transparent
            opacity={0.48}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      </group>

      {/* Optional Sun 3D Scale Reference */}
      {showSunComparison && star.id !== 'star-sun' && (
        <group position={[sunOffsetX, 0, 0]}>
          <mesh>
            <sphereGeometry args={[sunRadius3D, 28, 20]} />
            <shaderMaterial
              ref={sunShaderRef}
              uniforms={sunUniforms}
              vertexShader={STAR_VERTEX_SHADER}
              fragmentShader={STAR_FRAGMENT_SHADER}
            />
          </mesh>
          <sprite scale={[Math.max(0.32, sunRadius3D * 4.5), Math.max(0.32, sunRadius3D * 4.5), 1]}>
            <spriteMaterial
              map={glowTex}
              color="#F59E0B"
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
          <Html position={[0, -(sunRadius3D + 0.35), 0]} center distanceFactor={8}>
            <div className="whitespace-nowrap text-[11px] font-mono text-amber-300 bg-[#070B14]/90 border border-amber-400/30 px-2 py-0.5 rounded">
              {lang === 'uz' ? 'Quyosh (1 R☉)' : 'Sun (1 R☉)'}
              {star.radiusSolar > 90 ? ' · magnified pin' : ''}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};

interface Star3DStageProps {
  star: NotableStar;
  showSunComparison: boolean;
  lang: Language;
}

export const Star3DStage: React.FC<Star3DStageProps> = ({
  star,
  showSunComparison,
  lang,
}) => {
  const webglSupported = useMemo(() => isWebGLAvailable(), []);

  if (!webglSupported) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#060913] p-6 text-center">
        <div
          className="w-36 h-36 rounded-full mb-4 border border-white/20"
          style={{
            background: `radial-gradient(circle at 38% 35%, #ffffff, ${star.colorHex} 48%, ${star.coronaHex} 88%)`,
            boxShadow: `0 0 48px ${star.coronaHex}66`,
          }}
        />
        <p className="font-display text-lg font-semibold text-white">
          {tText(star.name, lang)}
        </p>
        <p className="text-xs text-slate-400 mt-1">{star.spectralClass}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#04060D]">
      <Canvas
        dpr={isSoftwareGl ? 1 : [1, 2]}
        camera={{ position: [0, 0.4, 6.6], fov: 42 }}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <color attach="background" args={['#04060D']} />
        <ambientLight intensity={0.4} />
        <AnimatedStarMesh
          star={star}
          showSunComparison={showSunComparison}
          lang={lang}
        />
        <OrbitControls
          enablePan={false}
          enableDamping={!isSoftwareGl}
          dampingFactor={0.07}
          minDistance={3.4}
          maxDistance={12}
        />
      </Canvas>
    </div>
  );
};
