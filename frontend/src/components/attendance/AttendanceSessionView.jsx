import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardPenLine,
  FileText,
  LayoutDashboard,
  MinusCircle,
  PlusCircle,
  ShieldCheck,
  Smile,
  Stethoscope,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { PROCEDURES, colors } from '../../constants';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import AnamnesisForm from './AnamnesisForm';
import Odontogram from './Odontogram';

let nextProcedureId = 0;

const createProcedureItem = () => ({
  id: `procedure-${nextProcedureId += 1}`,
  category: '',
  procedure: '',
  price: '',
});

const tabs = [
  { id: 'overview', label: 'Resumo clínico', icon: ShieldCheck },
  { id: 'odontogram', label: 'Odontograma', icon: Smile },
  { id: 'evolution', label: 'Evolução', icon: FileText },
  { id: 'billing', label: 'Procedimentos', icon: Wallet },
];

const getStatusLabel = (session) => {
  if (session?.operationalLabel) {
    return session.operationalLabel;
  }

  if (session?.status === 'in-progress') {
    return 'Em atendimento';
  }

  return 'Sessão ativa';
};

const AttendanceSessionView = ({ session, onFinishAttendance, onCancelAttendance }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [proceduresList, setProceduresList] = useState(() => [createProcedureItem()]);
  const [teethData, setTeethData] = useState({});
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [toothNote, setToothNote] = useState('');
  const [evolutionText, setEvolutionText] = useState('');
  const [anamnesisData, setAnamnesisData] = useState({ answers: {}, details: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeSession = session || {};
  const statusLabel = getStatusLabel(safeSession);

  const totalFaturamento = useMemo(
    () => proceduresList.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0),
    [proceduresList]
  );

  const positiveAlerts = useMemo(
    () => Object.values(anamnesisData.answers || {}).filter((value) => value === 'sim').length,
    [anamnesisData.answers]
  );

  const positiveAlertsWithDetails = useMemo(
    () => Object.entries(anamnesisData.answers || {}).filter(([index, value]) => (
      value === 'sim' && String(anamnesisData.details?.[index] || '').trim()
    )).length,
    [anamnesisData.answers, anamnesisData.details]
  );

  const teethTouched = useMemo(
    () => Object.keys(teethData).length,
    [teethData]
  );

  const completedProcedures = useMemo(
    () => proceduresList.filter((item) => item.category && item.procedure && Number(item.price) > 0).length,
    [proceduresList]
  );

  const hasEvolution = evolutionText.trim().length > 0;

  const hasIncompleteProcedures = useMemo(
    () => proceduresList.some((item) => {
      const hasAnyValue = item.category || item.procedure || item.price;
      return hasAnyValue && !(item.category && item.procedure && Number(item.price) > 0);
    }),
    [proceduresList]
  );

  const alertsReviewed = positiveAlerts === 0 || positiveAlertsWithDetails === positiveAlerts;

  const finishChecklist = [
    {
      id: 'alerts',
      label: 'Alertas clínicos contextualizados',
      done: alertsReviewed,
      helper: alertsReviewed
        ? 'Os alertas positivos já têm detalhe suficiente para orientar a conduta.'
        : 'Detalhe os alertas positivos da anamnese antes de concluir a sessão.',
    },
    {
      id: 'evolution',
      label: 'Evolução clínica registrada',
      done: hasEvolution,
      helper: hasEvolution
        ? 'A evolução já está pronta para consulta futura.'
        : 'Registre achados, conduta e orientações de continuidade.',
    },
    {
      id: 'procedures',
      label: 'Procedimentos fechados',
      done: completedProcedures > 0 && !hasIncompleteProcedures,
      helper: completedProcedures > 0 && !hasIncompleteProcedures
        ? 'Os procedimentos e valores estão consistentes para faturamento.'
        : 'Revise categoria, procedimento e valor antes do fechamento.',
    },
  ];

  const nextClinicalStep = finishChecklist.find((item) => !item.done)?.helper
    || 'Sessão pronta para consolidar procedimentos e retornar ao dashboard operacional.';

  const summaryCards = [
    {
      label: 'Alerta clínico',
      value: positiveAlerts,
      tone: positiveAlerts > 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Dentes marcados',
      value: teethTouched,
      tone: 'border-[var(--border-soft)] bg-white/80 text-[var(--copy-strong)]',
    },
    {
      label: 'Procedimentos',
      value: completedProcedures,
      tone: 'border-[var(--border-soft)] bg-white/80 text-[var(--copy-strong)]',
    },
  ];

  const handleAddProcedure = () => {
    setProceduresList((previous) => [...previous, createProcedureItem()]);
    setActiveTab('billing');
  };

  const handleRemoveProcedure = (id) => {
    if (proceduresList.length === 1) return;

    setProceduresList((previous) => previous.filter((procedure) => procedure.id !== id));
  };

  const handleProcedureChange = (id, field, value) => {
    setProceduresList((previous) => previous.map((procedure) => (
      procedure.id === id ? { ...procedure, [field]: value } : procedure
    )));
  };

  const handleToothClick = (tooth) => {
    setSelectedTooth(tooth);
    setToothNote(teethData[tooth]?.note || '');
    setActiveTab('odontogram');
  };

  const handleSaveTooth = (status) => {
    setTeethData((previous) => ({
      ...previous,
      [selectedTooth]: { status, note: toothNote },
    }));
    setSelectedTooth(null);
  };

  const handleFinish = async (event) => {
    event.preventDefault();

    if (!safeSession?.id) {
      toast.error('Sessão inválida. Volte ao painel e tente novamente.');
      return;
    }

    if (completedProcedures === 0) {
      setActiveTab('billing');
      toast.error('Adicione ao menos um procedimento completo antes de encerrar a sessão.');
      return;
    }

    if (hasIncompleteProcedures) {
      setActiveTab('billing');
      toast.error('Revise os procedimentos: categoria, descrição e valor precisam estar completos.');
      return;
    }

    if (!hasEvolution) {
      setActiveTab('evolution');
      toast.error('Registre a evolução clínica antes de encerrar a sessão.');
      return;
    }

    if (!alertsReviewed) {
      setActiveTab('overview');
      toast.error('Detalhe os alertas positivos da anamnese antes de concluir o atendimento.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onFinishAttendance(
        safeSession.id,
        totalFaturamento,
        proceduresList,
        teethData,
        evolutionText,
        anamnesisData
      );

      if (result?.success) {
        return;
      }

      toast.error(result?.message || 'Não foi possível concluir a sessão. Revise os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-16">
        <section className="page-hero-panel overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-700)] px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-sm)]">
                  <Stethoscope size={14} />
                  Sessão clínica odonto
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--copy-muted)]">
                  {statusLabel}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--color-primary-700)]">
                  Atendimento em curso
                </p>
                <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-[var(--copy-strong)] sm:text-[2rem]">
                  {safeSession.patient || 'Paciente em atendimento'}
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border-soft)] bg-white/84 p-4 shadow-[var(--shadow-sm)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copy-muted)]">Motivo</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--copy-strong)]">{safeSession.type || 'Consulta'}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-white/84 p-4 shadow-[var(--shadow-sm)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copy-muted)]">Horário</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--copy-strong)]">{safeSession.time || '--:--'}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-white/84 p-4 shadow-[var(--shadow-sm)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copy-muted)]">Próximo passo</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--copy-strong)]">{safeSession.nextAction || nextClinicalStep}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-[var(--border-soft)] bg-white/84 p-5 shadow-[var(--shadow-sm)]">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {summaryCards.map((item) => (
                  <div key={item.label} className={`rounded-2xl border p-4 ${item.tone}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                  Checklist de conclusão
                </p>
                <div className="mt-3 space-y-3">
                  {finishChecklist.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.done ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--copy-strong)]">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[rgba(255,252,247,0.86)] p-3 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[linear-gradient(135deg,var(--color-primary-600),var(--color-primary-800))] text-white shadow-[var(--shadow-sm)]'
                      : 'border border-[var(--border-soft)] bg-white text-[var(--copy-body)] hover:border-[var(--border-strong)] hover:text-[var(--copy-strong)]'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === 'overview' && (
          <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <Card variant="gradient" className="rounded-[1.75rem]">
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <Activity size={18} className="text-[var(--color-primary-700)]" />
                  Anamnese e alertas da sessão
                </Card.Title>
              </Card.Header>
              <AnamnesisForm onAnamnesisChange={setAnamnesisData} />
            </Card>

            <Card className="rounded-[1.75rem]">
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <ClipboardPenLine size={18} className="text-[var(--color-primary-700)]" />
                  Quadro da sessão
                </Card.Title>
              </Card.Header>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                    Síntese operacional
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--copy-body)]">
                    {nextClinicalStep}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                      Evolução registrada
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--copy-strong)]">
                      {hasEvolution ? 'Sim, pronta para revisão' : 'Ainda pendente'}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                      Total previsto
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--copy-strong)]">
                      R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

              </div>
            </Card>
          </div>
        )}

        {activeTab === 'odontogram' && (
          <Card variant="gradient" className="rounded-[1.75rem]">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Smile size={18} className="text-[var(--color-primary-700)]" />
                Odontograma clínico interativo
              </Card.Title>
            </Card.Header>
            <Odontogram teethData={teethData} onToothClick={handleToothClick} />
          </Card>
        )}

        {activeTab === 'evolution' && (
          <Card variant="gradient" className="rounded-[1.75rem]">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <FileText size={18} className="text-[var(--color-primary-700)]" />
                Evolução clínica
              </Card.Title>
            </Card.Header>
            <textarea
              className="min-h-[280px] w-full rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-5 py-4 text-sm leading-7 text-[var(--copy-strong)] outline-none transition-all duration-150 placeholder:text-[var(--copy-soft)] focus:border-[var(--color-primary-500)] focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-panel)]"
              placeholder="Descreva o atendimento, os principais achados, a conduta executada e as orientações de acompanhamento..."
              value={evolutionText}
              onChange={(event) => setEvolutionText(event.target.value)}
            />
          </Card>
        )}

        {activeTab === 'billing' && (
          <Card variant="gradient" className="rounded-[1.75rem]">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Wallet size={18} className="text-[var(--color-primary-700)]" />
                Procedimentos e conclusão
              </Card.Title>
            </Card.Header>

            <form onSubmit={handleFinish} className="space-y-4">
              {proceduresList.map((procedure) => (
                <div
                  key={procedure.id}
                  className="grid gap-4 rounded-[1.5rem] border border-[var(--border-soft)] bg-white p-4 shadow-[var(--shadow-sm)] xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)_180px_auto]"
                >
                  <Select
                    required
                    value={procedure.category}
                    onChange={(event) => handleProcedureChange(procedure.id, 'category', event.target.value)}
                    label="Categoria"
                  >
                    <option value="">Selecione a categoria...</option>
                    {Object.keys(PROCEDURES).map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Select>

                  <Select
                    required
                    value={procedure.procedure}
                    onChange={(event) => handleProcedureChange(procedure.id, 'procedure', event.target.value)}
                    disabled={!procedure.category}
                    label="Procedimento"
                  >
                    <option value="">Selecione o procedimento...</option>
                    {procedure.category && PROCEDURES[procedure.category].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </Select>

                  <Input
                    type="number"
                    step="0.01"
                    required
                    label="Valor (R$)"
                    placeholder="0,00"
                    value={procedure.price}
                    onChange={(event) => handleProcedureChange(procedure.id, 'price', event.target.value)}
                  />

                  <div className="flex items-end justify-end">
                    {proceduresList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProcedure(procedure.id)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700"
                        aria-label="Remover procedimento"
                      >
                        <MinusCircle size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--border-soft)] bg-[rgba(255,252,247,0.88)] p-4 shadow-[var(--shadow-sm)] lg:flex-row lg:items-center lg:justify-between">
                <Button type="button" variant="ghost" onClick={handleAddProcedure} icon={PlusCircle}>
                  Adicionar procedimento
                </Button>
                <div className="text-left lg:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                    Valor total do atendimento
                  </p>
                  <p className="mt-2 text-3xl font-black text-[var(--copy-strong)]">
                    R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--border-soft)] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={onCancelAttendance} icon={LayoutDashboard}>
                  Voltar ao painel
                </Button>
                <Button type="submit" size="lg" icon={CheckCircle2} loading={isSubmitting} disabled={isSubmitting}>
                  {isSubmitting ? 'Concluindo sessão...' : 'Encerrar e faturar'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedTooth)}
        onClose={() => setSelectedTooth(null)}
        title={`Marcar status do dente ${selectedTooth}`}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.entries(colors.tooth).map(([id, { label }]) => (
              <Button key={id} variant="secondary" onClick={() => handleSaveTooth(id)}>
                {label}
              </Button>
            ))}
          </div>
          <textarea
            rows="4"
            value={toothNote}
            onChange={(event) => setToothNote(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-4 py-3 text-sm text-[var(--copy-strong)] outline-none transition-all duration-150 placeholder:text-[var(--copy-soft)] focus:border-[var(--color-primary-500)] focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-panel)]"
            placeholder="Adicionar observações clínicas sobre este dente..."
          />
        </div>
      </Modal>
    </>
  );
};

export default AttendanceSessionView;
