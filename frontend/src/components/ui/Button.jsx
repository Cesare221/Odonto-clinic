import { forwardRef } from 'react';

// =============================================================================
// COMPONENTS/UI/BUTTON.JSX - FRONTEND - Botao reutilizavel com variantes
// Design system consistente com o visual premium do projeto
// =============================================================================

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  icon: Icon,
  ...props
}, ref) => {
  const baseStyle = `
    inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold
    transition-all duration-200 cursor-pointer
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]
    focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-panel)]
    disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none
  `;

  const variants = {
    primary: `
      border border-transparent text-white shadow-[var(--shadow-sm)]
      bg-[linear-gradient(135deg,var(--color-primary-600),var(--color-primary-800))]
      hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] active:translate-y-0
    `,
    secondary: `
      border border-[var(--border-soft)] bg-[var(--surface-panel)] text-[var(--copy-strong)]
      shadow-[var(--shadow-sm)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel-strong)]
    `,
    danger: `
      border border-transparent text-white shadow-[var(--shadow-sm)]
      bg-[linear-gradient(135deg,#c65d52,#8c352e)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
    `,
    success: `
      border border-transparent text-white shadow-[var(--shadow-sm)]
      bg-[linear-gradient(135deg,#3f8a5f,#275c3f)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
    `,
    warning: `
      border border-transparent text-white shadow-[var(--shadow-sm)]
      bg-[linear-gradient(135deg,#c79235,#87591e)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
    `,
    ghost: `
      border border-transparent bg-transparent text-[var(--copy-body)]
      hover:bg-[var(--surface-panel-soft)] hover:text-[var(--copy-strong)]
    `,
    outline: `
      border border-[var(--border-strong)] bg-transparent text-[var(--color-primary-700)]
      hover:border-[var(--color-primary-400)] hover:bg-[var(--surface-tint)]
    `,
  };

  const sizes = {
    sm: 'min-h-[2.25rem] px-3.5 py-2 text-xs',
    md: 'min-h-[2.75rem] px-5 py-2.5 text-sm',
    lg: 'min-h-[3.125rem] px-6 py-3 text-base',
    xl: 'min-h-[3.5rem] px-7 py-3.5 text-lg',
  };

  return (
    <button
      ref={ref}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {Icon && !loading && <Icon size={18} />}
      {children}
    </button>
  );
});

export default Button;
