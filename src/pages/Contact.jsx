import { portfolioData } from '../data/portfolioData';
import { useCopyToClipboard, useDocumentTitle } from '../hooks/useUI';
import { useLiveClock } from '../hooks/useLiveClock';
import { useSound } from '../context/SoundContext';
import { CreditsCard } from '../components/CreditsCard';
import { IconArrowUpRight } from '../components/Icons';

const { site, labels, contact, credits } = portfolioData;

export function Contact() {
  const time = useLiveClock(site.timezone);
  const { copied, copy } = useCopyToClipboard();
  const { playClick, playHover } = useSound();

  useDocumentTitle(`Contato — ${site.name}`);

  return (
    <main className="page contact grid16" id="main">
      <div className="contact__main">
        <span className="contact__eyebrow">{site.availability}</span>
        <h1 className="contact__title">{contact.heading}</h1>
        <p className="contact__intro">{contact.intro}</p>

        <a href={`mailto:${site.email}`} className="contact__email">
          {site.email}
        </a>
        <button
          type="button"
          className={`contact__copy${copied ? ' is-copied' : ''}`}
          onClick={async () => {
            playClick();
            await copy(site.email);
          }}
        >
          {copied ? labels.copied : labels.copyEmail}
        </button>

        <div className="contact__groups">
          {contact.groups.map((group) => (
            <div className="contact__group" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      onMouseEnter={playHover}
                    >
                      {link.label}
                      <IconArrowUpRight size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <aside className="contact__side">
        <CreditsCard />

        <div className="credits-list">
          <h3>Estúdio</h3>
          <dl>
            <div>
              <dt>Base</dt>
              <dd>{site.location}</dd>
            </div>
            <div>
              <dt>Hora local</dt>
              <dd>{time}</dd>
            </div>
            <div>
              <dt>Agenda</dt>
              <dd>{site.availability}</dd>
            </div>
          </dl>
        </div>

        <div className="credits-list">
          <h3>{labels.credits}</h3>
          <dl>
            {credits.items.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <p>{credits.note}</p>
        </div>
      </aside>
    </main>
  );
}
