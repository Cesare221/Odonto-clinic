// =============================================================================
// COMPONENTS/UI/CARD.JSX - FRONTEND - Card base para conteudo
// Design modernizado com sombras elegantes e bordas sutis
// =============================================================================

const Card = ({ children, className = '', variant = 'default', hover = false, ...props }) => {
  const variants = {
    default: 'bg-[var(--surface-panel)] border-[var(--border-soft)] shadow-[var(--shadow-sm)]',
    elevated: 'bg-[var(--surface-panel)] border-[var(--border-soft)] shadow-[var(--shadow-md)]',
    bordered: 'bg-[var(--surface-panel)] border-[var(--color-primary-200)] shadow-[var(--shadow-sm)]',
    gradient: 'border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.94))] shadow-[var(--shadow-sm)]',
  };

  return (
    <div
      className={`
        rounded-2xl border p-6 transition-all duration-300
        ${variants[variant]}
        ${hover ? 'hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lg)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-5 border-b border-[var(--border-soft)] pb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-[var(--copy-strong)] ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`mt-1 text-sm text-[var(--copy-muted)] ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-5 flex items-center gap-3 border-t border-[var(--border-soft)] pt-4 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
