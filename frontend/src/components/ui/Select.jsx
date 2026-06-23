import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

// =============================================================================
// COMPONENTS/UI/SELECT.JSX - FRONTEND - Select reutilizável com design premium
// =============================================================================

const Select = forwardRef(({ 
  children, 
  className = '', 
  label,
  error,
  helperText,
  icon: Icon,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl border transition-colors duration-150
            outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-1
            appearance-none bg-white bg-no-repeat bg-right-3 bg-center
            cursor-pointer text-slate-800
            ${Icon ? 'pl-10' : ''}
            ${error 
              ? 'border-rose-300 focus:border-rose-500 bg-rose-50/40' 
              : 'border-slate-300 focus:border-primary-600 hover:border-slate-400'
            }
            ${className}
          `}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundSize: '16px',
          }}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={16} />
        </div>
      </div>
      {(error || helperText) && (
        <p className={`text-xs mt-1.5 ${error ? 'text-red-600' : 'text-slate-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default Select;
