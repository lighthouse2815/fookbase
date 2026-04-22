import { useEffect, useRef } from 'react';

import type { FlappyState } from '@/features/games/types/flappy';

interface FlappyCanvasProps {
  state: FlappyState;
  currentUserId: string;
}

export const FlappyCanvas = ({ state, currentUserId }: FlappyCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const width = state.width;
    const height = state.height;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#7dd3fc');
    gradient.addColorStop(1, '#bfdbfe');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    state.pipes.forEach((pipe) => {
      const gapTop = pipe.gapY - pipe.gapHeight / 2;
      const gapBottom = pipe.gapY + pipe.gapHeight / 2;

      context.fillStyle = '#16a34a';
      context.fillRect(pipe.x, 0, pipe.width, gapTop);
      context.fillRect(pipe.x, gapBottom, pipe.width, height - state.groundHeight - gapBottom);
    });

    context.fillStyle = '#92400e';
    context.fillRect(0, height - state.groundHeight, width, state.groundHeight);

    state.players.forEach((player) => {
      const isCurrentPlayer = player.userId === currentUserId;
      context.globalAlpha = isCurrentPlayer ? 1 : 0.35;
      context.fillStyle = isCurrentPlayer ? '#f59e0b' : '#334155';
      context.beginPath();
      context.arc(player.x, player.y, 14, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#111827';
      context.beginPath();
      context.arc(player.x + 4, player.y - 4, 2, 0, Math.PI * 2);
      context.fill();

      if (!player.isAlive) {
        context.strokeStyle = '#dc2626';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(player.x - 10, player.y - 10);
        context.lineTo(player.x + 10, player.y + 10);
        context.stroke();
      }

      context.globalAlpha = 1;
    });
  }, [currentUserId, state]);

  return (
    <div className="overflow-auto rounded-2xl border border-slate-200 bg-sky-100 p-2 dark:border-slate-700 dark:bg-slate-900/80">
      <canvas ref={canvasRef} className="block h-auto w-full max-w-full" />
    </div>
  );
};


