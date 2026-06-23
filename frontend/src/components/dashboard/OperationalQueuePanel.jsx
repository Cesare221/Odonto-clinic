import { Activity, Clock3, Eye, Play, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  getOperationalNextAction,
  getOperationalStatusMeta,
  getOperationalToneClasses,
  getQueuePriority,
} from '../../utils/operationalStatus';

const getInitials = (name = 'Paciente') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const getSortedQueue = (queue) => {
  return [...queue].sort((left, right) => {
    const priorityDiff = getQueuePriority(left) - getQueuePriority(right);
    if (priorityDiff !== 0) return priorityDiff;
    return String(left.time || '').localeCompare(String(right.time || ''));
  });
};

const OperationalQueuePanel = ({ queue, readOnlyQueue = false, onStartAttendance }) => {
  const sortedQueue = getSortedQueue(queue);

  return (
    <Card variant="elevated" className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--copy-muted)]">
            Fila operacional
          </p>
          <h3 className="mt-2 text-xl font-bold text-[var(--copy-strong)]">
            Quem pede atenção primeiro
          </h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[rgba(255,255,255,0.78)] px-3 py-1.5 text-xs font-semibold text-[var(--copy-muted)] shadow-[var(--shadow-sm)]">
          {readOnlyQueue ? <Eye size={14} /> : <Sparkles size={14} />}
          {readOnlyQueue ? 'Painel de observação' : `${sortedQueue.length} caso(s) monitorado(s)`}
        </span>
      </div>

      <div className="mt-5">
        {sortedQueue.length === 0 ? (
          <div className="page-muted-panel rounded-2xl border border-dashed px-5 py-10 text-center">
            <p className="text-base font-semibold text-[var(--copy-strong)]">
              Nenhuma pressão na fila neste momento
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedQueue.map((item, index) => {
              const meta = getOperationalStatusMeta(item);
              const tone = getOperationalToneClasses(item);
              const actionLabel = item.status === 'in-progress' ? 'Retomar' : 'Iniciar';

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 shadow-[var(--shadow-sm)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${tone.panel}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-[var(--shadow-sm)] ${tone.accent}`}>
                        {getInitials(item.patient)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copy-muted)]">
                            Prioridade {index + 1}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                            {meta.label}
                          </span>
                        </div>

                        <p className="mt-3 truncate text-base font-semibold text-[var(--copy-strong)]">
                          {item.patient}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--copy-body)]">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={14} />
                            {item.time || '--:--'}
                          </span>
                          <span className="text-[var(--copy-muted)]">/</span>
                          <span>{item.type || 'Consulta'}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[var(--copy-body)]">
                          {getOperationalNextAction(item)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center">
                      {readOnlyQueue ? (
                        <span className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--copy-muted)]">
                          Somente visualização
                        </span>
                      ) : (
                        <Button
                          className="w-full sm:w-auto"
                          type="button"
                          size="sm"
                          variant={item.status === 'in-progress' ? 'warning' : 'primary'}
                          icon={item.status === 'in-progress' ? Activity : Play}
                          onClick={() => onStartAttendance(item)}
                        >
                          {actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default OperationalQueuePanel;
