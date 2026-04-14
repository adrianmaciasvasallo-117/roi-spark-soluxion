import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

const Header = ({ title, showBack = false }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-primary text-primary-foreground py-3 px-4 md:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Inicio</span>
            </button>
          ) : (
            <img
              src="/soluxion-logo.png"
              alt="Soluxion"
              className="h-9 rounded"
            />
          )}
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">
              {title || 'Soluxion'}
            </h1>
            {!title && <p className="text-xs opacity-75">Calculadora ROI</p>}
          </div>
        </div>
        {!showBack && (
          <div className="flex items-center gap-4 text-xs">
            <a
              href="mailto:soluxion.ai@gmail.com"
              className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">soluxion.ai@gmail.com</span>
            </a>
            <a
              href="tel:+34632144398"
              className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">+34 632 14 43 98</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
