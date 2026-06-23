import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({
  user,
  children,
  currentView,
  onNavigate,
  onLogout,
  isAttending,
  searchValue,
  onSearchChange,
  searchDisabled,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    const savedValue = window.localStorage.getItem('app-shell-desktop-menu-open');
    return savedValue !== 'false';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('app-shell-desktop-menu-open', String(isDesktopMenuOpen));
  }, [isDesktopMenuOpen]);

  const handleNavigate = (nextView) => {
    const didNavigate = onNavigate?.(nextView);

    if (didNavigate !== false) {
      setIsMobileMenuOpen(false);
    }

    return didNavigate;
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    onLogout?.();
  };

  const handleMenuToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsDesktopMenuOpen((current) => !current);
      return;
    }

    setIsMobileMenuOpen((current) => !current);
  };
  const isCurrentMenuOpen = typeof window !== 'undefined' && window.innerWidth >= 1024
    ? isDesktopMenuOpen
    : isMobileMenuOpen;

  const currentPage = {
    dashboard: {
      title: 'Dashboard',
      eyebrow: 'Visão operacional',
      subtitle: '',
      searchPlaceholder: 'Buscar paciente, indicador ou atalho...',
    },
    calendar: {
      title: 'Agenda',
      eyebrow: 'Fluxo assistencial',
      subtitle: '',
      searchPlaceholder: 'Buscar paciente, horário ou profissional...',
    },
    new_patient: {
      title: 'Cadastro de Novo Paciente',
      eyebrow: 'Relacionamento',
      subtitle: '',
      searchPlaceholder: 'Buscar paciente, telefone ou documento...',
    },
    patients: {
      title: 'Pacientes',
      eyebrow: 'Base de pacientes',
      subtitle: '',
      searchPlaceholder: 'Buscar paciente, documento ou contato...',
    },
    confirmations: {
      title: 'Confirmações',
      eyebrow: 'Contato ativo',
      subtitle: '',
      searchPlaceholder: 'Buscar paciente, status ou mensagem...',
    },
    finance: {
      title: 'Gestão Financeira',
      eyebrow: 'Saúde do negócio',
      subtitle: '',
      searchPlaceholder: 'Buscar paciente, lançamento ou forma de pagamento...',
    },
    users: {
      title: 'Gestão de Usuários',
      eyebrow: 'Governança',
      subtitle: '',
      searchPlaceholder: 'Buscar usuário, perfil ou permissão...',
    },
    attendance: {
      title: 'Atendimento',
      eyebrow: 'Sessão clínica',
      subtitle: '',
      searchPlaceholder: 'Buscar paciente, procedimento ou observação...',
    },
  }[currentView] || {
    title: 'Painel',
    eyebrow: 'Operação',
    subtitle: '',
    searchPlaceholder: 'Buscar paciente, agenda ou documento...',
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(147,184,251,0.18),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_var(--surface-app)_46%,_#eaf1fb_100%)] font-sans">
      <Sidebar
        user={user}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isAttending={isAttending}
        isDesktopOpen={isDesktopMenuOpen}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-x-hidden bg-[rgba(255,255,255,0.18)]">
        {!isAttending && (
          <div className="animate-fade-in">
            <Header
              title={currentPage.title}
              eyebrow={currentPage.eyebrow}
              subtitle={currentPage.subtitle}
              searchPlaceholder={currentPage.searchPlaceholder}
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              searchDisabled={searchDisabled}
              onOpenMenu={handleMenuToggle}
              isMenuOpen={isCurrentMenuOpen}
            />
          </div>
        )}
        {isAttending && (
          <div className="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(252,254,255,0.96),rgba(242,247,255,0.92))] px-3 py-3 backdrop-blur-xl lg:hidden">
            <button
              type="button"
              onClick={handleMenuToggle}
              aria-expanded={isCurrentMenuOpen}
              aria-label={isCurrentMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white/90 text-[var(--copy-strong)] shadow-[var(--shadow-sm)]"
            >
              <Menu size={20} />
            </button>
          </div>
        )}
        <div className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-9 lg:py-8 xl:px-10 xl:py-9 2xl:px-12 2xl:py-10">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
