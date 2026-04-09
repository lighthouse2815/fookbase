import { useEffect, useRef } from 'react';

import { BloodFortressEngine } from './game/BloodFortressEngine';

export const BloodFortressCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const engine = new BloodFortressEngine(canvas);
    engine.start();

    return () => {
      engine.destroy();
    };
  }, []);

  return (
    <div className="blood-fortress-canvas-shell">
      <canvas ref={canvasRef} className="blood-fortress-canvas" aria-label="Hiệp Sĩ Đăng: Pháo Đài Máu" />
    </div>
  );
};
