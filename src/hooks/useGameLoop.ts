"use client";

import { useEffect, useRef } from "react";
import { useTetrisStore } from "@/store/tetrisStore";

export const useGameLoop = () => {
  const tick = useTetrisStore((state) => state.tick);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    let last = performance.now();
    const loop = (time: number) => {
      const delta = time - last;
      last = time;
      tick(delta);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [tick]);
};
