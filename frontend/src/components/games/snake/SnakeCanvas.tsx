import { useEffect, useRef } from 'react';

import type { SnakeState } from '../../../type/games/snake';

interface SnakeCanvasProps {
  state: SnakeState;
}

export const SnakeCanvas = ({ state }: SnakeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const cellSize = 20;
    const width = state.width * cellSize;
    const height = state.height * cellSize;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    for (let x = 0; x <= state.width; x += 1) {
      context.beginPath();
      context.moveTo(x * cellSize, 0);
      context.lineTo(x * cellSize, height);
      context.stroke();
    }
    for (let y = 0; y <= state.height; y += 1) {
      context.beginPath();
      context.moveTo(0, y * cellSize);
      context.lineTo(width, y * cellSize);
      context.stroke();
    }

    context.fillStyle = '#f97316';
    context.beginPath();
    context.arc(
      state.fruit.x * cellSize + cellSize / 2,
      state.fruit.y * cellSize + cellSize / 2,
      cellSize * 0.35,
      0,
      Math.PI * 2,
    );
    context.fill();

    state.players.forEach((player) => {
      player.segments.forEach((segment, index) => {
        context.fillStyle = index === 0 ? '#ffffff' : player.color;
        context.globalAlpha = player.isAlive ? 1 : 0.45;
        context.fillRect(
          segment.x * cellSize + 1,
          segment.y * cellSize + 1,
          cellSize - 2,
          cellSize - 2,
        );
      });
      context.globalAlpha = 1;
    });
  }, [state]);

  return (
    <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-2 dark:border-slate-700">
      <canvas ref={canvasRef} className="block h-auto w-full max-w-full" />
    </div>
  );
};

