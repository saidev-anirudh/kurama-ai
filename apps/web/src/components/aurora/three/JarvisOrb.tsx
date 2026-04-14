"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { KuramaMode } from "@/store/voice-store";
import { useVoiceStore } from "@/store/voice-store";

function modeIntensity(mode: KuramaMode) {
  switch (mode) {
    case "thinking":
      return { spin: 1.35, breathe: 1.25, branch: 1.3 };
    case "speaking":
      return { spin: 1.12, breathe: 1.35, branch: 1.15 };
    case "listening":
      return { spin: 1.08, breathe: 1.12, branch: 1.2 };
    default:
      return { spin: 1, breathe: 1, branch: 1 };
  }
}

const BRANCH_COUNT = 120;
const PARTICLE_COUNT = 600;

export default function JarvisOrb() {
  const mode = useVoiceStore((s) => s.mode);
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const branchRef = useRef<THREE.Points>(null);
  const outerRef = useRef<THREE.Points>(null);

  const corePositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.8 + Math.random() * 0.4;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const branchPositions = useMemo(() => {
    const arr = new Float32Array(BRANCH_COUNT * 3);
    for (let i = 0; i < BRANCH_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + Math.random() * 1.8;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const branchBase = useMemo(() => new Float32Array(branchPositions), [branchPositions]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const m = modeIntensity(mode);

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.15 * m.spin;
    }

    if (coreRef.current) {
      const s = 1 + Math.sin(t * 2 * m.breathe) * 0.05 * m.breathe;
      coreRef.current.scale.set(s, s, s);
    }

    if (branchRef.current) {
      const pos = branchRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < BRANCH_COUNT; i++) {
        const i3 = i * 3;
        const pulse = 1 + Math.sin(t * 1.5 * m.branch + i * 0.3) * 0.15 * m.branch;
        pos[i3] = branchBase[i3] * pulse;
        pos[i3 + 1] = branchBase[i3 + 1] * pulse;
        pos[i3 + 2] = branchBase[i3 + 2] * pulse;
      }
      branchRef.current.geometry.attributes.position.needsUpdate = true;
      branchRef.current.rotation.y = -t * 0.1 * m.spin;
    }

    if (outerRef.current) {
      const pos = outerRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const pulse = 1 + Math.sin(t * 0.8 * m.breathe + i * 0.05) * 0.08 * m.breathe;
        pos[i3] = corePositions[i3] * pulse;
        pos[i3 + 1] = corePositions[i3 + 1] * pulse;
        pos[i3 + 2] = corePositions[i3 + 2] * pulse;
      }
      outerRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color="#ff6b00" transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color="#ff8a00" transparent opacity={0.6} />
      </mesh>
      <points ref={outerRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[corePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          color="#ff8a00"
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <points ref={branchRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[branchPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#ff6b00"
          transparent
          opacity={0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.8, 0.005, 8, 100]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 6, Math.PI / 4, 0]}>
        <torusGeometry args={[2.2, 0.004, 8, 100]} />
        <meshBasicMaterial color="#ff6b00" transparent opacity={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 5, Math.PI / 3, Math.PI / 6]}>
        <torusGeometry args={[2.6, 0.003, 8, 100]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}
