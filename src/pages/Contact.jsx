import { useEffect, useState } from 'react';
import { portfolioData } from '../data/portfolioData';
import { useCopyToClipboard, useDocumentTitle } from '../hooks/useUI';
import { useLiveClock } from '../hooks/useLiveClock';
import { useSound } from '../context/SoundContext';
import { IconArrowUpRight } from '../components/Icons';

const { site, labels, contact, credits, projects } = portfolioData;

// links das redes em linhas, cada um com o nome do grupo ao lado
const links = contact.groups
  .filter((group) => !group.links.some((link) => link.url === site.whatsapp))
  .flatMap((group) => group.links.map((link) => ({ ...link, group: group.title })));

const CYCLE_MS = 5200; // tempo de cada paleta no painel

/*
 * Contato: o mesmo esqueleto do Sobre. À esquerda, um painel fixo com a cor
 * viva dos projetos (a paleta troca devagar, de projeto em projeto) e o convite;
 * à direita, a coluna de cartões de vidro com os caminhos para falar comigo.
 */
export function Contact() {
  const time = useLiveClock(site.timezone);
  const { copied, copy } = useCopyToClipboard();
  const { playClick, playHover } = useSound();
  const [turn, setTurn] = useState(0);

  useDocumentTitle(`Contato — ${site.name}`);

  useEffect(() => {
    const id = window.setInterval(() => setTurn((n) => (n + 1) % projects.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, []);

  const palette = projects[turn];
  const [, c1, c2, c3] = palette.colors;

  return (
    <main className="page contact" id="main">
      <section
        className="contact-panel"
        aria-labelledby="contact-title"
        style={{ '--c1': c1, '--c2': c2, '--c3': c3 }}
      >
        <div className="contact-panel__field" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <p className="contact-panel__status glass">
          <span className="contact-panel__dot" aria-hidden="true" />
          {site.availability}
        </p>

        <div className="contact-panel__body">
          <h1 className="contact-panel__title" id="contact-title">
            {contact.heading}
          </h1>
          <p className="contact-panel__intro">{contact.intro}</p>

          <div className="contact-panel__mail">
            <a href={`mailto:${site.email}`} onMouseEnter={playHover}>
              {site.email}
            </a>
            <button
              type="button"
              className={`contact-panel__copy glass${copied ? ' is-copied' : ''}`}
              onClick={async () => {
                playClick();
                await copy(site.email);
              }}
            >
              {copied ? labels.copied : 'Copiar e-mail'}
            </button>
          </div>
        </div>

        <p className="contact-panel__foot">
          <span>
            {site.location}, {time}
          </span>
          <span className="contact-panel__palette" key={palette.slug}>
            Cor de {palette.title}
          </span>
        </p>
      </section>

      <div className="contact-stack">
        <a
          href={site.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="about-row about-row--cta contact-whats"
          onMouseEnter={playHover}
        >
          <span>
            Chamar no WhatsApp
            <small>{site.phone}</small>
          </span>
          <IconArrowUpRight size={12} />
        </a>

        <nav className="about-links" aria-label="Redes e portfólios">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="about-row glass"
              onMouseEnter={playHover}
            >
              <span>{link.label}</span>
              <span className="about-row__meta">
                {link.group} <IconArrowUpRight size={12} />
              </span>
            </a>
          ))}
        </nav>

        <section className="about-tile glass contact-info" aria-labelledby="studio-title">
          <h2 className="about-text__title about-text__title--small" id="studio-title">
            Estúdio
          </h2>
          <dl className="contact-dl">
            <div>
              <dt>Base</dt>
              <dd>{site.location}</dd>
            </div>
            <div>
              <dt>Hora local</dt>
              <dd>{time}</dd>
            </div>
            <div>
              <dt>Atendimento</dt>
              <dd>{site.workingGlobally}</dd>
            </div>
            <div>
              <dt>Agenda</dt>
              <dd>{site.availability}</dd>
            </div>
          </dl>
        </section>

        <section className="about-tile glass contact-info" aria-labelledby="credits-title">
          <h2 className="about-text__title about-text__title--small" id="credits-title">
            {labels.credits}
          </h2>
          <dl className="contact-dl">
            {credits.items.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="contact-info__note">{credits.note}</p>
        </section>
      </div>
    </main>
  );
}
