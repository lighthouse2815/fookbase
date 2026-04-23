import type { Transition, Variants } from 'framer-motion';

const AUTH_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const AUTH_BASE_TRANSITION: Transition = {
  duration: 0.62,
  ease: AUTH_EASE,
};

export const AUTH_ROUTE_VARIANTS: Variants = {
  initial: {
    opacity: 0.52,
    y: 14,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: AUTH_BASE_TRANSITION,
  },
  exit: {
    opacity: 0.48,
    y: -10,
    transition: {
      duration: 0.28,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export const AUTH_CARD_VARIANTS: Variants = {
  hidden: {
    opacity: 0.58,
    y: 20,
    scale: 0.992,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.62,
      ease: AUTH_EASE,
      staggerChildren: 0.048,
      delayChildren: 0.05,
    },
  },
};

export const AUTH_CARD_LAYOUT_TRANSITION: Transition = {
  duration: 0.46,
  ease: [0.2, 0.95, 0.3, 1],
};

export const AUTH_HERO_STAGGER_VARIANTS: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.02,
    },
  },
};

export const AUTH_HERO_LINE_VARIANTS: Variants = {
  hidden: {
    opacity: 0.55,
    x: -24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.62,
      ease: AUTH_EASE,
    },
  },
};

export const AUTH_FORM_SHELL_VARIANTS: Variants = {
  hidden: {
    opacity: 0.56,
    y: 26,
    scale: 0.994,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.64,
      ease: AUTH_EASE,
      delay: 0.06,
    },
  },
};

export const AUTH_FIELD_STAGGER_VARIANTS: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.042,
      delayChildren: 0.02,
    },
  },
};

export const AUTH_FIELD_ITEM_VARIANTS: Variants = {
  hidden: {
    opacity: 0.6,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.34,
      ease: AUTH_EASE,
    },
  },
};

export const AUTH_CARD_HEADER_VARIANTS: Variants = {
  initial: {
    opacity: 0.72,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.36,
      ease: AUTH_EASE,
    },
  },
  exit: {
    opacity: 0.72,
    y: -6,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export const AUTH_FORM_CONTENT_VARIANTS: Variants = {
  initial: {
    opacity: 0.56,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: AUTH_EASE,
    },
  },
  exit: {
    opacity: 0.52,
    y: -9,
    transition: {
      duration: 0.24,
      ease: [0.4, 0, 1, 1],
    },
  },
};
