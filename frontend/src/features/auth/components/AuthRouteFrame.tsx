import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

import { AUTH_ROUTE_VARIANTS } from '@/features/auth/animations/authMotion';
import { useAuthMobileViewport } from '@/features/auth/hooks/useAuthMobileViewport';

export const AuthRouteFrame = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const isMobileViewport = useAuthMobileViewport();
  const shouldReduceMotion = reduceMotion || isMobileViewport;

  return (
    <div className="relative min-h-screen bg-slate-950 max-md:min-h-[100svh]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(99,102,241,0.14),transparent_38%),linear-gradient(180deg,#020617,#020617)] max-md:bg-[linear-gradient(180deg,#020617,#020617)]" />
      <LayoutGroup id="auth-shared-shell">
        <AnimatePresence mode={isMobileViewport ? 'wait' : 'sync'} initial={false}>
          <motion.div
            key={location.pathname}
            variants={shouldReduceMotion ? undefined : AUTH_ROUTE_VARIANTS}
            initial={shouldReduceMotion ? false : 'initial'}
            animate={shouldReduceMotion ? undefined : 'enter'}
            exit={shouldReduceMotion ? undefined : 'exit'}
            className="relative z-10"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
};
