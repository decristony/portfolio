import { portfolioData } from '../data/portfolioData';

const { site } = portfolioData;

/* Cartão da página Contato: a marca TD enquanto o personagem 3D não existe. */
export function CreditsCard() {
  return (
    <div className="credits-card">
      <div className="credits-card__rive">
        <div className="credits-card__fallback">
          <span>
            {site.brand}
            <br />
            {site.shortRole}
          </span>
        </div>
      </div>
      <div className="credits-card__foot">
        <span>{site.name}</span>
        <span>{site.location}</span>
      </div>
    </div>
  );
}
