
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';
import { TreeState } from '../types';

const PARTICLE_COUNT = 8000;

export const DreamyTree: React.FC<{ state: TreeState }> = ({ state }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create static point distributions for states
  const { treePositions, explodePositions, colors } = useMemo(() => {
    const tree = new Float32Array(PARTICLE_COUNT * 3);
    const explode = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    
    const colorA = new THREE.Color('#ffb6c1'); // Light Pink
    const colorB = new THREE.Color('#ffd700'); // Gold
    const tempColor = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 1. Tree Position (Cone Shape)
      const height = Math.random() * 10 - 5;
      const normalizedHeight = (height + 5) / 10; // 0 to 1
      const radius = (1 - normalizedHeight) * 4;
      const angle = Math.random() * Math.PI * 2;
      
      tree[i * 3] = Math.cos(angle) * radius;
      tree[i * 3 + 1] = height;
      tree[i * 3 + 2] = Math.sin(angle) * radius;

      // 2. Explode Position (Sphere Shell)
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
      const explodeRadius = 8 + Math.random() * 4;

      explode[i * 3] = Math.cos(theta) * Math.sin(phi) * explodeRadius;
      explode[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * explodeRadius;
      explode[i * 3 + 2] = Math.cos(phi) * explodeRadius;

      // 3. Colors (Gradient)
      tempColor.lerpColors(colorA, colorB, normalizedHeight);
      cols[i * 3] = tempColor.r;
      cols[i * 3 + 1] = tempColor.g;
      cols[i * 3 + 2] = tempColor.b;
    }

    return { treePositions: tree, explodePositions: explode, colors: cols };
  }, []);

  // Initialize current positions
  const currentPositions = useMemo(() => new Float32Array(treePositions), [treePositions]);

  useFrame((threeState) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const target = state === TreeState.TREE ? treePositions : explodePositions;
    const lerpFactor = 0.08;

    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      positions[i] = THREE.MathUtils.lerp(positions[i], target[i], lerpFactor);
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.size = 0.08 + Math.sin(threeState.clock.elapsedTime * 3) * 0.02;
  });

  return (
    <group>
      <Star state={state} />
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={currentPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

const Star: React.FC<{ state: TreeState }> = ({ state }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((threeState) => {
    if (!meshRef.current) return;

    const targetY = state === TreeState.TREE ? 5.2 : 12;
    const targetOpacity = state === TreeState.TREE ? 1 : 0;
    const targetScale = state === TreeState.TREE ? 1 : 0.1;

    // Smoother interpolation for the star
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1));
    
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.1);

    // Sparkling animation
    const shine = 1 + Math.sin(threeState.clock.elapsedTime * 10) * 0.4;
    meshRef.current.scale.multiplyScalar(shine);
    
    if (lightRef.current) {
      lightRef.current.intensity = 2 * shine * material.opacity;
    }
  });

  return (
    <Float speed={4} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 5.2, 0]}>
        {/* Five-pointed star approximated with an icosahedron or similar */}
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial 
          color="#fff700" 
          emissive="#ffd700" 
          emissiveIntensity={4} 
          transparent
        />
        <pointLight ref={lightRef} color="#ffd700" distance={10} intensity={2} />
      </mesh>
    </Float>
  );
};
