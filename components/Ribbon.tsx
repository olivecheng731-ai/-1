
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

const RIBBON_COUNT = 1200;
const tempObject = new THREE.Object3D();

export const Ribbon: React.FC<{ state: TreeState }> = ({ state }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const items = [];
    for (let i = 0; i < RIBBON_COUNT; i++) {
      // 3 rotations around the tree
      const t = (i / RIBBON_COUNT) * Math.PI * 2 * 3.5;
      const h = (i / RIBBON_COUNT) * 11;
      const radius = (12 - h) * 0.5;
      
      const tx = Math.cos(t) * radius;
      const ty = h - 5;
      const tz = Math.sin(t) * radius;

      const ex = (Math.random() - 0.5) * 40;
      const ey = (Math.random() - 0.5) * 40;
      const ez = (Math.random() - 0.5) * 40;

      items.push({
        treePos: new THREE.Vector3(tx, ty, tz),
        explodePos: new THREE.Vector3(ex, ey, ez),
        currentPos: new THREE.Vector3(ex, ey, ez),
        scale: 0.05 + Math.random() * 0.05
      });
    }
    return items;
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const lerpFactor = 0.05;

    data.forEach((item, i) => {
      const target = state === TreeState.TREE ? item.treePos : item.explodePos;
      item.currentPos.lerp(target, lerpFactor);

      tempObject.position.copy(item.currentPos);
      tempObject.scale.setScalar(item.scale);
      tempObject.lookAt(0, item.currentPos.y, 0); // Always face center roughly
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, RIBBON_COUNT]}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
    </instancedMesh>
  );
};
