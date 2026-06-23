import { Activity, AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, DollarSign, Users, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const heroCopyByHealth = {
  stable: {
    eyebrow: 'Dia sob controle',
    title: 'Operação estável',
    accent: 'bg-emerald-700 text-white',
  },
  attention: {
    eyebrow: 'Atenção ao fluxo',
    title: 'Fluxo em atenção',
    accent: 'bg-amber-600 text-white',
  },
  critical: {
    eyebrow: 'Prioridade operacional',
    title: 'Ação necessária',
    accent: 'bg-rose-700 text-white',
  },
};

const metricConfig = [
  { key: 'active', label: 'Em atendimento', icon: Activity },
  { key: 'waiting', label: 'Na fila', icon: Users },
  { key: 'confirmations', label: 'Confirmações pedindo ação', icon: AlertTriangle },
  { key: 'upcoming', label: 'Próximos pacientes', icon: CalendarClock },
];

const OperationalHero = ({ summary, hideRevenue = false, onOpenCalendar }) => {
  const copy = heroCopyByHealth[summary.health] || heroCopyByHealth.attention;

  return (
    <Card
      variant="gradient"
      className="page-hero-panel overflow-hidden"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(18rem,23rem)]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-sm)] ${copy.accent}`}>
              <Activity size={14} />
              {copy.eyebrow}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/75 px-3 py-1.5 text-xs font-medium text-[var(--copy-muted)]">
              <CalendarDays size={14} />
              {summary.accessDate}
            </span>
            <a
              href="/agendamento"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 hover:border-primary-300"
            >
              <ExternalLink size={14} />
              Agendamento Público
            </a>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-primary-700)]">
              Torre de controle
            </p>
            <h2 className="max-w-2xl text-2xl font-bold text-[var(--copy-strong)] lg:text-3xl">
              {copy.title}
            </h2>
          </div>

          <div className="rounded-2xl border border-[var(--border-soft)] bg-white/80 p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${copy.accent}`}>
                <CheckCircle2 size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--copy-muted)]">
                  Próximo passo recomendado
                </p>
                <p className="text-base font-semibold text-[var(--copy-strong)]">
                  {summary.nextActionTitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {metricConfig.map(({ key, label, icon: Icon }) => (
              <div key={key} className="rounded-2xl border border-[var(--border-soft)] bg-white/82 p-4 shadow-[var(--shadow-sm)]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-panel-strong)] text-[var(--color-primary-700)]">
                  <Icon size={18} />
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                  {label}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-[var(--copy-strong)]">
                  {summary.metrics[key]}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.84)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                  Ritmo financeiro
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--copy-strong)]">
                  {hideRevenue ? 'Oculto para este perfil' : summary.revenueLabel}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-panel-strong)] text-[var(--color-primary-700)]">
                <DollarSign size={18} />
              </div>
            </div>

            <Button type="button" variant="secondary" size="sm" className="mt-4 w-full" onClick={onOpenCalendar}>
              Abrir agenda completa
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OperationalHero;
