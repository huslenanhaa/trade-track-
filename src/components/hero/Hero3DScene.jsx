/* eslint-disable react/no-unknown-property */
import React, { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

function createMoonMaps() {
  if (typeof document === "undefined") {
    return { colorMap: null, bumpMap: null };
  }

  const size = 1024;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const colorCtx = colorCanvas.getContext("2d");

  const colorGradient = colorCtx.createRadialGradient(
    size * 0.35,
    size * 0.32,
    size * 0.08,
    size * 0.5,
    size * 0.52,
    size * 0.75,
  );
  colorGradient.addColorStop(0, "#f7f3ea");
  colorGradient.addColorStop(0.32, "#d6d0c4");
  colorGradient.addColorStop(0.7, "#938c82");
  colorGradient.addColorStop(1, "#48484d");

  colorCtx.fillStyle = colorGradient;
  colorCtx.fillRect(0, 0, size, size);

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext("2d");

  bumpCtx.fillStyle = "#848484";
  bumpCtx.fillRect(0, 0, size, size);

  const craterCount = 44;
  for (let index = 0; index < craterCount; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 20 + Math.random() * 100;

    colorCtx.beginPath();
    colorCtx.fillStyle = `rgba(85, 82, 76, ${0.1 + Math.random() * 0.18})`;
    colorCtx.arc(x, y, radius, 0, Math.PI * 2);
    colorCtx.fill();

    colorCtx.beginPath();
    colorCtx.fillStyle = `rgba(255, 255, 255, ${0.03 + Math.random() * 0.05})`;
    colorCtx.arc(x - radius * 0.16, y - radius * 0.18, radius * 0.62, 0, Math.PI * 2);
    colorCtx.fill();

    bumpCtx.beginPath();
    bumpCtx.fillStyle = `rgba(170, 170, 170, ${0.16 + Math.random() * 0.18})`;
    bumpCtx.arc(x, y, radius, 0, Math.PI * 2);
    bumpCtx.fill();

    bumpCtx.beginPath();
    bumpCtx.fillStyle = `rgba(46, 46, 46, ${0.18 + Math.random() * 0.18})`;
    bumpCtx.arc(x + radius * 0.1, y + radius * 0.12, radius * 0.6, 0, Math.PI * 2);
    bumpCtx.fill();
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.needsUpdate = true;

  return { colorMap, bumpMap };
}

function Moon({ pointerRef, reducedMotion }) {
  const moonGroupRef = useRef(null);
  const moonMeshRef = useRef(null);
  const { colorMap, bumpMap } = useMemo(() => createMoonMaps(), []);

  useEffect(() => {
    return () => {
      colorMap?.dispose();
      bumpMap?.dispose();
    };
  }, [bumpMap, colorMap]);

  useFrame((state, delta) => {
    if (!moonGroupRef.current || !moonMeshRef.current) {
      return;
    }

    const mouseX = pointerRef.current.x;
    const mouseY = pointerRef.current.y;

    moonGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      moonGroupRef.current.rotation.x,
      mouseY * 0.18,
      0.04,
    );
    moonGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      moonGroupRef.current.rotation.y,
      mouseX * 0.22,
      0.04,
    );

    if (!reducedMotion) {
      moonMeshRef.current.rotation.y += delta * 0.12;
      moonMeshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.06;
    }
  });

  return (
    <group ref={moonGroupRef}>
      <mesh ref={moonMeshRef} castShadow receiveShadow>
        <sphereGeometry args={[1.18, 96, 96]} />
        <meshStandardMaterial
          color="#d6d0c4"
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.07}
          metalness={0.02}
          roughness={0.95}
        />
      </mesh>
      <mesh scale={1.28}>
        <sphereGeometry args={[1.18, 64, 64]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.055} />
      </mesh>
    </group>
  );
}

