import { Link } from 'react-router-dom';
import { portfolioData } from '../data/portfolioData';
import { useDocumentTitle } from '../hooks/useUI';
import { IconArrowUpRight } from '../components/Icons';

const { site, about, contact } = portfolioData;

// links de contato em linhas, na ordem da página Contato
const links = contact.groups.flatMap((group) => group.links);

// ferramentas da faixa "Feito com": cada item da lista vira uma etiqueta
const tools = about.recognition.flatMap((item) => item.title.split(/,\s*|\s+e\s+/));

/*
 * Sobre: retrato fixo à esquerda e, à direita, uma coluna de cartões de vidro
 * que rola (perfil, links, contato, bio, ferramentas, serviços, experiência).
 * No celular o retrato vem primeiro e os cartões seguem embaixo.
 */
export function About() {
  useDocumentTitle(`Sobre — ${site.name}`);

  return (
    <main className="page about" id="main">
      <figure className="about-photo">
        <img src={about.portrait} alt={`${site.name}, retrato`} decoding="async" />
        <figcaption className="about-photo__tag glass">Sobre</figcaption>
      </figure>

      <div className="about-stack">
        <section className="about-tile glass about-profile" aria-label="Perfil">
          <div className="about-profile__id">
            <img src={about.portrait} alt="" className="about-profile__avatar" decoding="async" />
            <div>
              <p className="about-profile__name">{site.name}</p>
              <p className="about-profile__role">Web designer e desenvolvedor front-end</p>
            </div>
          </div>
          <p className="about-profile__intro">{about.intro}</p>
        </section>

        <nav className="about-links" aria-label="Contatos e redes">
          {links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="about-row glass">
              <span>{link.label}</span>
              <IconArrowUpRight size={12} />
            </a>
          ))}
          <Link to="/contact" className="about-row about-row--cta">
            <span>Começar um projeto</span>
            <IconArrowUpRight size={12} />
          </Link>
        </nav>

        <section className="about-tile glass about-text" aria-labelledby="about-title">
          <h1 className="about-text__title" id="about-title">
            {about.heading}
          </h1>
          <div className="about-text__body">
            {about.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="about-marquee glass" aria-label="Ferramentas">
          <span className="about-marquee__label">Feito com</span>
          <div className="about-marquee__track">
            <ul className="about-marquee__list">
              {tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
            <ul className="about-marquee__list" aria-hidden="true">
              {tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="about-tile glass about-text" aria-labelledby="services-title">
          <h2 className="about-text__title about-text__title--small" id="services-title">
            Serviços
          </h2>
          <p className="about-text__lead">
            Do primeiro esboço ao site publicado, com o mesmo cuidado em cada etapa.
          </p>
        </section>
        <ul className="about-list">
          {about.services.map((service) => (
            <li key={service} className="about-row glass">
              <span>{service}</span>
            </li>
          ))}
        </ul>

        <section className="about-tile glass about-text" aria-labelledby="experience-title">
          <h2 className="about-text__title about-text__title--small" id="experience-title">
            Experiência
          </h2>
        </section>
        <ul className="about-list">
          {about.experience.map((item) => (
            <li key={`${item.period}-${item.company}`} className="about-row glass">
              <span>
                {item.company}
                <small>{item.role}</small>
              </span>
              <span className="about-row__meta">{item.period}</span>
            </li>
          ))}
        </ul>

        <section className="about-tile glass about-text" aria-labelledby="tools-title">
          <h2 className="about-text__title about-text__title--small" id="tools-title">
            Ferramentas
          </h2>
        </section>
        <ul className="about-list">
          {about.recognition.map((item) => (
            <li key={item.year} className="about-row glass">
              <span>{item.year}</span>
              <span className="about-row__meta">{item.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
