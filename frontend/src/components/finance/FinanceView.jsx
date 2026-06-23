import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Button from '../ui/Button';

const isDateInPeriod = (dateStr, period) => {
  const date = new Date(dateStr);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  if (period === 'daily') {
    return date >= startOfToday && date <= endOfToday;
  }

  if (period === 'weekly') {
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(startOfToday.getDate() - 7);
    return date >= sevenDaysAgo && date <= endOfToday;
  }

  if (period === 'monthly') {
    return date.getMonth() === startOfToday.getMonth() && date.getFullYear() === startOfToday.getFullYear();
  }

  return true;
};

const formatCurrency = (value) => (
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
);

const periodLabels = {
  daily: 'Hoje',
  weekly: '7 dias',
  monthly: 'Este mês',
  all: 'Tudo',
};

const FinanceView = ({
  transactions = [],
  loading = false,
  canDeleteTransaction = false,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [period, setPeriod] = useState('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTrans, setNewTrans] = useState({
    description: '',
    value: '',
    type: 'receita',
    date: new Date().toISOString().split('T')[0],
  });

  const stats = useMemo(() => {
    const filtered = transactions
      .filter((transaction) => isDateInPeriod(transaction.date, period))
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

    const receitas = filtered
      .filter((transaction) => transaction.type === 'receita')
      .reduce((acc, transaction) => acc + Number(transaction.value || 0), 0);
    const despesas = filtered
      .filter((transaction) => transaction.type === 'despesa')
      .reduce((acc, transaction) => acc + Number(transaction.value || 0), 0);

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      filteredList: filtered,
      receiptsCount: filtered.filter((transaction) => transaction.type === 'receita').length,
      expenseCount: filtered.filter((transaction) => transaction.type === 'despesa').length,
    };
  }, [period, transactions]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!newTrans.description || !newTrans.value) {
      return;
    }

    setIsSubmitting(true);
    const result = await onAddTransaction({
      ...newTrans,
      value: Number(newTrans.value),
    });
    setIsSubmitting(false);

    if (!result?.success) {
      return;
    }

    setNewTrans({
      description: '',
      value: '',
      type: 'receita',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const statCards = [
    {
      label: 'Receitas',
      value: formatCurrency(stats.receitas),
      icon: TrendingUp,
      accent: 'from-emerald-500 to-emerald-700',
      badge: 'Entrada',
      badgeTone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    {
      label: 'Despesas',
      value: formatCurrency(stats.despesas),
      icon: TrendingDown,
      accent: 'from-rose-500 to-rose-700',
      badge: 'Saída',
      badgeTone: 'border-rose-200 bg-rose-50 text-rose-800',
    },
    {
      label: 'Saldo líquido',
      value: formatCurrency(stats.saldo),
      icon: Wallet,
      accent: 'from-[var(--color-primary-600)] to-[var(--color-primary-800)]',
      badge: stats.saldo >= 0 ? 'Saudável' : 'Atenção',
      badgeTone: stats.saldo >= 0
        ? 'border-[var(--color-primary-200)] bg-[var(--surface-tint)] text-[var(--color-primary-800)]'
        : 'border-amber-200 bg-amber-50 text-amber-800',
    },
  ];

  return (
    <div className="mx-auto flex min-w-0 max-w-7xl flex-col gap-5 sm:gap-6">
      <section className="page-shell-panel rounded-[1.75rem] p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {['daily', 'weekly', 'monthly', 'all'].map((value) => {
            const active = period === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-[var(--color-primary-700)] bg-[var(--color-primary-700)] text-white'
                    : 'border-[var(--border-soft)] bg-white text-[var(--copy-muted)] hover:border-[var(--border-strong)] hover:text-[var(--copy-strong)]'
                }`}
              >
                {periodLabels[value]}
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-700)]">
            Sincronizando dados financeiros do servidor
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, accent, badge, badgeTone }) => (
          <div key={label} className="rounded-[1.75rem] border border-[var(--border-soft)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-[var(--shadow-sm)]`}>
                <Icon size={20} />
              </div>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone}`}>
                {badge}
              </span>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--copy-muted)]">
              {label}
            </p>
            <p className={`mt-2 break-words text-2xl font-black sm:text-3xl ${label === 'Saldo líquido' && stats.saldo < 0 ? 'text-rose-700' : 'text-[var(--copy-strong)]'}`}>
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[rgba(255,252,247,0.88)] p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--copy-muted)]">
              Lançamento rápido
            </p>
            <h3 className="mt-2 text-xl font-bold text-[var(--copy-strong)]">
              Nova movimentação
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--copy-strong)]">Descrição</label>
              <input
                required
                value={newTrans.description}
                onChange={(event) => setNewTrans({ ...newTrans, description: event.target.value })}
                className="w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-[var(--copy-strong)] outline-none transition-all placeholder:text-[var(--copy-soft)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary-500)] focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                placeholder="Ex.: consulta particular, material clínico, laboratório"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--copy-strong)]">Valor (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={newTrans.value}
                  onChange={(event) => setNewTrans({ ...newTrans, value: event.target.value })}
                  className="w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-[var(--copy-strong)] outline-none transition-all placeholder:text-[var(--copy-soft)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary-500)] focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--copy-strong)]">Data</label>
                <input
                  required
                  type="date"
                  value={newTrans.date}
                  onChange={(event) => setNewTrans({ ...newTrans, date: event.target.value })}
                  className="w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-[var(--copy-strong)] outline-none transition-all hover:border-[var(--border-strong)] focus:border-[var(--color-primary-500)] focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--copy-strong)]">Tipo da movimentação</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setNewTrans({ ...newTrans, type: 'receita' })}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    newTrans.type === 'receita'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-[var(--border-soft)] bg-white text-[var(--copy-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setNewTrans({ ...newTrans, type: 'despesa' })}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    newTrans.type === 'despesa'
                      ? 'border-rose-500 bg-rose-50 text-rose-800'
                      : 'border-[var(--border-soft)] bg-white text-[var(--copy-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  Despesa
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" icon={Plus} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando movimentação...' : 'Salvar movimentação'}
            </Button>
          </form>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border-soft)] bg-white shadow-[var(--shadow-md)]">
          <div className="border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,252,247,0.94),rgba(248,241,231,0.82))] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--copy-muted)]">
                  Extrato do período
                </p>
                <h3 className="mt-2 flex items-center gap-2 text-xl font-bold text-[var(--copy-strong)]">
                  <ClipboardList size={18} className="text-[var(--color-primary-700)]" />
                  Movimentações financeiras
                </h3>
              </div>
              <span className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--copy-muted)]">
                {stats.filteredList.length} lançamento(s)
              </span>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto px-5 py-5 sm:px-6">
            {stats.filteredList.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-6 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[var(--color-primary-700)] shadow-[var(--shadow-sm)]">
                  <ClipboardList size={24} />
                </div>
                <p className="mt-5 text-base font-semibold text-[var(--copy-strong)]">
                  Nenhuma movimentação neste recorte
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.filteredList.map((transaction) => {
                  const isIncome = transaction.type === 'receita';
                  const DirectionIcon = isIncome ? ArrowUpRight : ArrowDownRight;

                  return (
                    <div
                      key={transaction.id}
                      className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,253,249,0.98),rgba(248,242,231,0.92))] p-4 shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              isIncome
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-rose-200 bg-rose-50 text-rose-800'
                            }`}>
                              <DirectionIcon size={13} />
                              {isIncome ? 'Receita' : 'Despesa'}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-white/82 px-2.5 py-1 text-xs font-medium text-[var(--copy-muted)]">
                              {new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </span>
                          </div>

                          <p className="mt-3 text-base font-semibold text-[var(--copy-strong)]">
                            {transaction.description}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="rounded-2xl border border-[var(--border-soft)] bg-white/84 px-4 py-3 text-left sm:text-right">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                              Valor
                            </p>
                            <p className={`mt-1 text-base font-semibold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isIncome ? '+' : '-'}{formatCurrency(transaction.value)}
                            </p>
                          </div>

                          {canDeleteTransaction ? (
                            <button
                              type="button"
                              onClick={() => onDeleteTransaction(transaction.id)}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700"
                              title="Excluir movimentação"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <span className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FinanceView;
