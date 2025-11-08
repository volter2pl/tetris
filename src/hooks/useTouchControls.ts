"use client";

import { useEffect, useRef } from "react";
import { useTetrisStore } from "@/store/tetrisStore";

const SWIPE_THRESHOLD = 24;
const DROP_THRESHOLD = 90;
const HOLD_THRESHOLD = 420;

interface TouchSnapshot {
  x: number;
  y: number;
  time: number;
  acted: boolean;
}

export const useTouchControls = () => {
  const move = useTetrisStore((state) => state.move);
  const rotate = useTetrisStore((state) => state.rotate);
  const hardDrop = useTetrisStore((state) => state.hardDrop);
  const softDrop = useTetrisStore((state) => state.softDrop);
  const holdPiece = useTetrisStore((state) => state.holdPiece);
  const phase = useTetrisStore((state) => state.phase);
  const snapshot = useRef<TouchSnapshot | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("ontouchstart" in window)) return;
    const onStart = (event: TouchEvent) => {
      if (phase === "intro" || phase === "over") return;
      const touch = event.touches[0];
      snapshot.current = { x: touch.clientX, y: touch.clientY, time: performance.now(), acted: false };
    };

    const onMove = (event: TouchEvent) => {
      if (!snapshot.current || phase !== "playing") return;
      const touch = event.touches[0];
      const dx = touch.clientX - snapshot.current.x;
      const dy = touch.clientY - snapshot.current.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
        event.preventDefault();
        move(dx > 0 ? 1 : -1);
        snapshot.current.x = touch.clientX;
        snapshot.current.acted = true;
      } else if (dy > SWIPE_THRESHOLD) {
        event.preventDefault();
        softDrop(true);
      }
      if (dy > DROP_THRESHOLD) {
        event.preventDefault();
        hardDrop();
        snapshot.current = null;
      }
    };

    const onEnd = () => {
      if (!snapshot.current) {
        softDrop(false);
        return;
      }
      const duration = performance.now() - snapshot.current.time;
      if (!snapshot.current.acted) {
        if (duration > HOLD_THRESHOLD) {
          holdPiece();
        } else {
          rotate(1);
        }
      }
      softDrop(false);
      snapshot.current = null;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [move, rotate, hardDrop, softDrop, holdPiece, phase]);
};