function OrbitRing({ radius, thickness, color, rotation, speed, reducedMotion }) {
  const ringRef = useRef(null);

  useFrame((_, delta) => {
    if (!ringRef.current || reducedMotion) {
      return;
    }

    ringRef.current.rotation.z += delta * speed;
  });

  return (
    <group rotation={rotation}>
      <mesh ref={ringRef}>
        <torusGeometry args={[radius, thickness, 20, 160]} />
        <meshBasicMaterial color={color} transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

function OrbitSatellites({ reducedMotion }) {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) {
      return;
    }

    groupRef.current.rotation.y += delta * 0.24;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.6} rotationIntensity={0.18} floatIntensity={0.34}>
        <mesh position={[2.1, 0.42, 0.28]} rotation={[0.32, -0.36, 0.12]}>
          <boxGeometry args={[0.82, 0.46, 0.05]} />
          <meshStandardMaterial color="#0f172a" emissive="#1d4ed8" emissiveIntensity={0.12} metalness={0.68} roughness={0.2} />
        </mesh>
      </Float>
      <Float speed={1.2} rotationIntensity={0.14} floatIntensity={0.3}>
        <mesh position={[-2.06, -0.34, -0.18]} rotation={[-0.26, 0.4, -0.18]}>
          <boxGeometry args={[0.72, 0.4, 0.05]} />
          <meshStandardMaterial color="#111827" emissive="#f97316" emissiveIntensity={0.16} metalness={0.72} roughness={0.18} />
        </mesh>
      </Float>
      <Float speed={1.3} rotationIntensity={0.1} floatIntensity={0.24}>
        <mesh position={[0, 1.8, -0.35]} rotation={[0.18, 0, 0.6]}>
          <torusGeometry args={[0.18, 0.03, 14, 48]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fb923c" emissiveIntensity={0.22} roughness={0.3} metalness={0.55} />
        </mesh>
      </Float>
    </group>
  );
}

function StarField({ count = 170 }) {
  const pointsRef = useRef(null);
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      values[index * 3] = (Math.random() - 0.5) * 10;
      values[index * 3 + 1] = (Math.random() - 0.5) * 6;
      values[index * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return values;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) {
      return;
    }

    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.04) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#93c5fd" size={0.03} transparent opacity={0.42} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function SceneContent({ pointerRef, reducedMotion, isMobile }) {
  return (
    <>
      <color attach="background" args={["#050816"]} />
      <fog attach="fog" args={["#050816", 7, 13]} />
      <PerspectiveCamera makeDefault position={[0, 0, 4.8]} fov={36} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2.8, 2.2, 4.5]} intensity={2.2} color="#ffe7bf" />
      <pointLight position={[-3, -1.6, 2.4]} intensity={1.2} color="#f97316" />
      <pointLight position={[3.2, 1.4, -1.8]} intensity={0.8} color="#60a5fa" />
      <StarField count={isMobile ? 90 : 170} />
      <Moon pointerRef={pointerRef} reducedMotion={reducedMotion} />
      <OrbitRing radius={1.72} thickness={0.013} color="#fb923c" rotation={[Math.PI / 2.8, 0.16, 0.24]} speed={0.18} reducedMotion={reducedMotion} />
      <OrbitRing radius={2.06} thickness={0.011} color="#38bdf8" rotation={[Math.PI / 2.25, 0.62, -0.18]} speed={-0.12} reducedMotion={reducedMotion} />
      <OrbitRing radius={2.34} thickness={0.009} color="#f59e0b" rotation={[Math.PI / 2.55, -0.42, 0.34]} speed={0.08} reducedMotion={reducedMotion} />
      <OrbitSatellites reducedMotion={reducedMotion} />
    </>
  );
}

function StaticMoonFallback() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_50%_35%,rgba(251,146,60,0.16),transparent_34%),radial-gradient(circle_at_72%_28%,rgba(96,165,250,0.18),transparent_26%),linear-gradient(180deg,#091223_0%,#050816_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06)_0%,transparent_55%)]" />
      <div className="absolute left-1/2 top-1/2 h-[15rem] w-[15rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_34%_28%,#faf6ee_0%,#d7d0c4_32%,#8d877d_68%,#3e4046_100%)] shadow-[0_0_90px_rgba(249,115,22,0.22),0_32px_120px_rgba(0,0,0,0.45)]" />
      <div className="absolute left-1/2 top-1/2 h-[21rem] w-[21rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-300/25" style={{ transform: "translate(-50%, -50%) rotateX(72deg)" }} />
      <div className="absolute left-1/2 top-1/2 h-[25rem] w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/20" style={{ transform: "translate(-50%, -50%) rotateX(64deg) rotateY(28deg)" }} />
      <div className="absolute left-[23%] top-[28%] h-2.5 w-2.5 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(253,186,116,0.85)]" />
      <div className="absolute right-[21%] top-[44%] h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.9)]" />
      <div className="absolute bottom-[22%] left-[32%] h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.85)]" />
    </div>
  );
}

export default function Hero3DScene() {
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const pointerRef = useRef({ x: 0, y: 0 });

  if (isMobile || reducedMotion) {
    return <StaticMoonFallback />;
  }

  return (
    <div
      className="h-full w-full"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        pointerRef.current.x = x;
        pointerRef.current.y = y;
      }}
      onPointerLeave={() => {
        pointerRef.current.x = 0;
        pointerRef.current.y = 0;
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        shadows
        className="h-full w-full rounded-[36px]"
      >
        <Suspense fallback={null}>
          <SceneContent pointerRef={pointerRef} reducedMotion={reducedMotion} isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
