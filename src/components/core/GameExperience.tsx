"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { useTouchControls } from "@/hooks/useTouchControls";
import { useImmersiveAudio } from "@/hooks/useImmersiveAudio";
import { useTetrisStore } from "@/store/tetrisStore";
import { BOARD_COLS, TETROMINOES, VISIBLE_ROWS } from "@/lib/tetris/constants";
import { registerServiceWorker } from "@/lib/pwa/register-sw";
import type { TetrominoKey } from "@/lib/tetris/types";

const NeonStage = dynamic(() => import("@/components/canvas/NeonStage").then((mod) => mod.NeonStage), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-3xl bg-slate-900/70" />,
});

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="glass-panel rounded-2xl px-4 py-3 text-center">
    <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
  </div>
);

const PreviewPiece = ({
  type,
  label,
  variant = "default",
}: {
  type: TetrominoKey | null;
  label: string;
  variant?: "default" | "compact";
}) => {
  const matrix = useMemo(() => (type ? TETROMINOES[type].rotations[0] : []), [type]);
  const labelClasses =
    variant === "compact"
      ? "text-[0.55rem] uppercase tracking-[0.4em] text-zinc-300"
      : "text-xs uppercase tracking-[0.6em] text-zinc-400";
  const panelClasses = clsx(
    "glass-panel aspect-square rounded-2xl",
    variant === "compact" ? "w-[72px] p-2" : "w-full max-w-[120px] p-3",
  );
  const gridClasses = clsx("grid h-full grid-cols-4 grid-rows-4", variant === "compact" ? "gap-[2px]" : "gap-1");
  const baseCellClasses = clsx("border border-white/5 transition", variant === "compact" ? "rounded-sm" : "rounded-md");
  return (
    <div className="flex flex-col gap-2">
      <p className={labelClasses}>{label}</p>
      <div className={panelClasses}>
        <div className={gridClasses}>
          {Array.from({ length: 16 }).map((_, idx) => {
            const row = Math.floor(idx / 4);
            const col = idx % 4;
            const activeCell = matrix[row]?.[col];
            return (
              <div
                key={`${label}-${idx}`}
                className={clsx(baseCellClasses, activeCell ? "bg-cyan-300/40 shadow-[0_0_12px_rgba(74,222,255,0.6)]" : "bg-white/5")}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MobileHud = ({ stats, hold, nextPieces }: { stats: { score: number; lines: number; level: number }; hold: TetrominoKey | null; nextPieces: TetrominoKey[] }) => (
  <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/50 px-3 py-3 text-white shadow-[0_12px_40px_rgba(2,6,23,0.65)] backdrop-blur-xl lg:hidden">
    <div className="grid grid-cols-3 gap-2 text-center">
      {[
        { label: "Score", value: stats.score.toLocaleString() },
        { label: "Lines", value: stats.lines },
        { label: "Level", value: stats.level },
      ].map((item) => (
        <div key={item.label} className="rounded-2xl bg-white/5 px-2 py-1.5">
          <p className="text-[0.5rem] uppercase tracking-[0.35em] text-zinc-300">{item.label}</p>
          <p className="text-base font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </div>
    <div className="flex flex-wrap items-start gap-2">
      <PreviewPiece type={hold} label="HOLD" variant="compact" />
      {nextPieces.slice(0, 2).map((piece, idx) => (
        <PreviewPiece key={`${piece}-mobile-${idx}`} type={piece} label={idx === 0 ? "NEXT" : `+${idx}`} variant="compact" />
      ))}
    </div>
  </div>
);

const BOARD_ASPECT_RATIO = VISIBLE_ROWS / BOARD_COLS;
const MAX_BOARD_WIDTH = 780;
const BOARD_VERTICAL_OFFSET = 140;
const BOARD_HORIZONTAL_GUTTER = 48;
const BOARD_FALLBACK_STYLE: CSSProperties = {
  maxHeight: `min(calc(100vh - ${BOARD_VERTICAL_OFFSET}px), calc(100dvh - ${BOARD_VERTICAL_OFFSET}px))`,
  maxWidth: `min(calc((100vh - ${BOARD_VERTICAL_OFFSET}px) * ${1 / BOARD_ASPECT_RATIO}), calc((100dvh - ${BOARD_VERTICAL_OFFSET}px) * ${1 / BOARD_ASPECT_RATIO}), calc(100vw - ${BOARD_HORIZONTAL_GUTTER}px))`,
};

const PauseOverlay = ({ onResume }: { onResume: () => void }) => (
  <div className="pointer-events-auto text-center">
    <h2 className="text-3xl font-semibold text-white">Pauza</h2>
    <p className="mt-2 text-white/70">Złap oddech. Światło będzie czekać.</p>
    <button
      onClick={onResume}
      className="mt-6 rounded-full border border-white/30 px-6 py-3 text-sm uppercase tracking-[0.5em] text-white/90"
    >
      WZNÓW
    </button>
  </div>
);

const GameOverOverlay = ({ onRestart, stats }: { onRestart: () => void; stats: { score: number; lines: number; level: number } }) => (
  <div className="pointer-events-auto text-center">
    <p className="text-xs uppercase tracking-[0.6em] text-rose-200">Game Over</p>
    <h2 className="mt-4 text-4xl font-semibold text-white">Hipnotyczna sesja zakończona</h2>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
      <StatCard label="Score" value={stats.score.toLocaleString()} />
      <StatCard label="Lines" value={stats.lines} />
      <StatCard label="Level" value={stats.level} />
    </div>
    <button
      onClick={onRestart}
      className="mt-8 rounded-full bg-white/10 px-8 py-3 text-sm uppercase tracking-[0.5em] text-white"
    >
      Graj ponownie
    </button>
  </div>
);

export const GameExperience = () => {
  useGameLoop();
  useKeyboardControls();
  useTouchControls();
  const autoStartRef = useRef(false);
  const board = useTetrisStore((state) => state.board);
  const active = useTetrisStore((state) => state.active);
  const ghostY = useTetrisStore((state) => state.ghostY);
  const stats = useTetrisStore((state) => state.stats);
  const hold = useTetrisStore((state) => state.hold);
  const queue = useTetrisStore((state) => state.queue);
  const phase = useTetrisStore((state) => state.phase);
  const startGame = useTetrisStore((state) => state.startGame);
  const pauseGame = useTetrisStore((state) => state.pauseGame);
  const resumeGame = useTetrisStore((state) => state.resumeGame);
  const recentEffect = useTetrisStore((state) => state.recentEffect);
  const countdownUntil = useTetrisStore((state) => state.countdownUntil);
  const { ready: audioReady, arm, energy, pulse } = useImmersiveAudio();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [timeSample, setTimeSample] = useState(() => (typeof performance !== "undefined" ? performance.now() : Date.now()));

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (autoStartRef.current || phase !== "intro") return;
    autoStartRef.current = true;
    startGame();
  }, [phase, startGame]);

  useEffect(() => {
    let raf: number;
    const step = (timestamp: number) => {
      setTimeSample(timestamp);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (recentEffect) {
      pulse(1 + recentEffect.rows.length * 0.3);
    }
  }, [recentEffect, pulse]);

  const nextPieces = queue.slice(0, 3) as TetrominoKey[];
  const countdown = countdownUntil ? Math.max(0, countdownUntil - timeSample) : 0;
  const countdownLabel = countdown > 0 ? Math.ceil(countdown / 1000) : null;

  const overlayPhase = phase === "paused" || phase === "over" || phase === "countdown";
  const visualEnergy = audioReady ? energy : 0;
  const boardDimensions = useMemo<{ width: number; height: number } | null>(() => {
    if (!viewport.width || !viewport.height) return null;
    const horizontalOffset = viewport.width < 640 ? BOARD_HORIZONTAL_GUTTER : viewport.width < 1024 ? 160 : 360;
    const verticalOffset = viewport.width < 640 ? BOARD_VERTICAL_OFFSET : viewport.width < 1024 ? BOARD_VERTICAL_OFFSET + 40 : BOARD_VERTICAL_OFFSET + 80;
    const availableWidth = viewport.width - horizontalOffset;
    const availableHeight = viewport.height - verticalOffset;
    if (availableWidth <= 0 || availableHeight <= 0) return null;
    const widthFromHeight = availableHeight / BOARD_ASPECT_RATIO;
    const width = Math.min(availableWidth, widthFromHeight, MAX_BOARD_WIDTH);
    const height = width * BOARD_ASPECT_RATIO;
    return { width, height };
  }, [viewport]);
  const boardInlineStyle = boardDimensions
    ? ({
        ...BOARD_FALLBACK_STYLE,
        width: `${boardDimensions.width}px`,
        height: `${boardDimensions.height}px`,
      } satisfies CSSProperties)
    : BOARD_FALLBACK_STYLE;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        animate={{ opacity: 0.4 + visualEnergy * 0.35, scale: 1 + visualEnergy * 0.05 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(86,143,255,0.5), transparent 45%), radial-gradient(circle at 70% 0%, rgba(255,105,180,0.45), transparent 50%)",
          filter: `blur(${12 + visualEnergy * 24}px)`,
        }}
      />
      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col gap-6 px-3 py-4 sm:px-6 sm:py-8 lg:gap-10">
        {/* <header className="flex flex-col gap-3 text-center md:text-left">
          <p className="text-xs uppercase tracking-[0.8em] text-cyan-200">Lumen Tetris</p>
          <h1 className="neon-text text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Najpiękniejszy Tetris, jaki działa w przeglądarce
          </h1>
          <p className="text-sm text-white/70 sm:text-base">
            Steruj klawiaturą lub gestami dotykowymi. Spróbuj zsynchronizować ruch z muzyką i światłem.
          </p>
        </header> */}

        <section className="glass-panel relative flex flex-1 flex-col gap-6 rounded-3xl p-3 sm:p-6 lg:flex-row">
          <div className="flex-1">
            <div className="flex flex-col gap-4">
              <MobileHud stats={stats} hold={hold} nextPieces={nextPieces} />
              <div className="flex w-full justify-center">
                <div
                  className="relative aspect-[1/2] w-full overflow-hidden rounded-3xl border border-white/5 bg-black/20 shadow-[0_20px_60px_rgba(2,6,23,0.7)]"
                  style={boardInlineStyle}
                >
                  <NeonStage board={board} active={active} ghostY={ghostY} energy={visualEnergy} effect={recentEffect} phase={phase} />
                  {phase === "playing" && (
                    <button
                      type="button"
                      onClick={pauseGame}
                      className="pointer-events-auto absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-[0.6rem] uppercase tracking-[0.4em] text-white/80 shadow-[0_10px_30px_rgba(2,6,23,0.6)] backdrop-blur-xl transition hover:text-white lg:hidden"
                    >
                      Pauza
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="hidden w-full flex-col gap-6 lg:flex lg:w-[280px]">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Score" value={stats.score.toLocaleString()} />
              <StatCard label="Lines" value={stats.lines} />
              <StatCard label="Level" value={stats.level} />
            </div>
            <div className="flex flex-wrap items-start gap-6">
              <PreviewPiece type={hold} label="HOLD" />
              {nextPieces.map((piece, idx) => (
                <PreviewPiece key={`${piece}-${idx}`} type={piece} label={idx === 0 ? "NEXT" : `+${idx}`} />
              ))}
            </div>
            {/* <div className="space-y-3 text-sm text-white/70">
              <ControlHint title="KLawiatura" description="Strzałki / WASD – ruch, Q/E/Z – obrót, Spacja – drop, Shift – hold" />
              <ControlHint title="DOTYK" description="Przesuń w bok, by poruszać. W dół – drop. Tap – obrót. Przytrzymaj – hold." />
            </div> */}
            {phase === "playing" && (
              <button
                onClick={pauseGame}
                className="rounded-2xl border border-white/20 px-4 py-3 text-sm uppercase tracking-[0.4em] text-white/80 transition hover:text-white"
              >
                Pauza
              </button>
            )}
            {phase === "paused" && (
              <button
                onClick={resumeGame}
                className="rounded-2xl border border-white/20 px-4 py-3 text-sm uppercase tracking-[0.4em] text-white/80 transition hover:text-white"
              >
                Wznów
              </button>
            )}
          </aside>
        </section>
      </main>
      <AnimatePresence>
        {!audioReady && (
          <motion.button
            type="button"
            aria-label="Odblokuj dźwięk"
            onClick={arm}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white shadow-[0_20px_50px_rgba(2,6,23,0.65)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:bottom-8 sm:right-8"
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H3v6h3l5 4z" />
              <path d="M16 8a5 5 0 0 1 0 8" />
              <path d="M19 5a9 9 0 0 1 0 14" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {overlayPhase && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {phase === "paused" && <PauseOverlay onResume={resumeGame} />}
            {phase === "over" && <GameOverOverlay onRestart={() => startGame({ skipCountdown: true })} stats={stats} />}
            {phase === "countdown" && countdownLabel && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none text-6xl font-bold text-white"
              >
                {countdownLabel}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
