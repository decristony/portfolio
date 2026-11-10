import { Link } from 'react-router-dom';

// Marca TD fixa (o cubo girando foi removido).
export function LogoMark() {
  return (
    <Link to="/" className="logo-mark" aria-label="Início">
      TD
    </Link>
  );
}
