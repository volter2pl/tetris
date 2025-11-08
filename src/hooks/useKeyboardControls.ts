"use client";

import { useEffect } from "react";
import { useTetrisStore } from "@/store/tetrisStore";

const directionalKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowDown"]);

export const useKeyboardControls = () => {
  const move = useTetrisStore((state) => state.move);
  const rotate = useTetrisStore((state) => state.rotate);
  const hardDrop = useTetrisStore((state) => state.hardDrop);
  const softDrop = useTetrisStore((state) => state.softDrop);
  const holdPiece = useTetrisStore((state) => state.holdPiece);
  const pauseGame = useTetrisStore((state) => state.pauseGame);
  const resumeGame = useTetrisStore((state) => state.resumeGame);
  const startGame = useTetrisStore((state) => state.startGame);
  const phase = useTetrisStore((state) => state.phase);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat && directionalKeys.has(event.code)) return;
      switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
          event.preventDefault();
          move(-1);
          break;
        case "ArrowRight":
        case "KeyD":
          event.preventDefault();
          move(1);
          break;
        case "ArrowDown":
        case "KeyS":
          event.preventDefault();
          softDrop(true);
          break;
        case "ArrowUp":
        case "KeyW":
        case "KeyX":
          event.preventDefault();
          rotate(1);
          break;
        case "KeyZ":
        case "KeyQ":
          event.preventDefault();
          rotate(-1);
          break;
        case "Space":
          event.preventDefault();
          hardDrop();
          break;
        case "ShiftLeft":
        case "ShiftRight":
        case "KeyC":
          event.preventDefault();
          holdPiece();
          break;
        case "KeyP":
        case "Escape":
          event.preventDefault();
          if (phase === "playing") pauseGame();
          else if (phase === "paused") resumeGame();
          break;
        case "Enter":
          if (phase === "intro" || phase === "over") {
            event.preventDefault();
            startGame();
          }
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "ArrowDown" || event.code === "KeyS") {
        softDrop(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [move, rotate, hardDrop, softDrop, holdPiece, pauseGame, resumeGame, phase, startGame]);
};
