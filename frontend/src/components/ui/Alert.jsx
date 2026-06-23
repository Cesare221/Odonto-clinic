import { AlertCircle, CheckCircle2, XCircle, Info, X } from 'lucide-react';

// =============================================================================
// COMPONENTS/UI/ALERT.JSX - FRONTEND - Alerta com tipos e variantes
// Design premium com ícones apropriados e animações
// =============================================================================

const Alert = ({ 
  type = 'info', 
  message, 
  description,
  onDismiss,
  className = ''
}) => {
  const config = {
    info: { 
      bg: 'bg-blue-50', 
      border: 'border-blue-200', 
      text: 'text-blue-800',
      icon: Info,
      iconBg: 'bg-blue-100',
    },
    success: { 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-200', 
      text: 'text-emerald-800',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100',
    },
    error: { 
      bg: 'bg-red-50', 
      border: 'border-red-200', 
      text: 'text-red-800',
      icon: XCircle,
      iconBg: 'bg-red-100',
    },
    warning: { 
      bg: 'bg-amber-50', 
      border: 'border-amber-200', 
      text: 'text-amber-800',
      icon: AlertCircle,
      iconBg: 'bg-amber-100',
    },
  };

  const { bg, border, text, icon: Icon, iconBg } = config[type];
  const IconComponent = Icon;

  return (
    <div className={`${bg} ${border} border rounded-xl p-4 ${className} animate-fade-in`}>
      <div className="flex items-start gap-3">
        <div className={`${iconBg} p-2 rounded-lg shrink-0`}>
          <IconComponent size={20} className={text} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${text}`}>{message}</p>
          {description && (
            <p className={`text-sm mt-1 ${text} opacity-80`}>{description}</p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${text} hover:opacity-70 transition-opacity cursor-pointer shrink-0`}
            aria-label="Fechar alerta"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
