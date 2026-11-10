import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { usePrefersReducedMotion } from '../../hooks/useUI';

export function PageTransition() {
  const { pathname, state } = useLocation();
  const reduced = usePrefersReducedMotion();
  const first = useRef(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    if (reduced) return undefined;
    if (state?.glass) return undefined; // a bolha de vidro já faz a transição

    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 280);
    return () => window.clearTimeout(id);
  }, [pathname, reduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="page-transition"
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.42, ease: [0.76, 0, 0.24, 1] }}
        />
      )}
    </AnimatePresence>
  );
}

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); // 'auto' seguiria o scroll-behavior: smooth do CSS
  }, [pathname]);

  return null;
}
