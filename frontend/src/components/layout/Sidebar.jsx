import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Shield,
  Stethoscope,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist'] },
  { id: 'calendar', label: 'Agenda', icon: CalendarIcon, roles: ['admin', 'doctor', 'receptionist'] },
  { id: 'new_patient', label: 'Novo Paciente', icon: UserPlus, roles: ['admin', 'doctor', 'receptionist'] },
  { id: 'patients', label: 'Pacientes', icon: Users, roles: ['admin', 'doctor', 'receptionist'] },
  { id: 'confirmations', label: 'Confirmacoes', icon: CheckCircle2, roles: ['admin', 'doctor', 'receptionist'] },
  { id: 'finance', label: 'Financeiro', icon: Wallet, roles: ['admin', 'doctor'] },
  { id: 'users', label: 'Usuarios', icon: Shield, roles: ['admin'] },
];

const roleDisplayName = {
  admin: 'Administrador(a)',
  doctor: 'Dentista',
  receptionist: 'Recepcionista',
};

const SidebarContent = ({
  user,
  currentView,
  onNavigate,
  onLogout,
  isAttending,
  onMobileClose,
  showCloseButton = false,
}) => (
  <>
    <div className="flex items-start gap-3 border-b border-white/10 px-5 py-5 sm:px-6 sm:py-6">
      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,rgba(85,147,231,1),rgba(21,67,132,1))] shadow-[0_18px_36px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
        <Stethoscope className="text-white" size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold tracking-[0.01em] text-white">CliniDent</h1>
      </div>
      {showCloseButton && (
        <button
          type="button"
          onClick={onMobileClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-slate-200 transition-colors hover:bg-white/[0.09] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      )}
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
      <div className="px-3 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Menu principal</p>
      </div>

      <nav className="space-y-1.5">
        {navItems.filter((item) => item.roles.includes(user?.role)).map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate?.(item.id);
              onMobileClose?.(); // Fecha o menu mobile automaticamente
            }}
            className={`group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 ${
              currentView === item.id
                ? 'border-sky-200/20 bg-[linear-gradient(135deg,rgba(130,182,255,0.2),rgba(255,255,255,0.08))] text-white shadow-[0_18px_30px_-22px_rgba(0,0,0,0.9)]'
                : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.045] hover:text-white'
            }`}
            aria-current={currentView === item.id ? 'page' : undefined}
          >
            <item.icon
              size={18}
              className={`shrink-0 transition-colors ${
                currentView === item.id ? 'text-sky-100' : 'text-slate-500 group-hover:text-slate-200'
              }`}
            />
            <span className="text-sm font-medium tracking-[0.01em]">{item.label}</span>
            {currentView === item.id && (
              <span className="ml-auto h-2 w-2 rounded-full bg-sky-200 shadow-[0_0_0_4px_rgba(125,179,255,0.14)]" aria-hidden="true" />
            )}
          </button>
        ))}
      </nav>

      {isAttending && (
        <div className="mt-6 rounded-2xl border border-sky-300/15 bg-sky-200/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sky-200">
            <AlertCircle size={16} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Sessao ativa</span>
          </div>
          <p className="text-sm text-sky-50/90">Existe um atendimento em andamento.</p>
          <p className="mt-1 text-xs text-sky-100/70">Trocas de tela continuam protegidas pelo alerta atual.</p>
        </div>
      )}
    </div>

    <div className="border-t border-white/10 p-4">
      <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,rgba(85,147,231,1),rgba(21,67,132,1))] text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.8)]">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold text-white">{user?.name || 'Usuario'}</p>
            <p className="truncate text-xs text-slate-400">{roleDisplayName[user?.role] || 'Usuario'}</p>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          onLogout();
          onMobileClose?.(); // Fecha o menu mobile ao fazer logout
        }}
        className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3.5 py-3 text-rose-300 transition-all duration-150 hover:border-rose-200/10 hover:bg-rose-200/10 hover:text-rose-100"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">Sair do Sistema</span>
      </button>
    </div>
  </>
);

const Sidebar = ({
  user,
  currentView,
  onNavigate,
  onLogout,
  isAttending,
  isDesktopOpen = true,
  isMobileOpen = false,
  onMobileClose,
}) => {
  return (
    <>
      <aside
        className={`sticky top-0 z-20 hidden h-screen shrink-0 self-start border-r border-white/10 text-slate-200 shadow-[24px_0_60px_-38px_rgba(3,12,25,0.82)] transition-all duration-200 lg:flex ${isDesktopOpen ? 'w-72 opacity-100' : 'w-0 overflow-hidden border-r-0 opacity-0 shadow-none'}`}
      >
        <div className={`flex h-full w-72 flex-col bg-[radial-gradient(circle_at_top,_rgba(110,170,255,0.22),_transparent_24%),linear-gradient(180deg,_rgba(7,18,33,0.99)_0%,_rgba(9,26,47,0.98)_36%,_rgba(14,40,70,0.98)_100%)] transition-opacity duration-150 ${isDesktopOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <SidebarContent
            user={user}
            currentView={currentView}
            onNavigate={onNavigate}
            onLogout={onLogout}
            isAttending={isAttending}
          />
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 transition lg:hidden ${isMobileOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}
        role="presentation"
        aria-hidden={!isMobileOpen}
      >
          <button
            type="button"
            className={`absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm transition-opacity duration-200 ${isMobileOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onMobileClose}
            aria-label="Fechar menu"
          />
          <aside
            className={`relative flex min-h-screen h-full w-[min(21rem,88vw)] flex-col border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(110,170,255,0.22),_transparent_24%),linear-gradient(180deg,_rgba(7,18,33,0.99)_0%,_rgba(9,26,47,0.98)_36%,_rgba(14,40,70,0.98)_100%)] text-slate-200 shadow-[24px_0_60px_-30px_rgba(3,12,25,0.72)] transition-transform duration-200 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
          >
            <SidebarContent
              user={user}
              currentView={currentView}
              onNavigate={onNavigate}
              onLogout={onLogout}
              isAttending={isAttending}
              onMobileClose={onMobileClose}
              showCloseButton
            />
          </aside>
      </div>
    </>
  );
};

export default Sidebar;
