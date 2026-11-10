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
  const { pathname } = useLocation();
  const time = useLiveClock(site.timezone);
  const reduced = usePrefersReducedMotion();
  const { playHover, playClick } = useSound();

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

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
