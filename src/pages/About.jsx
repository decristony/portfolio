import { Link } from 'react-router-dom';
import { portfolioData } from '../data/portfolioData';
import { useDocumentTitle } from '../hooks/useUI';
import { IconArrowUpRight } from '../components/Icons';

const { site, about } = portfolioData;

export function About() {
  useDocumentTitle(`Sobre — ${site.name}`);

  return (
    <main className="page" id="main">
      <header className="about-hero grid16">
        <h1 className="about-hero__title">{about.heading}</h1>
        <p className="about-hero__aside">{about.intro}</p>
      </header>

      <div className="about-grid">
        <figure className="about-portrait">
          <img src={about.portrait} alt={`${site.name}: detalhe do estúdio`} decoding="async" />
        </figure>

        <div className="about-bio">
          {about.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="about-services">
          <span className="label">Serviços</span>
          <ul>
            {about.services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="about-columns">
        <section className="about-col" aria-labelledby="experience-title">
          <h2 className="about-col__head" id="experience-title">
            Experiência
          </h2>
          {about.experience.map((item) => (
            <div className="about-row" key={`${item.period}-${item.company}`}>
              <span>{item.period}</span>
              <span>{item.role}</span>
              <span>{item.company}</span>
            </div>
          ))}
        </section>

        <section className="about-col" aria-labelledby="recognition-title">
          <h2 className="about-col__head" id="recognition-title">
            Ferramentas
          </h2>
          {about.recognition.map((item) => (
            <div className="about-row" key={`${item.year}-${item.title}`}>
              <span>{item.year}</span>
              <span>{item.title}</span>
              <span>Uso diário</span>
            </div>
          ))}
        </section>
      </div>

      <div className="about-cta">
        <p className="about-cta__text">
          Tem um projeto
          <br />
          em mente?
        </p>
        <Link to="/contact" className="pill">
          Começar um projeto <IconArrowUpRight size={12} />
        </Link>
      </div>
    </main>
  );
}
