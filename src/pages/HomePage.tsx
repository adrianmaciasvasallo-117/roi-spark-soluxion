import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface HistoryEntry {
  id: string;
  type: string;
  nombre: string;
  sector: string;
  fecha: string;
  resultado?: string;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const interviews: HistoryEntry[] = JSON.parse(localStorage.getItem('soluxion_interviews') || '[]');
      const onboardings: HistoryEntry[] = JSON.parse(localStorage.getItem('soluxion_onboardings') || '[]');
      const all = [...interviews.map(e => ({ ...e, type: 'entrevista' })), ...onboardings.map(e => ({ ...e, type: 'puesta_en_marcha' }))]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 5);
      setHistory(all);
    } catch { /* empty */ }
  }, []);

  const deleteEntry = (entry: HistoryEntry) => {
    const key = entry.type === 'entrevista' ? 'soluxion_interviews' : 'soluxion_onboardings';
    try {
      const arr: HistoryEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(arr.filter(e => e.id !== entry.id)));
    } catch { /* empty */ }
    setHistory(prev => prev.filter(e => e.id !== entry.id));
  };

  const clearAll = () => {
    localStorage.removeItem('soluxion_interviews');
    localStorage.removeItem('soluxion_onboardings');
    setHistory([]);
  };

  const tools = [
    {
      emoji: '📊',
      title: 'Calculadora ROI',
      desc: 'Calcula el ROI y genera propuestas personalizadas para el cliente',
      badge: 'Principal',
      badgeClass: 'bg-accent text-accent-foreground',
      route: '/roi',
      highlight: true,
    },
    {
      emoji: '🎯',
      title: 'Entrevista Comercial',
      desc: 'Cuestionario táctil para visitas. Cualifica al cliente en minutos con resultado automático',
      badge: 'Nuevo',
      badgeClass: 'bg-purple-600 text-white',
      route: '/entrevista',
      highlight: false,
    },
    {
      emoji: '⚙️',
      title: 'Puesta en Marcha',
      desc: 'Configura el agente de voz tras el cierre. Genera la ficha técnica PDF',
      badge: 'Nuevo',
      badgeClass: 'bg-purple-600 text-white',
      route: '/puesta-en-marcha',
      highlight: false,
    },
  ];

  const resultBadge = (resultado?: string) => {
    if (!resultado) return null;
    const map: Record<string, { label: string; cls: string }> = {
      cualificado: { label: 'Cualificado', cls: 'bg-green-100 text-green-800' },
      potencial: { label: 'Potencial', cls: 'bg-amber-100 text-amber-800' },
      no_momento: { label: 'No es el momento', cls: 'bg-red-100 text-red-800' },
      completado: { label: 'Completado', cls: 'bg-blue-100 text-blue-800' },
    };
    const m = map[resultado] || { label: resultado, cls: 'bg-muted text-muted-foreground' };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.cls}`}>{m.label}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Herramientas Soluxion</h2>
          <p className="text-sm text-muted-foreground">Selecciona la herramienta que necesitas</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {tools.map((t) => (
            <button
              key={t.route}
              onClick={() => navigate(t.route)}
              className={`bg-card border rounded-lg p-5 text-left hover:border-accent hover:shadow-md transition-all cursor-pointer relative ${
                t.highlight ? 'ring-1 ring-accent/30' : ''
              }`}
            >
              <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-medium ${t.badgeClass}`}>
                {t.badge}
              </span>
              <div className="text-3xl mb-3">{t.emoji}</div>
              <h3 className="font-bold text-sm mb-1">{t.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
            </button>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Historial reciente</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay registros guardados</p>
          ) : (
            <>
              <div className="space-y-2">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between bg-card border rounded-md px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{entry.type === 'entrevista' ? '🎯' : '⚙️'}</span>
                      <div>
                        <p className="text-sm font-medium">{entry.nombre}</p>
                        <p className="text-xs text-muted-foreground">{entry.sector} · {entry.fecha}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {resultBadge(entry.resultado)}
                      <button
                        type="button"
                        onClick={() => deleteEntry(entry)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-destructive underline mt-3"
              >
                Limpiar historial
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
