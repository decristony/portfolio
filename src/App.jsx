import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SoundProvider } from './context/SoundContext';
import { useBodyLock } from './hooks/useUI';
import { Nav } from './components/layout/Nav';
import { PageTransition, ScrollToTop } from './components/layout/PageTransition';
import { MenuOverlay } from './components/layout/MenuOverlay';
import { ContactModal } from './components/modals/ContactModal';
import { GlassRevealHost } from './components/layout/GlassReveal';
import { CursorTrail } from './components/layout/CursorTrail';
import { INTRO_KEY, Loader } from './components/layout/Loader';
import { Work } from './pages/Work';
import { autoTune, useTier } from './lib/perfTier';
// Projetos vem no pacote inicial; as outras páginas carregam quando são abertas
const Project = lazy(() => import('./pages/Project').then((m) => ({ default: m.Project })));
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Lab = lazy(() => import('./pages/Lab').then((m) => ({ default: m.Lab })));
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

function Shell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  // abertura só na primeira visita da sessão
  const [intro, setIntro] = useState(() => {
    try {
      return !sessionStorage.getItem(INTRO_KEY);
    } catch {
      return false;
    }
  });
  const endIntro = useCallback(() => setIntro(false), []);

  useBodyLock(menuOpen || intro);
  const tier = useTier();

  // depois da abertura, mede o FPS uma vez e rebaixa o nível se o aparelho não aguentar
  useEffect(() => {
    if (!intro) autoTune();
  }, [intro]);

  useEffect(() => {
    setMenuOpen(false);
    setContactOpen(false);
  }, [location.pathname]);

  const openMenu = () => {
    setContactOpen(false);
    setMenuOpen(true);
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>

      <div className="nav-host" inert={intro}>
        <Nav onMenu={openMenu} />
      </div>

      <motion.div
        key={location.pathname}
        inert={intro}
        // vinda da bolha de vidro: a página já está por baixo dela, sem fade (o fade deixava passar o fundo claro)
        initial={location.state?.glass ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Suspense fallback={null}>
          <Routes location={location}>
            {/* o site abre direto em Projetos; /work continua valendo para links antigos */}
            <Route path="/" element={<Work />} />
            <Route path="/work" element={<Navigate to="/" replace />} />
            <Route path="/project/:slug" element={<Project />} />
            <Route path="/about" element={<About />} />
            <Route path="/laboratorio" element={<Lab />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>

      <PageTransition />
      <GlassRevealHost />
      <ScrollToTop />
      {/* rastro do cursor: só nos níveis médio e alto */}
      {tier !== 'baixo' && <CursorTrail />}

      <AnimatePresence>{intro && <Loader onDone={endIntro} />}</AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <MenuOverlay
            onClose={() => setMenuOpen(false)}
            onContact={() => {
              setMenuOpen(false);
              setContactOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <SoundProvider>
        <Shell />
      </SoundProvider>
    </BrowserRouter>
  );
}
