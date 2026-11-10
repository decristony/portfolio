import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useUI';
import { portfolioData } from '../data/portfolioData';

const { site } = portfolioData;

export function NotFound() {
  useDocumentTitle(`Página não encontrada — ${site.name}`);

  return (
    <main className="notfound" id="main">
      <div>
        <span className="micro">404 — {site.brand}</span>
        <h1>Perdido no grid.</h1>
        <p>A página que você procura não existe ou mudou de lugar.</p>
        <Link to="/" className="pill">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
