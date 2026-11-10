import { useEffect, useMemo, useState } from 'react';
import {
  colorsFromProject,
  createProjectTheme,
  extractCoverPalette,
} from '../lib/projectTheme';

// paletas já extraídas: a página do projeto abre com o mesmo fundo de Projetos
const resolved = new Map();

export function useProjectTheme(project, index = 0) {
  const [coverPalette, setCoverPalette] = useState(() =>
    project?.cover && resolved.has(project.cover)
      ? { cover: project.cover, colors: resolved.get(project.cover) }
      : null,
  );

  useEffect(() => {
    let active = true;
    if (!project?.cover) return undefined;

    extractCoverPalette(project.cover).then((colors) => {
      if (colors.length) resolved.set(project.cover, colors);
      if (active && colors.length) {
        setCoverPalette({ cover: project.cover, colors });
      }
    });

    return () => {
      active = false;
    };
  }, [project?.cover]);

  const palette =
    coverPalette?.cover === project?.cover
      ? coverPalette.colors
      : resolved.get(project?.cover) ?? null;

  return useMemo(
    () => createProjectTheme(project, palette ?? colorsFromProject(project), index),
    [project, palette, index],
  );
}
