import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { AdminPanel } from './AdminPanel';
import { Settings as SettingsView } from './Settings';
import { PortalDashboard } from './PortalDashboard';
import { UpdatePassword } from './UpdatePassword';
import { GameArena } from './components/Game/GameArena';
import { CalendarView } from './CalendarView';
import { FinancialView } from './FinancialView';
import { SimuladoView } from './SimuladoView';
import { CoursesView } from './CoursesView';
import { Whiteboard } from './Whiteboard';
import { FinanceView } from './FinanceView';
import { UserRole, ViewState, AppModule } from './types';
import { ErrorBoundary } from './ErrorBoundary';

import { supabase } from './supabaseClient';
import { SupabaseService } from './services/supabaseService';
import { offlineService } from './services/offlineService';

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [activeModule, setActiveModule] = useState<AppModule>('TUTORING');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [toast, setToast] = useState<{ msg: string, visible: boolean }>({ msg: '', visible: false });
  const [isRecovering, setIsRecovering] = useState(false);
  const [activeWhiteboardContext, setActiveWhiteboardContext] = useState<{ classId: string; disciplineId: string } | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);

  // Theme Init
  useEffect(() => {
    // 1. Theme Init
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }

    // 2. Session Restore from LocalStorage
    const storedRole = localStorage.getItem('educontrol_role');
    const storedEmail = localStorage.getItem('educontrol_email');
    const storedId = localStorage.getItem('educontrol_user_id');
    const storedName = localStorage.getItem('educontrol_name');
    const storedPhoto = localStorage.getItem('educontrol_photo');
    const storedView = localStorage.getItem('educontrol_view');
    const storedModule = localStorage.getItem('educontrol_module');

    if (storedRole && storedEmail) {
      setUserRole(storedRole as UserRole);
      setUserEmail(storedEmail);
      if (storedId) setUserId(storedId);
      if (storedName) setUserName(storedName);
      if (storedPhoto) setUserPhoto(storedPhoto);
      setIsAuthenticated(true);

      // Restore view if stored, otherwise use role-based default
      if (storedModule) {
        setActiveModule(storedModule as AppModule);
      }
      if (storedView) {
        setCurrentView(storedView as ViewState);
      } else {
        if (storedRole === UserRole.COORDINATOR) setCurrentView('DASHBOARD');
        else if (storedRole === UserRole.TEACHER) setCurrentView('DASHBOARD');
        else if (storedRole === UserRole.STUDENT || storedRole === UserRole.PARENT) setCurrentView('DASHBOARD');
        else setCurrentView('DASHBOARD');
      }
    }

    // 3. Listen for Auth Events (Password Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
  };

  useEffect(() => {
    if (isAuthenticated && userEmail && userRole) {
      SupabaseService.getUnreadMessagesCount(userEmail, userRole).then(setUnreadCount);
      // Carregar dados auxiliares para simulados
      SupabaseService.getStudents().then(setStudents);
      SupabaseService.getDisciplines().then(setDisciplines);
    }
  }, [isAuthenticated, userEmail, userRole, currentView]);

  // Handle Background Sync for Offline actions
  useEffect(() => {
    const processSyncQueue = async () => {
      if (!isAuthenticated || !offlineService.isOnline()) return;

      const queue = await offlineService.getSyncQueue();
      if (queue.length === 0) return;

      let successCount = 0;
      let errorCount = 0;

      for (const item of queue) {
        try {
          if (item.feature === 'occurrence' && item.operation === 'POST') {
            await SupabaseService.saveOccurrence(item.data);
          } else if (item.feature === 'comunicado' && item.operation === 'POST') {
            await SupabaseService.createMessage(item.data);
          } else if (item.feature === 'frequence' && item.operation === 'POST') {
            await SupabaseService.saveSession(item.data.session, item.data.userEmail);
          }
          await offlineService.removeFromSyncQueue(item.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync item ${item.id}`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        showToast(`Sincronização concluída: ${successCount} item(ns) enviado(s)`);
      }
      if (errorCount > 0) {
        showToast(`Falha ao sincronizar ${errorCount} item(ns). Verifique sua rede.`);
      }
    };

    const handleOnline = () => {
      showToast('Conexão restabelecida. Verificando dados pendentes...');
      processSyncQueue();
    };

    window.addEventListener('online', handleOnline);
    processSyncQueue(); // Attempt on load

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isAuthenticated]);

  const handleLogin = (role: UserRole, email: string, name?: string, photoUrl?: string, id?: string) => {
    setUserRole(role);
    setUserEmail(email);
    if (id) setUserId(id);
    if (name) setUserName(name);
    if (photoUrl) setUserPhoto(photoUrl);
    setIsAuthenticated(true);

    // Persist Session
    localStorage.setItem('educontrol_role', role);
    localStorage.setItem('educontrol_email', email);
    if (id) localStorage.setItem('educontrol_user_id', id);
    if (name) localStorage.setItem('educontrol_name', name);
    if (photoUrl) localStorage.setItem('educontrol_photo', photoUrl);

    // Set initial view based on role
    let initialView: ViewState = 'DASHBOARD';
    if (role === UserRole.COORDINATOR) initialView = 'DASHBOARD';
    else if (role === UserRole.TEACHER) initialView = 'DASHBOARD';
    else if (role === UserRole.STUDENT || role === UserRole.PARENT) initialView = 'DASHBOARD';
    else initialView = 'DASHBOARD';

    setCurrentView(initialView);
    localStorage.setItem('educontrol_view', initialView);
  };

  // Reset when changing views manually
  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    localStorage.setItem('educontrol_view', view);
  };

  const handleModuleChange = (module: AppModule) => {
    setActiveModule(module);
    localStorage.setItem('educontrol_module', module);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null); // Reset to null
    setUserEmail('');
    setUserName('');
    setUserPhoto(''); // Reset photo

    // Clear Session
    localStorage.removeItem('educontrol_role');
    localStorage.removeItem('educontrol_email');
    localStorage.removeItem('educontrol_name');
    localStorage.removeItem('educontrol_photo');
    localStorage.removeItem('educontrol_user_id');
    localStorage.removeItem('educontrol_view');
    localStorage.removeItem('educontrol_module');
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        if (userRole === UserRole.STUDENT || userRole === UserRole.PARENT) {
          return <PortalDashboard userEmail={userEmail} userRole={userRole} onNavigate={handleViewChange} />;
        }
        return <Dashboard onNavigateToStudent={() => {}} />;
      case 'CALENDAR': return <CalendarView onShowToast={showToast} userEmail={userEmail} userId={userId} userRole={userRole!} userName={userName} onViewChange={(view, context) => {
        if (view === 'WHITEBOARD' && context) setActiveWhiteboardContext(context);
        handleViewChange(view);
      }} />;
      case 'FINANCIAL': 
        if (userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) {
          return <FinancialView onShowToast={showToast} userEmail={userEmail} userId={userId} userRole={userRole!} userName={userName} />;
        }
        return <Dashboard onNavigateToStudent={() => {}} userName={userName} />;
      case 'FINANCE_HOME':
        if (userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) {
          return <FinanceView onShowToast={showToast} userEmail={userEmail} userRole={userRole!} userId={userId} />;
        }
        return <Dashboard onNavigateToStudent={() => {}} />;
      case 'SIMULADO': return <SimuladoView 
        onShowToast={showToast} 
        userEmail={userEmail} 
        userRole={userRole!} 
        students={students}
        disciplines={disciplines}
      />;
      case 'ADMIN': return <AdminPanel onShowToast={showToast} userEmail={userEmail} userRole={userRole!} />;
      case 'SETTINGS': return <SettingsView userEmail={userEmail} userRole={userRole!} onShowToast={showToast} />;
      case 'COURSES': return <CoursesView onShowToast={showToast} userEmail={userEmail} userRole={userRole!} />;
      case 'WHITEBOARD': return <Whiteboard 
        onShowToast={showToast} 
        userEmail={userEmail} 
        userRole={userRole!} 
        activeClassId={activeWhiteboardContext?.classId}
        initialDisciplineId={activeWhiteboardContext?.disciplineId}
        onClose={() => handleViewChange('CALENDAR')}
      />;
      default: 
        if (userRole === UserRole.STUDENT || userRole === UserRole.PARENT) {
          return <PortalDashboard userEmail={userEmail} userRole={userRole} onNavigate={handleViewChange} />;
        }
        return <Dashboard onNavigateToStudent={() => {}} />;
    }
  };

  if (isRecovering) {
    return (
      <ErrorBoundary>
        <UpdatePassword onComplete={() => {
          setIsRecovering(false);
          handleLogout();
        }} />
      </ErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Login onLogin={handleLogin} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={isDark ? 'dark' : ''}>
        <Layout
          currentView={currentView}
          onViewChange={handleViewChange}
          role={userRole!}
          onRoleChange={setUserRole}
          onLogout={handleLogout}
          isDark={isDark}
          toggleTheme={toggleTheme}
          userPhoto={userPhoto}
          userName={userName}
          unreadMessagesCount={unreadCount}
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
        >
          {renderView()}
        </Layout>

        {/* Global Toast Notification */}
        <div className={`fixed bottom-6 right-6 bg-emerald-800 text-white px-6 py-3 rounded-lg shadow-xl transition-all duration-300 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'} z-50 flex items-center gap-2`}>
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          {toast.msg}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;