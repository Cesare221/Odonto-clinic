import { Menu, Search } from 'lucide-react';

const SEARCH_INPUT_ID = 'app-shell-context-search';

const Header = ({
  title,
  eyebrow,
  subtitle,
  searchPlaceholder,
  searchValue = '',
  onSearchChange,
  searchDisabled = false,
  onOpenMenu,
  isMenuOpen = false,
}) => {
  const handleChange = (event) => {
    onSearchChange?.(event.target.value);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(252,254,255,0.94),rgba(242,247,255,0.9))] backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-5 xl:px-12">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-expanded={isMenuOpen}
            className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white/86 text-[var(--copy-strong)] shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--border-strong)] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)]"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary-700)] sm:text-[11px] sm:tracking-[0.26em]">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-1 text-xl font-semibold text-[var(--copy-strong)] sm:mt-2 sm:text-[2rem]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--copy-muted)] sm:mt-2 sm:text-[0.95rem]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[24rem] lg:min-w-[20rem]">
          <label
            htmlFor={SEARCH_INPUT_ID}
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--copy-soft)]"
          >
            Busca contextual
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--copy-soft)] transition-colors" size={18} />
            <input
              id={SEARCH_INPUT_ID}
              type="text"
              placeholder={searchPlaceholder || 'Buscar paciente, documento...'}
              value={searchValue}
              onChange={handleChange}
              disabled={searchDisabled}
              className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] py-3 pl-11 pr-10 text-sm font-medium text-[var(--copy-strong)] outline-none transition-all duration-150 placeholder:text-[var(--copy-soft)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary-500)] focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] disabled:cursor-not-allowed disabled:border-[var(--border-soft)] disabled:bg-[var(--surface-panel-soft)] disabled:text-[var(--copy-soft)]"
            />
            {searchValue && !searchDisabled && (
              <button
                onClick={() => {
                  onSearchChange?.('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-slate-400 transition-colors hover:text-slate-600"
                aria-label="Limpar busca"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
