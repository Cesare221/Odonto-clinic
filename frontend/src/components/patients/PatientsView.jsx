import { useMemo } from 'react';
import { ArrowRight, FileText, Search, UserPlus, X } from 'lucide-react';
import Button from '../ui/Button';

const getInitials = (name = 'Paciente') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';

  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const getDigits = (value) => String(value || '').replace(/\D/g, '');

const PatientsView = ({
  patients,
  onViewProfile,
  onGoToNewPatient,
  searchTerm = '',
  onSearchChange,
}) => {
  const filteredPatients = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    if (!term) return patients;

    const digitsTerm = getDigits(term);

    return patients.filter((patient) => {
      const name = String(patient?.name || '').toLowerCase();
      const cpf = String(patient?.cpf || '');
      const phone = String(patient?.phone || '');
      const cpfDigits = getDigits(cpf);
      const phoneDigits = getDigits(phone);

      return (
        name.includes(term) ||
        cpf.includes(term) ||
        phone.includes(term) ||
        (digitsTerm ? cpfDigits.includes(digitsTerm) || phoneDigits.includes(digitsTerm) : false)
      );
    });
  }, [patients, searchTerm]);

  const hasSearch = Boolean(searchTerm);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex justify-end">
        <Button type="button" className="w-full sm:w-auto" onClick={onGoToNewPatient} icon={UserPlus}>
          Cadastrar novo cliente
        </Button>
      </div>

      <section className="page-shell-panel rounded-[1.75rem] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--copy-soft)] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchTerm}
                onChange={(event) => onSearchChange?.(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] py-3 pl-11 pr-12 text-sm font-medium text-[var(--copy-strong)] outline-none transition-all duration-150 placeholder:text-[var(--copy-soft)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary-500)] focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] sm:pr-36"
              />
              {hasSearch && (
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                  <span className="hidden rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--copy-muted)] sm:inline-flex">
                    filtrando
                  </span>
                  <button
                    type="button"
                    onClick={() => onSearchChange?.('')}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--copy-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--copy-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)]"
                    aria-label="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--surface-panel)] shadow-[var(--shadow-md)]">
        <div className="hidden border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(248,251,255,0.96),rgba(236,244,255,0.86))] px-5 py-4 sm:px-6 lg:block">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.85fr)_auto] gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--copy-muted)]">
            <span>Paciente</span>
            <span>Documento</span>
            <span>Contato</span>
            <span>Última visita</span>
            <span className="text-right">Ação</span>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="px-6 py-14">
            <div className="mx-auto flex max-w-md flex-col items-center rounded-[1.75rem] border border-dashed border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-panel-strong)] text-[var(--color-primary-700)]">
                <FileText size={24} />
              </div>
              <p className="mt-5 text-base font-semibold text-[var(--copy-strong)]">
                {hasSearch
                  ? `Nenhum paciente encontrado para "${searchTerm}"`
                  : 'Nenhum paciente cadastrado'
                }
              </p>
              {!hasSearch && (
                <Button type="button" variant="secondary" className="mt-5" onClick={onGoToNewPatient} icon={UserPlus}>
                  Cadastrar primeiro paciente
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {filteredPatients.map((patient) => {
              const patientId = patient._id || patient.id;
              const lastVisit = patient?.lastVisit || 'N/A';
              const hasVisit = lastVisit !== 'N/A';

              return (
                <div
                  key={patientId}
                  className="px-4 py-4 transition-colors duration-200 hover:bg-[var(--surface-panel-soft)] sm:px-6"
                >
                  <div className="grid gap-4 rounded-2xl border border-[var(--border-soft)] bg-white/60 p-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.85fr)_auto] lg:items-center lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-primary-500),var(--color-primary-700))] text-sm font-bold text-white shadow-[var(--shadow-sm)]">
                        {getInitials(patient?.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--copy-strong)] sm:text-base">
                          {patient?.name || 'Sem nome'}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copy-soft)] lg:hidden">
                        Documento
                      </p>
                      <p className="truncate font-mono text-sm text-[var(--copy-body)]">
                        {patient?.cpf || '-'}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copy-soft)] lg:hidden">
                        Contato
                      </p>
                      <p className="truncate text-sm text-[var(--copy-body)]">
                        {patient?.phone || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copy-soft)] lg:hidden">
                        Última visita
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          hasVisit
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-[var(--border-soft)] bg-[var(--surface-panel-soft)] text-[var(--copy-muted)]'
                        }`}
                      >
                        {lastVisit}
                      </span>
                    </div>

                    <div className="flex justify-start lg:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewProfile(patient)}
                        icon={ArrowRight}
                        className="w-full justify-center text-[var(--color-primary-700)] hover:bg-[var(--surface-tint)] hover:text-[var(--color-primary-800)] sm:w-auto"
                      >
                        Ver ficha
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientsView;
