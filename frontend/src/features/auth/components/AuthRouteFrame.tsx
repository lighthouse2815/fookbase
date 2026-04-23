import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

import { AUTH_ROUTE_VARIANTS } from '@/features/auth/animations/authMotion';

export const AuthRouteFrame = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(99,102,241,0.14),transparent_38%),linear-gradient(180deg,#020617,#020617)]" />
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={location.pathname}
          variants={reduceMotion ? undefined : AUTH_ROUTE_VARIANTS}
          initial={reduceMotion ? false : 'initial'}
          animate={reduceMotion ? undefined : 'enter'}
          exit={reduceMotion ? undefined : 'exit'}
          className="relative z-10"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
