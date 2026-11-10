import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SoundProvider } from './context/SoundContext';
import { useBodyLock } from './hooks/useUI';
import { Nav } from './components/layout/Nav';
import { PageTransition, ScrollToTop } from './components/layout/PageTransition';
import { MenuOverlay } from './components/layout/MenuOverlay';
import { ContactModal } from './components/modals/ContactModal';
import { GlassRevealHost } from './components/layout/GlassReveal';
import { Work } from './pages/Work';
import { Project } from './pages/Project';
import { About } from './pages/About';
import { Lab } from './pages/Lab';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';

function Shell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useBodyLock(menuOpen);


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

      <div className="nav-host">
        <Nav onMenu={openMenu} />
      </div>

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
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
      </motion.div>

      <PageTransition />
      <GlassRevealHost />
      <ScrollToTop />

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
    <BrowserRouter>
      <SoundProvider>
        <Shell />
      </SoundProvider>
    </BrowserRouter>
  );
}
