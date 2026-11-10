import { AnimatePresence, motion } from 'framer-motion';
import { Ambience, sceneFor } from './Ambience';

function Motif({ motif }) {
  if (motif === 'orbit') {
    return (
      <div className="project-bg__motif project-bg__motif--orbit">
        <span />
        <span />
        <span />
        <i />
      </div>
    );
  }

  if (motif === 'grid') {
    return (
      <div className="project-bg__motif project-bg__motif--grid">
        <span />
      </div>
    );
  }

  if (motif === 'ribbon') {
    return (
      <div className="project-bg__motif project-bg__motif--ribbon">
        <span />
        <span />
        <span />
      </div>
    );
  }

  return (
    <div className="project-bg__motif project-bg__motif--wash">
      <span />
      <span />
      <span />
    </div>
  );
}

export function ProjectBackdrop({ theme, project, activeKey, reduced = false }) {
  const sceneKey = `${activeKey}-${theme.background}-${theme.primary}-${theme.motif}`;
  const transition = reduced
    ? { duration: 0 }
    : { duration: 1.05, ease: [0.22, 1, 0.36, 1] };

  return (
    <div
      className="project-bg"
      aria-hidden="true"
      style={{ backgroundColor: theme.background }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={sceneKey}
          className="project-bg__scene"
          style={{
            '--bg-primary': theme.primary,
            '--bg-secondary': theme.secondary,
            '--bg-accent': theme.accent,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          <div className="project-bg__blob project-bg__blob--one" />
          <div className="project-bg__blob project-bg__blob--two" />
          {/* cada projeto tem a sua cena; o motivo genérico só aparece sem cena */}
          {sceneFor(project) ? <Ambience project={project} dark={theme.isDark} /> : <Motif motif={theme.motif} />}
          <div className="project-bg__vignette" />
        </motion.div>
      </AnimatePresence>
      <div className="project-bg__grain" />
    </div>
  );
}
