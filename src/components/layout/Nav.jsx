import { Link, useLocation } from 'react-router-dom';
import { portfolioData } from '../../data/portfolioData';
import { useSound } from '../../context/SoundContext';
import { useCopyToClipboard } from '../../hooks/useUI';
import { useLiveClock } from '../../hooks/useLiveClock';
import { LogoMark } from './LogoMark';
import { IconMenu } from '../Icons';

const { site, labels } = portfolioData;

const LINKS = [
  { label: labels.work, to: '/' },
  { label: labels.about, to: '/about' },
  { label: labels.playground, to: '/laboratorio' },
  { label: labels.contact, to: '/contact' },
];

export function Nav({ onMenu }) {
  const { pathname } = useLocation();
  const time = useLiveClock(site.timezone);
  const { soundEnabled, toggleSound, playHover, playClick } = useSound();
  const { copied, copy } = useCopyToClipboard(1500);

  const isActive = (to) => {
    if (to === '/') return pathname === '/' || pathname.startsWith('/project/');
    return pathname === to;
  };

  return (
    <header className="nav">
      <div className="nav__grid">
        <div className="nav__menu glass">
          {/* marca dentro do menu, como o ícone de um app */}
          <div className="nav__app">
            <LogoMark />
            <span className="nav__app-name">
              <strong>{site.name.split(' ')[0]}</strong>
              <span>OrvionWeb</span>
            </span>
          </div>
          <nav className="nav__links" aria-label="Principal">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav__link${isActive(link.to) ? ' is-active' : ''}`}
                onMouseEnter={playHover}
                onClick={playClick}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {/* celular: o som fica na mesma caixa do menu */}
          <button
            type="button"
            className={`audio nav__menu-audio${soundEnabled ? ' is-on' : ''}`}
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? labels.audioOn : labels.audioOff}
          >
            <span className="audio__wave" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </button>
          <button type="button" className="nav__toggle" onClick={onMenu} aria-label="Abrir menu">
            <IconMenu size={13} />
            <span>{labels.menu}</span>
          </button>
        </div>

        <div className="nav__right glass">
          <button
            type="button"
            className={`audio${soundEnabled ? ' is-on' : ''}`}
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? labels.audioOn : labels.audioOff}
          >
            <span className="audio__wave" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>{soundEnabled ? labels.audioOn : labels.audioOff}</span>
          </button>

          <div className="nav__meta nav__meta--clock">
            <span className="label">{site.workingGlobally}</span>
            <span>
              {site.timezoneLabel}, {time}
            </span>
          </div>

          <button
            type="button"
            className="nav__meta nav__meta--email"
            onClick={() => {
              playClick();
              copy(site.email);
            }}
            title={labels.copyEmail}
          >
            <span className="label">{copied ? labels.copied : labels.inquiries}</span>
            <span className="underline">{site.email}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
