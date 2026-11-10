import { portfolioData } from '../data/portfolioData';

const luminance = (hex) => {
  const value = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/*
 * Capa do projeto. Sem capa do Behance (cover: null), monta uma capa genérica
 * com a paleta do site: fundo na primeira cor, faixas com as demais.
 */
export function ProjectCover({ project, alt = '', loading = 'lazy', draggable }) {
  if (project.cover) {
    return <img src={project.cover} alt={alt} loading={loading} draggable={draggable} />;
  }

  const [base, ...rest] = project.colors;
  // Texto na cor da paleta com maior contraste contra o fundo.
  const ink = rest.reduce(
    (best, color) => (contrast(color, base) > contrast(best, base) ? color : best),
    rest[0] ?? '#111111',
  );

  return (
    <div
      className="generic-cover"
      style={{ '--gc-bg': base, '--gc-ink': ink }}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
    >
      <span className="generic-cover__title">{project.title}</span>
      <span className="generic-cover__cat">{project.category}</span>
      <div className="generic-cover__bands" aria-hidden="true">
        {rest.map((color) => (
          <span key={color} style={{ background: color }} />
        ))}
      </div>
      <span className="generic-cover__note">{portfolioData.labels.coverPending}</span>
    </div>
  );
}
