import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useBodyLock, usePrefersReducedMotion } from '../../hooks/useUI';
import { IconClose } from '../Icons';

export function ModalShell({ label, onClose, children, variant = 'default' }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useBodyLock(true);

  useEffect(() => {
    restoreRef.current = document.activeElement;
    const panel = panelRef.current;
    panel?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const focusable = Array.from(
        panel.querySelectorAll(
          'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => node instanceof HTMLElement && node.offsetParent !== null);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus();
    };
  }, [onClose]);

  const content = (
    <motion.div
      className="modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.3 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className={`modal__inner${variant === 'contact' ? ' modal__inner--contact' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        ref={panelRef}
        initial={{ y: reduced ? 0 : 22, opacity: 0, scale: reduced ? 1 : 0.985 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: reduced ? 0 : 16, opacity: 0, scale: reduced ? 1 : 0.99 }}
        transition={{ duration: reduced ? 0.01 : 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <button type="button" className="modal__close" onClick={onClose}>
          <span>Fechar</span>
          <IconClose size={14} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );

  return createPortal(content, document.body);
}
