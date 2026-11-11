import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { portfolioData } from '../../data/portfolioData';
import { useSound } from '../../context/SoundContext';
import { useLiveClock } from '../../hooks/useLiveClock';
import { usePrefersReducedMotion } from '../../hooks/useUI';
import { IconClose } from '../Icons';

const { site, labels } = portfolioData;

const LINKS = [
  { label: labels.work, to: '/' },
  { label: labels.about, to: '/about' },
  { label: labels.playground, to: '/laboratorio' },
  { label: labels.contact, to: '/contact' },
];

/*
 * Menu do celular: gaveta de vidro que entra da direita (40% da tela),
 * no mesmo estilo de app do menu do desktop.
 */
export function MenuOverlay({ onClose }) {
  const closeRef = useRef(null);
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const { pathname } = useLocation();
  const time = useLiveClock(site.timezone);
  const reduced = usePrefersReducedMotion();
  const { playHover, playClick } = useSound();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // foco: entra no botão fechar, fica preso na gaveta (Tab) e volta para quem
  // abriu o menu ao fechar. Roda só ao abrir (antes rodava a cada render do App
  // e o foco pulava de volta para o fechar).
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll('a[href], button:not([disabled])')];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panelRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const slide = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { x: '105%' }, animate: { x: 0 }, exit: { x: '105%' } };

  return (
    <motion.div
      className="drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      initial={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.button
        type="button"
        className="drawer__scrim"
        aria-label="Fechar menu"
        tabIndex={-1}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      <motion.aside
        ref={panelRef}
        className="drawer__panel glass"
        {...slide}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="drawer__head">
          <span className="logo-mark drawer__mark">TD</span>
          <button
            type="button"
            className="drawer__close"
            ref={closeRef}
            onClick={() => {
              playClick();
              onClose();
            }}
            aria-label={labels.close}
          >
            <IconClose size={14} />
          </button>
        </div>

        <span className="drawer__name">
          <strong>{site.name.split(' ')[0]}</strong>
          <span>OrvionWeb</span>
        </span>

        <nav className="drawer__links" aria-label="Menu">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`drawer__link${pathname === link.to ? ' is-active' : ''}`}
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                onClose();
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="drawer__foot">
          <a href={site.whatsapp} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href={`mailto:${site.email}`}>E-mail</a>
          <span>
            {site.timezoneLabel}, {time}
          </span>
        </div>
      </motion.aside>
    </motion.div>
  );
}
