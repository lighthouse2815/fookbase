import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

import { AUTH_ROUTE_VARIANTS } from '@/features/auth/animations/authMotion';

export const AuthRouteFrame = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={reduceMotion ? undefined : AUTH_ROUTE_VARIANTS}
        initial={reduceMotion ? false : 'initial'}
        animate={reduceMotion ? undefined : 'enter'}
        exit={reduceMotion ? undefined : 'exit'}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
};
