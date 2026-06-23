import { DENTAL_ARCH, colors } from '../../constants';

const Tooth = ({ number, status, onClick }) => {
  const { color, bg, border } = colors.tooth[status] || colors.tooth.saudavel;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl bg-transparent p-1 transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-panel)]"
      aria-label={`Dente ${number} - ${status}`}
    >
      <svg
        width="50"
        height="58"
        viewBox="0 0 48 56"
        className="drop-shadow-[0_12px_24px_rgba(17,33,29,0.08)] transition-transform duration-200 group-hover:scale-105"
      >
        <path
          d="M10 4C4 4 4 10 4 10V46C4 52 10 52 10 52H38C44 52 44 46 44 46V10C44 4 38 4 38 4H10Z"
          fill={bg}
          stroke={border}
          strokeWidth="2"
        />
        <path
          d="M10 12C16 12 32 12 38 12"
          stroke={border}
          strokeWidth="1.5"
        />
        <text x="24" y="36" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>
          {number}
        </text>
      </svg>
    </button>
  );
};

const Odontogram = ({ teethData, onToothClick }) => {
  const renderArch = (arch) => (
    <div className="flex gap-1.5">
      {arch.map((toothNumber) => (
        <Tooth
          key={toothNumber}
          number={toothNumber}
          status={teethData[toothNumber]?.status || 'saudavel'}
          onClick={() => onToothClick(toothNumber)}
        />
      ))}
    </div>
  );

  const touchedTeeth = Object.keys(teethData).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.4rem] border border-[var(--border-soft)] bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
            Dentes atualizados
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--copy-strong)]">{touchedTeeth}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1.75rem] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,253,249,0.98),rgba(248,242,231,0.94))] p-5 shadow-[var(--shadow-sm)]">
        <div className="mx-auto flex w-max flex-col items-center gap-5">
          <div className="flex items-center gap-3">
            {renderArch(DENTAL_ARCH.upperRight)}
            <div className="mx-2 h-12 w-px bg-[var(--border-strong)]" />
            {renderArch(DENTAL_ARCH.upperLeft)}
          </div>

          <div className="flex items-center gap-3">
            {renderArch(DENTAL_ARCH.lowerRight)}
            <div className="mx-2 h-12 w-px bg-[var(--border-strong)]" />
            {renderArch(DENTAL_ARCH.lowerLeft)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4">
        {Object.entries(colors.tooth).map(([id, { label, bg, border, color }]) => (
          <div key={id} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-2 text-xs font-medium shadow-[var(--shadow-sm)]">
            <span
              className="h-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: bg, border: `1px solid ${border}` }}
            />
            <span style={{ color }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Odontogram;
