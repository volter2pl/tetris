"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSoundscape } from "@/lib/audio/soundscape";

export const useImmersiveAudio = () => {
  const [ready, setReady] = useState(false);
  const [energy, setEnergy] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (!ready) return;
    const scape = getSoundscape();
    const loop = () => {
      setEnergy(scape?.energySample() ?? 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  const arm = useCallback(async () => {
    const scape = getSoundscape();
    if (!scape) return;
    await scape.arm();
    await scape.resume();
    setReady(true);
  }, []);

  const pulse = useCallback((strength = 1) => {
    const scape = getSoundscape();
    scape?.pulse(strength);
  }, []);

  return { ready, arm, energy, pulse };
};
