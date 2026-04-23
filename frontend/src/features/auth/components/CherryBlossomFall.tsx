import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

interface PetalConfig {
  id: number;
  left: number;
  size: number;
  duration: number;
  fallDelay: number;
  swayDelay: number;
  drift: number;
  opacity: number;
  rotation: number;
  blur: number;
}

const PETAL_COUNT = 20;
const INSTANT_VISIBLE_PETAL_COUNT = 7;

const createPetals = (): PetalConfig[] => {
  return Array.from({ length: PETAL_COUNT }, (_, index) => ({
    id: index,
    left: 2 + Math.random() * 96,
    size: 10 + Math.random() * 12,
    duration: 9 + Math.random() * 8,
    fallDelay: 0,
    swayDelay: 0,
    drift: -42 + Math.random() * 84,
    opacity: 0.35 + Math.random() * 0.45,
    rotation: Math.random() * 360,
    blur: Math.random() * 0.7,
  })).map((petal, index) => {
    const swayDuration = Math.max(2.8, petal.duration * 0.44);
    const shouldBeImmediatelyVisible = index < INSTANT_VISIBLE_PETAL_COUNT;
    return {
      ...petal,
      // Negative delays make petals appear mid-flight immediately after mount.
      fallDelay: shouldBeImmediatelyVisible ? -Math.random() * petal.duration : 0,
      swayDelay: -Math.random() * swayDuration,
    };
  });
};

interface CherryBlossomFallProps {
  enabled?: boolean;
}

export const CherryBlossomFall = ({ enabled = true }: CherryBlossomFallProps) => {
  const reduceMotion = useReducedMotion();
  const petals = useMemo(() => createPetals(), []);

  if (!enabled || reduceMotion) {
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
            animationDelay: `${petal.fallDelay}s, ${petal.swayDelay}s`,
            ['--cherry-drift' as string]: `${petal.drift}px`,
          }}
          aria-hidden
        />
      ))}
    </div>
  );
};
