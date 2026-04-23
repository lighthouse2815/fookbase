import type { Transition, Variants } from 'framer-motion';

const AUTH_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const AUTH_BASE_TRANSITION: Transition = {
  duration: 0.75,
  ease: AUTH_EASE,
};

export const AUTH_ROUTE_VARIANTS: Variants = {
  initial: {
    opacity: 0.42,
    y: 12,
    scale: 0.992,
    filter: 'blur(8px)',
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: AUTH_BASE_TRANSITION,
  },
  exit: {
    opacity: 0.32,
    y: -8,
    scale: 0.992,
    filter: 'blur(8px)',
    transition: {
      duration: 0.34,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const AUTH_CARD_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.72,
      ease: AUTH_EASE,
      staggerChildren: 0.055,
      delayChildren: 0.08,
    },
  },
};

export const AUTH_FIELD_STAGGER_VARIANTS: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const AUTH_FIELD_ITEM_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: AUTH_EASE,
    },
  },
};
