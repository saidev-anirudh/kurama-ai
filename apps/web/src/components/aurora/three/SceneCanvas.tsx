"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import ParticleField from "./ParticleField";
import JarvisOrb from "./JarvisOrb";

export default function SceneCanvas() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#ff8a00" />
          <pointLight position={[-5, -5, 3]} intensity={0.3} color="#00f2ff" />
          <ParticleField />
          <JarvisOrb />
        </Suspense>
      </Canvas>
    </div>
  );
}
