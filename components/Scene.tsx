
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Float, SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { InstancedTree } from './InstancedTree';
import { Ribbon } from './Ribbon';
import { Star } from './Star';
import { TreeState, HandData } from '../types';

interface SceneProps {
  state: TreeState;
  handData: HandData | null;
}

export const Scene: React.FC<SceneProps> = ({ state, handData }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((threeState) => {
    if (groupRef.current) {
      // Constant slow drift
      groupRef.current.rotation.y += 0.003;

      // Handle interactive rotation via hand position
      // Rotates when the hand is either grabbing (fist) or open
      if (handData && (handData.isGrabbing || handData.isOpen)) {
        // High sensitivity for better "drag" feel
        const targetRotation = (handData.x - 0.5) * Math.PI * 6;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.15);
      }
    }

    if (ringRef.current) {
      const s = 1 + Math.sin(threeState.clock.elapsedTime * 1.5) * 0.05;
      ringRef.current.scale.set(s, s, s);
      ringRef.current.rotation.z += 0.005;
    }
  });

  return (
    <>
      <color attach="background" args={['#050103']} />
      <Environment preset="city" blur={0.8} />
      
      {/* Lights */}
      <ambientLight intensity={0.2} />
      <spotLight 
        position={[5, 10, 5]} 
        angle={0.15} 
        penumbra={1} 
        intensity={100} 
        color="#ff80bf" 
        castShadow 
      />
      <pointLight position={[0, -2.5, 0]} intensity={5} color="#ff0080" distance={8} />
      
      {/* Main content group scaled to 0.8 to fit screen nicely */}
      <group scale={0.8}>
        <group ref={groupRef}>
          <InstancedTree state={state} />
          <Ribbon state={state} />
          <Star state={state} />
          
          <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
            <SnowParticles count={200} />
          </Float>
        </group>

        {/* Ring and Shadows adjusted to match the 0.8 scale context */}
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.8, 0]}>
          <ringGeometry args={[4.2, 4.3, 128]} />
          <meshBasicMaterial color="#ff1493" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>

        <ContactShadows 
          opacity={0.6} 
          scale={20} 
          blur={2.5} 
          far={10} 
          resolution={512} 
          color="#200010" 
          position={[0, -6, 0]}
        />
      </group>
    </>
  );
};

const SnowParticles: React.FC<{ count: number }> = ({ count }) => {
  const points = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      data[i * 3] = (Math.random() - 0.5) * 40;
      data[i * 3 + 1] = (Math.random() - 0.5) * 40;
      data[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return data;
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y += 0.0005;
      points.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#ffffff" transparent opacity={0.4} />
    </points>
  );
};
