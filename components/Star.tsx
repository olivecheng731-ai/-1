
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

export const Star: React.FC<{ state: TreeState }> = ({ state }) => {
  const starRef = useRef<THREE.Group>(null);
  const sparklesRef = useRef<THREE.Points>(null);

  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.8;
    const innerRadius = 0.35;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const sparkleParticles = useMemo(() => {
    const count = 60;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      data[i * 3] = (Math.random() - 0.5) * 2.5;
      data[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      data[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
    }
    return data;
  }, []);

  useFrame((threeState) => {
    if (!starRef.current) return;

    // The tree tip is at y=7 (h=12, ty=h-5). Placing star at 7.1 for perfect overlap.
    const targetY = state === TreeState.TREE ? 7.1 : 18;
    const targetScale = state === TreeState.TREE ? 1.3 : 0;
    const targetRotation = threeState.clock.elapsedTime * 1.5;

    // Smooth LERP for movement and scaling
    starRef.current.position.y = THREE.MathUtils.lerp(starRef.current.position.y, targetY, 0.08);
    starRef.current.scale.setScalar(THREE.MathUtils.lerp(starRef.current.scale.x, targetScale, 0.1));
    starRef.current.rotation.z = targetRotation;

    if (sparklesRef.current) {
      sparklesRef.current.rotation.y += 0.01;
      sparklesRef.current.rotation.x += 0.005;
      // Pulsing effect for sparkles
      const s = 1.2 + Math.sin(threeState.clock.elapsedTime * 6) * 0.4;
      sparklesRef.current.scale.setScalar(s);
      
      const material = sparklesRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.4 + Math.sin(threeState.clock.elapsedTime * 10) * 0.2;
    }
  });

  return (
    <group ref={starRef} position={[0, 7.1, 0]}>
      {/* The main star geometry */}
      <mesh rotation={[0, 0, 0]}>
        <extrudeGeometry args={[starShape, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05 }]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffd700" 
          emissiveIntensity={6} 
          metalness={1} 
          roughness={0} 
        />
      </mesh>
      
      {/* High-intensity glow light source at the tip */}
      <pointLight color="#fff700" intensity={25} distance={15} decay={2} />
      <pointLight color="#ff69b4" intensity={10} distance={8} position={[0, -1, 0]} />

      {/* Magical Sparkles around the star */}
      <points ref={sparklesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={sparkleParticles.length / 3} array={sparkleParticles} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial 
          size={0.12} 
          color="#fff700" 
          transparent 
          opacity={0.6} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false}
        />
      </points>
    </group>
  );
};
