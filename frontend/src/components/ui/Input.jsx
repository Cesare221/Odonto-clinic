import { forwardRef, useId } from 'react';

// =============================================================================
// COMPONENTS/UI/INPUT.JSX - FRONTEND - Input reutilizavel com design premium
// =============================================================================

const Input = forwardRef(({
  className = '',
  icon: Icon,
  error,
  label,
  helperText,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = props.id || props.name || `input-${generatedId.replace(/:/g, '')}`;
  const describedBy = error || helperText ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-[var(--copy-strong)]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--copy-soft)]">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={`
            w-full rounded-xl border px-4 py-3 text-sm text-[var(--copy-strong)]
            bg-[var(--surface-panel)] placeholder:text-[var(--copy-soft)]
            outline-none transition-all duration-200
            focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]
            focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-app)]
            disabled:cursor-not-allowed disabled:border-[var(--border-soft)]
            disabled:bg-[var(--surface-panel-soft)] disabled:text-[var(--copy-soft)]
            ${Icon ? 'pl-11' : ''}
            ${error
              ? 'border-[#d39b95] bg-[#fbefee] focus:border-[#ad453b]'
              : 'border-[var(--border-soft)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary-500)]'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p
          id={describedBy}
          className={`mt-1.5 text-xs ${error ? 'text-[#8c352e]' : 'text-[var(--copy-muted)]'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
