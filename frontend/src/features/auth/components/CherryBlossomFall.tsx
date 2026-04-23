import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

interface PetalConfig {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
  rotation: number;
  blur: number;
}

const PETAL_COUNT = 20;

const createPetals = (): PetalConfig[] => {
  return Array.from({ length: PETAL_COUNT }, (_, index) => ({
    id: index,
    left: 2 + Math.random() * 96,
    size: 10 + Math.random() * 12,
    duration: 9 + Math.random() * 8,
    delay: Math.random() * 10,
    drift: -42 + Math.random() * 84,
    opacity: 0.35 + Math.random() * 0.45,
    rotation: Math.random() * 360,
    blur: Math.random() * 0.7,
  }));
};

export const CherryBlossomFall = () => {
  const reduceMotion = useReducedMotion();
  const petals = useMemo(() => createPetals(), []);

  if (reduceMotion) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((petal) => (
        <span
          key={petal.id}
          className="auth-cherry-petal"
          style={{
            left: `${petal.left}%`,
            width: `${petal.size}px`,
            height: `${petal.size * 0.72}px`,
            opacity: petal.opacity,
            filter: `blur(${petal.blur}px)`,
            transform: `translate3d(0,-16vh,0) rotate(${petal.rotation}deg)`,
            animationDuration: `${petal.duration}s, ${Math.max(2.8, petal.duration * 0.44)}s`,
            animationDelay: `${petal.delay}s, ${petal.delay}s`,
            ['--cherry-drift' as string]: `${petal.drift}px`,
          }}
          aria-hidden
        />
      ))}
    </div>
  );
};
