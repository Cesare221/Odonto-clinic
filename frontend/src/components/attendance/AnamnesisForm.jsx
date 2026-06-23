import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ANAMNESES_QUESTIONS } from '../../constants';
import Input from '../ui/Input';

const buildInitialAnswers = () => Object.fromEntries(
  ANAMNESES_QUESTIONS.map((_, index) => [index, 'nao'])
);

const AnamnesisForm = ({ onAnamnesisChange }) => {
  const [answers, setAnswers] = useState(() => buildInitialAnswers());
  const [details, setDetails] = useState({});

  useEffect(() => {
    onAnamnesisChange({
      answers,
      details,
    });
  }, [answers, details, onAnamnesisChange]);

  const positiveCount = useMemo(
    () => Object.values(answers).filter((value) => value === 'sim').length,
    [answers]
  );

  const handleAnswerChange = (index, answer) => {
    setAnswers((previous) => ({ ...previous, [index]: answer }));

    if (answer === 'nao') {
      setDetails((previous) => {
        if (!(index in previous)) {
          return previous;
        }

        const next = { ...previous };
        delete next[index];
        return next;
      });
    }
  };

  const handleDetailChange = (index, detail) => {
    setDetails((previous) => ({ ...previous, [index]: detail }));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`rounded-[1.4rem] border p-4 shadow-[var(--shadow-sm)] ${
          positiveCount > 0
            ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle size={16} className={positiveCount > 0 ? 'text-amber-700' : 'text-emerald-700'} />
            Alertas ativos
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--copy-strong)]">{positiveCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {ANAMNESES_QUESTIONS.map((question, index) => {
          const answer = answers[index];
          const isPositive = answer === 'sim';

          return (
            <fieldset
              key={question}
              className={`rounded-[1.5rem] border p-4 shadow-[var(--shadow-sm)] ${
                isPositive
                  ? 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,249,239,1),rgba(255,244,224,0.96))]'
                  : 'border-[var(--border-soft)] bg-[var(--surface-panel-soft)]'
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <legend className="text-sm font-semibold leading-6 text-[var(--copy-strong)]">
                  {question}
                </legend>

                <div className="flex shrink-0 rounded-2xl border border-[var(--border-soft)] bg-white p-1">
                  <label
                    className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-[var(--ring-focus)] focus-within:ring-offset-2 focus-within:ring-offset-white ${
                      isPositive
                        ? 'bg-[var(--surface-tint)] text-[var(--color-primary-800)]'
                        : 'text-[var(--copy-muted)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`anamnesis-${index}`}
                      className="sr-only"
                      checked={isPositive}
                      onChange={() => handleAnswerChange(index, 'sim')}
                    />
                    Sim
                  </label>
                  <label
                    className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-[var(--ring-focus)] focus-within:ring-offset-2 focus-within:ring-offset-white ${
                      !isPositive
                        ? 'bg-[var(--surface-panel-strong)] text-[var(--copy-strong)]'
                        : 'text-[var(--copy-muted)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`anamnesis-${index}`}
                      className="sr-only"
                      checked={!isPositive}
                      onChange={() => handleAnswerChange(index, 'nao')}
                    />
                    Não
                  </label>
                </div>
              </div>

              {isPositive && (
                <div className="mt-4">
                  <Input
                    placeholder="Especifique o alerta, a condição ou a observação..."
                    value={details[index] || ''}
                    onChange={(event) => handleDetailChange(index, event.target.value)}
                  />
                </div>
              )}
            </fieldset>
          );
        })}
      </div>
    </div>
  );
};

export default AnamnesisForm;
