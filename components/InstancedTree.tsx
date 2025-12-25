
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

const LEAF_COUNT = 5500;
const DECO_COUNT = 1500;
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export const InstancedTree: React.FC<{ state: TreeState }> = ({ state }) => {
  const leafMeshRef = useRef<THREE.InstancedMesh>(null);
  const decoMeshRef = useRef<THREE.InstancedMesh>(null);

  // Initial data generation
  const { leafData, decoData } = useMemo(() => {
    const leaves = [];
    const decos = [];

    // Leaf Palette
    const leafColors = [new THREE.Color('#FFB7C5'), new THREE.Color('#FF69B4'), new THREE.Color('#F67280')];
    // Decoration Palette
    const decoColors = [new THREE.Color('#FFFFFF'), new THREE.Color('#E0BBE4'), new THREE.Color('#957DAD')];

    for (let i = 0; i < LEAF_COUNT; i++) {
      // Tree position
      const h = Math.random() * 12; // 0 to 12
      const radius = (12 - h) * 0.45;
      const angle = Math.random() * Math.PI * 2;
      const tx = Math.cos(angle) * radius;
      const ty = h - 5;
      const tz = Math.sin(angle) * radius;

      // Explode position
      const ex = (Math.random() - 0.5) * 30;
      const ey = (Math.random() - 0.5) * 25;
      const ez = (Math.random() - 0.5) * 30;

      leaves.push({
        treePos: new THREE.Vector3(tx, ty, tz),
        explodePos: new THREE.Vector3(ex, ey, ez),
        currentPos: new THREE.Vector3(ex, ey, ez),
        rotation: new THREE.Euler(Math.random(), Math.random(), Math.random()),
        scale: 0.15 + Math.random() * 0.2,
        color: leafColors[Math.floor(Math.random() * leafColors.length)].clone()
      });
    }

    for (let i = 0; i < DECO_COUNT; i++) {
      const h = Math.random() * 11;
      const radius = (12 - h) * 0.42;
      const angle = Math.random() * Math.PI * 2;
      const tx = Math.cos(angle) * radius * 1.05; // Slightly outside
      const ty = h - 4.8;
      const tz = Math.sin(angle) * radius * 1.05;

      const ex = (Math.random() - 0.5) * 35;
      const ey = (Math.random() - 0.5) * 30;
      const ez = (Math.random() - 0.5) * 35;

      decos.push({
        treePos: new THREE.Vector3(tx, ty, tz),
        explodePos: new THREE.Vector3(ex, ey, ez),
        currentPos: new THREE.Vector3(ex, ey, ez),
        rotation: new THREE.Euler(Math.random(), Math.random(), Math.random()),
        scale: 0.08 + Math.random() * 0.15,
        color: decoColors[Math.floor(Math.random() * decoColors.length)].clone()
      });
    }

    return { leafData: leaves, decoData: decos };
  }, []);

  useFrame(() => {
    if (!leafMeshRef.current || !decoMeshRef.current) return;

    const lerpFactor = 0.06;

    // Update Leaves
    leafData.forEach((leaf, i) => {
      const target = state === TreeState.TREE ? leaf.treePos : leaf.explodePos;
      leaf.currentPos.lerp(target, lerpFactor);
      
      tempObject.position.copy(leaf.currentPos);
      tempObject.rotation.copy(leaf.rotation);
      tempObject.scale.setScalar(leaf.scale);
      tempObject.updateMatrix();
      leafMeshRef.current!.setMatrixAt(i, tempObject.matrix);
      leafMeshRef.current!.setColorAt(i, leaf.color);
    });

    // Update Decorations
    decoData.forEach((deco, i) => {
      const target = state === TreeState.TREE ? deco.treePos : deco.explodePos;
      deco.currentPos.lerp(target, lerpFactor);

      tempObject.position.copy(deco.currentPos);
      tempObject.rotation.copy(deco.rotation);
      tempObject.scale.setScalar(deco.scale);
      tempObject.updateMatrix();
      decoMeshRef.current!.setMatrixAt(i, tempObject.matrix);
      decoMeshRef.current!.setColorAt(i, deco.color);
    });

    leafMeshRef.current.instanceMatrix.needsUpdate = true;
    leafMeshRef.current.instanceColor!.needsUpdate = true;
    decoMeshRef.current.instanceMatrix.needsUpdate = true;
    decoMeshRef.current.instanceColor!.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={leafMeshRef} args={[null as any, null as any, LEAF_COUNT]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial metalness={0.6} roughness={0.4} />
      </instancedMesh>

      <instancedMesh ref={decoMeshRef} args={[null as any, null as any, DECO_COUNT]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial metalness={0.9} roughness={0.1} />
      </instancedMesh>
    </>
  );
};
