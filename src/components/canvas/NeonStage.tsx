"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Glitch, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { Float, Sparkles } from "@react-three/drei";
import { ActivePiece, BoardCell, LineClearEffect } from "@/lib/tetris/types";
import { BOARD_COLS, BOARD_ROWS, TETROMINOES, VISIBLE_ROWS } from "@/lib/tetris/constants";

const visibleOffset = BOARD_ROWS - VISIBLE_ROWS;
const tempObject = new THREE.Object3D();
const blockGeometry = new THREE.BoxGeometry(0.92, 0.92, 0.92);
const ghostMaterial = new THREE.MeshBasicMaterial({ color: "#8cf2ff", transparent: true, opacity: 0.15 });
type Vec3 = [number, number, number];

export interface NeonStageProps {
  board: (BoardCell | null)[][];
  active: ActivePiece | null;
  ghostY: number;
  energy: number;
  effect: LineClearEffect | null;
  phase: string;
}

const worldFromBoard = (x: number, y: number): Vec3 => [
  x - BOARD_COLS / 2 + 0.5,
  VISIBLE_ROWS / 2 - (y - visibleOffset) - 0.5,
  0,
];

const BoardStacks = ({ board, energy }: { board: (BoardCell | null)[][]; energy: number }) => {
  const instanced = useRef<THREE.InstancedMesh>(null);
  const cells = useMemo(() => {
    const output: { position: Vec3; color: string; glow: string }[] = [];
    for (let y = visibleOffset; y < BOARD_ROWS; y += 1) {
      for (let x = 0; x < BOARD_COLS; x += 1) {
        const cell = board[y][x];
        if (!cell) continue;
        const [wx, wy, wz] = worldFromBoard(x, y);
        const palette = TETROMINOES[cell.type];
        output.push({ position: [wx, wy, wz], color: palette.color, glow: palette.glow });
      }
    }
    return output;
  }, [board]);

  useEffect(() => {
    if (!instanced.current) return;
    cells.forEach((cell, idx) => {
      tempObject.position.set(cell.position[0], cell.position[1], cell.position[2]);
      tempObject.scale.setScalar(1 + energy * 0.08);
      tempObject.updateMatrix();
      instanced.current!.setMatrixAt(idx, tempObject.matrix);
      const color = new THREE.Color(cell.color);
      instanced.current!.setColorAt(idx, color);
    });
    instanced.current.instanceMatrix.needsUpdate = true;
    if (instanced.current.instanceColor) instanced.current.instanceColor.needsUpdate = true;
  }, [cells, energy]);

  if (!cells.length) return null;
  return (
    <instancedMesh ref={instanced} args={[blockGeometry, undefined, cells.length]}>
      <meshStandardMaterial emissiveIntensity={1.2 + energy * 1.2} toneMapped={false} />
    </instancedMesh>
  );
};

