import React from 'react';
import { UserRole, ViewState } from './types';
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  UserCircle,
  Settings,
  Lock,
  Inbox,
  FileText,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  Cloud,
  CloudOff,
  Gamepad2,
  Calendar,
  DollarSign,
  FileCheck
} from 'lucide-react';
import { UserAvatar } from './components/UserAvatar';
import { offlineService } from './services/offlineService';
import { SupabaseService } from './services/supabaseService';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void; // Kept for interface compatibility but won't be used for switching
  onLogout: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  userPhoto?: string;
  userName?: string;
  unreadMessagesCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onViewChange,
  role,
  onLogout,
  userPhoto,
  userName,
  unreadMessagesCount = 0
}) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = React.useState(0);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  // Load institutional logo
  React.useEffect(() => {
    const loadLogo = async () => {
      // Local check
      const cachedLogo = localStorage.getItem('educontrol_school_logo');
      if (cachedLogo) setLogoUrl(cachedLogo);

      // DB sync
      const dbLogo = await SupabaseService.getSetting('school_logo');
      if (dbLogo && dbLogo !== cachedLogo) {
        setLogoUrl(dbLogo);
        localStorage.setItem('educontrol_school_logo', dbLogo);
      }
    };
    loadLogo();
  }, []);

  // Pool local sync queue to display counter
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkQueue = async () => {
      const queue = await offlineService.getSyncQueue();
      setPendingSyncs(queue.length);
    };

    checkQueue();
    // Poll loosely
    const interval = setInterval(checkQueue, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Define allowed views per role
  const rolePermissions: Record<UserRole, ViewState[]> = {
    [UserRole.COORDINATOR]: ['DASHBOARD', 'CALENDAR', 'FINANCIAL', 'SIMULADO', 'COURSES', 'ADMIN', 'SETTINGS'],
    [UserRole.TEACHER]: ['DASHBOARD', 'CALENDAR', 'FINANCIAL', 'SIMULADO', 'COURSES', 'SETTINGS'],
    [UserRole.MONITOR]: ['DASHBOARD', 'SETTINGS'],
    [UserRole.STUDENT]: ['DASHBOARD', 'SIMULADO', 'CALENDAR', 'COURSES', 'SETTINGS'],
    [UserRole.PARENT]: ['DASHBOARD', 'CALENDAR', 'FINANCIAL', 'COURSES', 'SETTINGS'],
    [UserRole.GAME_STUDENT]: ['SIMULADO'],
  };

  const menuItems = [
    { view: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard' },
    { view: 'CALENDAR', icon: Calendar, label: 'Calendário' },
    { view: 'FINANCIAL', icon: DollarSign, label: 'Financeiro' },
    { view: 'SIMULADO', icon: FileCheck, label: 'Simulados' },
    { view: 'COURSES', icon: BookOpen, label: 'Cursos' },
    { view: 'WHITEBOARD', icon: FileText, label: 'Lousa Digital' },
  ] as const;

  const allowedViews = rolePermissions[role] || [];

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#111029] border-r border-gray-800 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-2 overflow-hidden shadow-lg selection:bg-transparent">
              <img src={logoUrl || "/coc-logo.png"} alt="School Logo" className="w-full h-full object-contain scale-110" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">
                JF EduControl
              </h1>
              <span className="text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase">Aulas Particulares</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Offline Indicator Alert Block */}
        {!isOnline && (
          <div className="m-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-500">
              <CloudOff size={18} />
              <span className="font-bold text-sm tracking-wide">Modo Offline</span>
            </div>
            <p className="text-xs text-amber-400/80 leading-tight">
              Ações serão refletidas no banco quando a internet retornar.
            </p>
            {pendingSyncs > 0 && (
              <div className="mt-1 bg-amber-500/20 text-amber-500 text-xs font-bold px-2 py-1 rounded-md w-fit">
                {pendingSyncs} pendente(s)
              </div>
            )}
          </div>
        )}

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">
            Menu {role === UserRole.COORDINATOR ? 'Coordenador' : role === UserRole.TEACHER ? 'Professor' : role === UserRole.GAME_STUDENT ? 'Aluno' : 'Monitor'}
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              if (!allowedViews.includes(item.view)) return null;
              const active = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    onViewChange(item.view);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${active
                    ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
                    }`}
                >
                  {active && (
                    <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full" />
                  )}
                  <item.icon className={`transition-colors ${active ? 'text-emerald-400' : 'text-gray-400 group-hover:text-gray-200'}`} size={20} />
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}

            {/* Admin Link */}
            {role === UserRole.COORDINATOR && (
              <button
                onClick={() => {
                  onViewChange('ADMIN');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${currentView === 'ADMIN'
                  ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
                  }`}
              >
                <Settings size={20} className={currentView === 'ADMIN' ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="font-medium">Administração</span>
              </button>
            )}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800 bg-[#0d0c21]">
          {/* Settings Link */}
          <button
            onClick={() => {
              onViewChange('SETTINGS');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 mb-2 rounded-lg transition-all duration-200 group ${currentView === 'SETTINGS'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
          >
            <Lock size={16} />
            <span className="text-xs font-bold">Configurações</span>
          </button>

          <div className="flex items-center gap-3 mb-2 p-2">
            <UserAvatar
              name={userName || (role === UserRole.COORDINATOR ? 'Coordenador' : role === UserRole.TEACHER ? 'Professor' : 'Monitor')}
              photoUrl={userPhoto}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {userName || (role === UserRole.COORDINATOR ? 'Coordenação' : role === UserRole.TEACHER ? 'Professor(a)' : 'Monitor(a)')}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {role === UserRole.COORDINATOR ? 'Coordenador(a)' : role === UserRole.TEACHER ? 'Docente' : 'Monitoria'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="mt-2 flex items-center gap-2 w-full px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen bg-gray-900 relative print:h-auto print:overflow-visible print:bg-white">
        <header className="lg:hidden h-20 bg-[#111029] border-b border-gray-800 flex items-center px-4 justify-between z-30 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center p-1.5 overflow-hidden">
              <img src={logoUrl || "/coc-logo.png"} alt="School Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">JF <span className="text-emerald-500">EduControl</span></h1>
          </div>

          <div className="flex flex-1 justify-end items-center mr-4">
            {!isOnline && (
              <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                <CloudOff size={16} />
                <span className="text-xs font-bold">{pendingSyncs > 0 ? pendingSyncs : ''}</span>
              </div>
            )}
          </div>

          <button onClick={() => setSidebarOpen(true)} className="text-gray-400">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-6 relative scroll-smooth print:p-0 print:overflow-visible">
          {children}
        </div>
      </main>
    </div>
  );
};