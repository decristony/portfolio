import { portfolioData } from '../../data/portfolioData';
import { useCopyToClipboard } from '../../hooks/useUI';
import { useLiveClock } from '../../hooks/useLiveClock';
import { useSound } from '../../context/SoundContext';
import { ModalShell } from './ModalShell';
import { IconArrowUpRight } from '../Icons';

const { site, labels, contact } = portfolioData;

export function ContactModal({ onClose }) {
  const time = useLiveClock(site.timezone);
  const { copied, copy } = useCopyToClipboard();
  const { playClick, playHover } = useSound();

  return (
    <ModalShell label={labels.contact} onClose={onClose} variant="contact">
      <div className="cmodal">
        <div className="cmodal__meta">
          <span className="micro">{site.availability}</span>
          <span className="micro">
            {site.location} · {time}
          </span>
        </div>

        <h2 className="cmodal__title">{contact.heading}</h2>
        <p className="cmodal__intro">{contact.intro}</p>

        <button
          type="button"
          className="cmodal__email"
          onClick={async () => {
            playClick();
            await copy(site.email);
          }}
        >
          <span className="label">{labels.inquiries}</span>
          <span className="cmodal__email-value">{site.email}</span>
          <span className="cmodal__email-copy">{copied ? labels.copied : labels.copyEmail}</span>
        </button>

        <div className="cmodal__groups">
          {contact.groups.map((group) => (
            <div key={group.title} className="cmodal__group">
              <span className="label">{group.title}</span>
              <div className="cmodal__links">
                {group.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onMouseEnter={playHover}
                  >
                    {link.label}
                    <IconArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="cmodal__foot">
          <span>{site.workingGlobally}</span>
          <span>{site.copyright}</span>
        </div>
      </div>
    </ModalShell>
  );
}