const ActivePieceMesh = ({ piece, energy }: { piece: ActivePiece; energy: number }) => {
  const group = useMemo(() => {
    const fragments: { id: string; position: Vec3 }[] = [];
    piece.matrix.forEach((row, rowIdx) => {
      row.forEach((value, colIdx) => {
        if (!value) return;
        const x = piece.position.x + colIdx;
        const y = piece.position.y + rowIdx;
        const [wx, wy, wz] = worldFromBoard(x, y);
        fragments.push({ id: `${x}-${y}`, position: [wx, wy, wz] });
      });
    });
    return fragments;
  }, [piece]);
  const palette = TETROMINOES[piece.type];
  return (
    <group>
      {group.map((fragment) => (
        <Float key={fragment.id} speed={2} rotationIntensity={0.1} floatIntensity={0.7}>
          <mesh position={fragment.position} geometry={blockGeometry}>
            <meshStandardMaterial
              color={palette.color}
              emissive={palette.glow}
              emissiveIntensity={1.6 + energy * 1.4}
              metalness={0.4}
              roughness={0.25}
              toneMapped={false}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

const GhostProjection = ({ piece, ghostY }: { piece: ActivePiece | null; ghostY: number }) => {
  if (!piece) return null;
  const fragments: ReactNode[] = [];
  piece.matrix.forEach((row, rowIdx) => {
    row.forEach((value, colIdx) => {
      if (!value) return;
      const x = piece.position.x + colIdx;
      const y = ghostY + rowIdx;
      if (y < visibleOffset) return;
      const [wx, wy, wz] = worldFromBoard(x, y);
      fragments.push(<mesh key={`ghost-${x}-${y}`} position={[wx, wy, wz]} geometry={blockGeometry} material={ghostMaterial} />);
    });
  });
  return <group>{fragments}</group>;
};

const burstGeometry = new THREE.PlaneGeometry(1, 1);
const glitchDelay = new THREE.Vector2(2, 8);
const glitchDuration = new THREE.Vector2(0.02, 0.08);
const glitchStrength = new THREE.Vector2(0.01, 0.12);

const LineParticles = ({ effect }: { effect: LineClearEffect | null }) => {
  const instanced = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const rowsRef = useRef<number[]>([]);
  const life = useRef(0);

  useEffect(() => {
    if (!effect || !instanced.current) return;
    const rows = effect.rows.filter((row) => row >= visibleOffset);
    rowsRef.current = rows;
    life.current = 0;
    instanced.current.visible = rows.length > 0;
    instanced.current.count = rows.length;
    rows.forEach((row, idx) => {
      const [, wy] = worldFromBoard(0, row);
      tempObject.position.set(0, wy, 0);
      tempObject.rotation.set(Math.PI / 2, 0, 0);
      tempObject.scale.set(BOARD_COLS * 1.4, 1.6, 1);
      tempObject.updateMatrix();
      instanced.current!.setMatrixAt(idx, tempObject.matrix);
    });
    instanced.current.instanceMatrix.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = 0.95;
    }
  }, [effect]);

  useFrame((_, delta) => {
    if (!instanced.current || !materialRef.current) return;
    if (!rowsRef.current.length) {
      instanced.current.visible = false;
      return;
    }
    life.current += delta;
    const remaining = Math.max(0, 1 - life.current / 1.15);
    materialRef.current.opacity = remaining;
    if (remaining <= 0) {
      rowsRef.current = [];
      instanced.current.visible = false;
      instanced.current.count = 0;
    }
  });

  return (
    <instancedMesh ref={instanced} args={[burstGeometry, undefined, VISIBLE_ROWS]} visible={false}>
      <meshStandardMaterial
        ref={materialRef}
        color="#91f8ff"
        transparent
        opacity={0}
        emissive="#e1fdff"
        emissiveIntensity={2.5}
        toneMapped={false}
      />
    </instancedMesh>
  );
};

const PulseField = ({ energy }: { energy: number }) => (
  <group>
    <Sparkles count={120} size={2} speed={0.4 + energy} opacity={0.6} color="#43d9ff" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -VISIBLE_ROWS * 0.55, 0]}>
      <circleGeometry args={[12, 64]} />
      <meshBasicMaterial color="#081429" transparent opacity={0.6} />
    </mesh>
  </group>
);

const Atmosphere = ({ energy }: { energy: number }) => (
  <group>
    <pointLight color="#5de0ff" intensity={2 + energy * 3} position={[0, 14, 6]} distance={60} decay={2} />
    <pointLight color="#ff7de1" intensity={1.2 + energy} position={[6, 6, 6]} distance={40} decay={2.4} />
  </group>
);

export const NeonStage = ({ board, active, ghostY, energy, effect, phase }: NeonStageProps) => (
  <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 14, 24], fov: 42, near: 0.1, far: 120 }}>
    <color attach="background" args={["#01030b"]} />
    <fog attach="fog" args={["#020513", 40, 80]} />
    <hemisphereLight args={["#0d1b46", "#010205", 0.2]} />
    <directionalLight position={[8, 16, 6]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
    <Suspense fallback={null}>
      <PulseField energy={energy} />
      <Atmosphere energy={energy} />
      <BoardStacks board={board} energy={energy} />
      {active && <ActivePieceMesh piece={active} energy={energy} />}
      <GhostProjection piece={active} ghostY={ghostY} />
      <LineParticles effect={effect} />
    </Suspense>
    <EffectComposer enableNormalPass={false} enabled={phase !== "intro"}>
      <Bloom intensity={1.2 + energy * 1.8} luminanceThreshold={0} luminanceSmoothing={0.4} />
      <Glitch delay={glitchDelay} duration={glitchDuration} strength={glitchStrength} />
      <Noise opacity={0.06} premultiply blendFunction={BlendFunction.ADD} />
      <Vignette eskil={false} offset={0.2} darkness={1.1} />
    </EffectComposer>
  </Canvas>
);
