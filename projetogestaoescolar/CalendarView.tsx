import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock3,
  Edit2,
  BookOpen,
  User as UserIcon,
  Search,
  Target,
  Layout,
  History,
  FileText,
  ArrowRight,
  DollarSign,
  Filter
} from 'lucide-react';
import { UserRole, ScheduledClass, Student, Discipline, BankAccount } from './types';
import { SupabaseService } from './services/supabaseService';
import { supabase } from './supabaseClient';
import { ModernCalendar } from './components/ModernCalendar';

interface CalendarViewProps {
  onShowToast: (msg: string) => void;
  userEmail: string;
  userRole: UserRole;
  onViewChange?: (view: 'WHITEBOARD', context?: { classId: string; disciplineId: string }) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onShowToast, userEmail, userRole, onViewChange }) => {
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'agenda' | 'history' | 'finance'>('agenda');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>(userRole === UserRole.STUDENT ? 'calendar' : 'table');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Form States
  const [newClass, setNewClass] = useState<Partial<ScheduledClass>>({
    classDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '09:00',
    status: 'SCHEDULED'
  });

  const [completionData, setCompletionData] = useState({
    disciplineId: '',
    subjectNotes: '',
    pdfFile: null as File | null,
    uploading: false
  });

  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    fetchData();
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const data = await SupabaseService.getBankAccounts();
      setBankAccounts(data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scheduledData, studentsData, disciplinesData] = await Promise.all([
        SupabaseService.getScheduledClasses(undefined, undefined, userRole === UserRole.STUDENT ? userEmail : undefined),
        SupabaseService.getStudents(),
        SupabaseService.getDisciplines()
      ]);
      setClasses(scheduledData);
      setStudents(studentsData);
      setDisciplines(disciplinesData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      onShowToast('Erro ao carregar dados da agenda');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClass.studentId || !newClass.classDate || !newClass.startTime) {
      onShowToast('Preencha os campos obrigatórios');
      return;
    }

    const student = students.find(s => s.id === newClass.studentId);
    
    try {
      const success = await SupabaseService.createScheduledClass({
        ...newClass,
        hourlyRate: student?.hourlyRate || 0,
        teacherId: undefined // Let the service handle it if needed
      });

      if (success) {
        onShowToast('Aula agendada com sucesso');
        setShowModal(false);
        fetchData();
      } else {
        onShowToast('Erro ao agendar aula');
      }
    } catch (error) {
      onShowToast('Erro na operação');
    }
  };

  const openCompletionModal = (item: ScheduledClass) => {
    setSelectedClass(item);
    setCompletionData({
      disciplineId: item.disciplineId || '',
      subjectNotes: item.subjectNotes || '',
      pdfFile: null,
      uploading: false
    });
    setShowCompletionModal(true);
  };

  const handleConfirmCompletion = async () => {
    if (!selectedClass || !completionData.disciplineId) {
      onShowToast('Selecione a disciplina');
      return;
    }

    setCompletionData(prev => ({ ...prev, uploading: true }));
    try {
      let pdfUrl = selectedClass.pdfUrl || '';
      if (completionData.pdfFile) {
        const uploaded = await SupabaseService.uploadPDF(completionData.pdfFile);
        if (uploaded) pdfUrl = uploaded;
      }

      const success = await SupabaseService.updateScheduledClassStatus(selectedClass.id, 'COMPLETED', {
        totalValue: selectedClass.hourlyRate,
        disciplineId: completionData.disciplineId,
        subjectNotes: completionData.subjectNotes,
        pdfUrl: pdfUrl || undefined,
        paymentStatus: 'PENDING'
      });

      if (success) {
        onShowToast('Aula concluída com sucesso');
        setShowCompletionModal(false);
        fetchData();
      } else {
        onShowToast('Erro ao concluir aula');
      }
    } catch (error) {
      console.error('Completion error:', error);
      onShowToast('Erro na operação ou upload de PDF');
    } finally {
      setCompletionData(prev => ({ ...prev, uploading: false }));
    }
  };

  const openRescheduleModal = (item: ScheduledClass) => {
    setSelectedClass(item);
    setRescheduleData({
      date: item.classDate,
      startTime: item.startTime,
      endTime: item.endTime
    });
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedClass || !rescheduleData.date || !rescheduleData.startTime) {
      onShowToast('Preencha os dados de reagendamento');
      return;
    }

    try {
      const success = await SupabaseService.rescheduleClass(
        selectedClass.id,
        selectedClass.classDate,
        selectedClass.startTime,
        rescheduleData.date,
        rescheduleData.startTime,
        rescheduleData.endTime,
        userEmail
      );

      if (success) {
        onShowToast('Aula remarcada com sucesso');
        setShowRescheduleModal(false);
        fetchData();
      } else {
        onShowToast('Erro ao remarcar aula');
      }
    } catch (error) {
      onShowToast('Erro na operação');
    }
  };

  const handleDragReschedule = async (classId: string, newDate: string) => {
    const item = classes.find(c => c.id === classId);
    if (!item) return;

    try {
      // Automatic reschedule without modal/confirmation as requested
      const success = await SupabaseService.rescheduleClass(
        item.id,
        item.classDate,
        item.startTime,
        newDate,
        item.startTime, // Keeping the same time
        item.endTime,   // Keeping the same time
        userEmail
      );

      if (success) {
        onShowToast('Aula remanejada com sucesso');
        fetchData();
      } else {
        onShowToast('Erro ao remanejar aula');
      }
    } catch (error) {
      onShowToast('Erro na operação de remanejamento');
    }
  };

  const handleUpdateStatus = async (id: string, status: ScheduledClass['status'], hourlyRate: number = 0) => {
    if (status === 'COMPLETED') {
      const item = classes.find(c => c.id === id);
      if (item) openCompletionModal(item);
      return;
    }

    try {
      const success = await SupabaseService.updateScheduledClassStatus(id, status);
      if (success) {
        if (status === 'IN_PROGRESS') {
          const cls = classes.find(c => c.id === id);
          onShowToast('Aula iniciada!');
          if (onViewChange && cls) {
            onViewChange('WHITEBOARD', { classId: cls.id, disciplineId: cls.disciplineId || '' });
          }
        } else {
          onShowToast(`Aula marcada como ${status === 'CANCELLED' ? 'Cancelada' : 'Faltosa'}`);
        }
        fetchData();
      }
    } catch (error) {
      onShowToast('Erro ao atualizar status');
    }
  };

  const isLive = (c: ScheduledClass) => {
    const today = new Date().toISOString().split('T')[0];
    if (c.classDate !== today || c.status !== 'SCHEDULED') return false;
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [h, m] = c.startTime.split(':').map(Number);
    const start = h * 60 + m;
    const end = start + 60; // 1h class
    return now >= start && now < end;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="text-emerald-400" size={16} />;
      case 'IN_PROGRESS': return <Target className="text-emerald-400 animate-pulse" size={16} />;
      case 'CANCELLED': return <XCircle className="text-rose-400" size={16} />;
      case 'ABSENT': return <Clock3 className="text-amber-400" size={16} />;
      default: return <Clock className="text-sky-400" size={16} />;
    }
  };

  const handleConfirmPayment = async (accountId: string) => {
    if (!selectedClass) return;
    try {
      const success = await SupabaseService.confirmPayment(selectedClass.id, accountId);
      if (success) {
        onShowToast('Pagamento confirmado com sucesso');
        setShowPaymentModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      onShowToast('Erro ao confirmar pagamento');
    }
  };

  const FinanceTab = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl shadow-xl">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Pendente</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-white">
              {classes.filter(c => c.status === 'COMPLETED' && c.paymentStatus === 'PENDING').length}
            </h4>
            <span className="text-xs font-bold text-gray-500 uppercase">Aulas</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-8 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-white mb-1">Aguardando Pagamento</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Controle Financeiro</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-900/20">
                <th className="p-6">Aluno</th>
                <th className="p-6">Data</th>
                <th className="p-6">Valor</th>
                <th className="p-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {classes.filter(c => c.status === 'COMPLETED' && c.paymentStatus === 'PENDING').map(c => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm uppercase tracking-tight">{c.studentName}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase italic">Responsável: {c.parentName || '-'}</span>
                    </div>
                  </td>
                  <td className="p-6 text-gray-400 font-bold text-sm">
                    {new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-6">
                    <span className="text-emerald-400 font-black text-sm">R$ {c.totalValue?.toFixed(2) || '0,00'}</span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => { setSelectedClass(c); setShowPaymentModal(true); }}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20"
                    >
                      Confirmar
                    </button>
                  </td>
                </tr>
              ))}
              {classes.filter(c => c.status === 'COMPLETED' && c.paymentStatus === 'PENDING').length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                    <div className="opacity-20 flex flex-col items-center">
                      <DollarSign size={48} className="mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma aula pendente de pagamento</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-800">
          <h3 className="text-xl font-black text-white mb-1">Confirmar Recebimento</h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Selecione o destino do valor</p>
        </div>
        <div className="p-8 space-y-4">
          {bankAccounts.length > 0 ? (
            bankAccounts.map(account => (
              <button
                key={account.id}
                onClick={() => handleConfirmPayment(account.id)}
                className="w-full p-4 bg-slate-800/40 hover:bg-emerald-500/10 border border-slate-700/50 hover:border-emerald-500/50 rounded-2xl flex items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                  {account.imageUrl ? (
                    <img src={account.imageUrl} className="w-full h-full object-contain" alt="" />
                  ) : (
                    <DollarSign size={20} className="text-slate-500" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-white font-black uppercase text-sm group-hover:text-emerald-400 transition-colors">{account.name}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-xs font-bold text-gray-500 uppercase italic">Nenhuma conta cadastrada nas configurações.</p>
            </div>
          )}
        </div>
        <div className="p-8 bg-slate-900/50 flex justify-end">
          <button onClick={() => setShowPaymentModal(false)} className="px-6 py-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Fechar</button>
        </div>
      </div>
    </div>
  );

  const TimeGrid: React.FC<{ selected: string, onSelect: (time: string) => void }> = ({ selected, onSelect }) => (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 15 }, (_, i) => i + 7).map(h => {
        const time = `${h.toString().padStart(2, '0')}:00`;
        return (
          <button
            key={time}
            onClick={() => onSelect(time)}
            className={`p-2 rounded-lg text-sm font-bold transition-all border ${
              selected === time 
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 scale-105' 
              : 'bg-[#0f172a] border-gray-700 text-gray-400 hover:border-emerald-500/50'
            }`}
          >
            {time}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="group">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-all">
              <CalendarIcon className="text-emerald-500" size={20} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">EduControl <span className="text-emerald-500">PRO</span></h1>
          </div>
          <p className="text-xs text-gray-400 font-bold ml-10">Gestão Inteligente de Aulas Particulares</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900/50 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'agenda' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
          >
            <Layout size={16} /> Agenda
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'history' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
          >
            <History size={16} /> {userRole === UserRole.STUDENT ? 'Aulas Concluídas' : 'Histórico'}
          </button>
          {userRole !== UserRole.STUDENT && (
            <button 
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'finance' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              <DollarSign size={16} /> Financeiro
            </button>
          )}
        </div>

        {userRole !== UserRole.STUDENT && (
          <button 
            onClick={() => setShowModal(true)}
            className="group relative flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Novo Agendamento
          </button>
        )}
      </div>

      {activeTab === 'agenda' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar: Status & Próximas */}
          <div className="lg:col-span-4 space-y-8">
            {/* Aula em Andamento (Destaque) */}
            {classes.some(c => isLive(c) || c.status === 'IN_PROGRESS') && (
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-[2rem] shadow-2xl shadow-emerald-900/40 animate-pulse-slow">
                <div className="absolute top-0 right-0 p-4 opacity-20"><Target size={80} /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">Aula {classes.some(c => c.status === 'IN_PROGRESS') ? 'em Andamento' : 'Iniciando'}</span>
                  </div>
                  {classes.filter(c => isLive(c) || c.status === 'IN_PROGRESS').map(c => (
                    <div key={c.id}>
                      <h2 className="text-xl font-black text-white">{c.studentName}</h2>
                      <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-widest mb-3">Responsável: {c.parentName || 'Não informado'}</p>
                      <div className="flex items-center gap-4 text-emerald-50/80 font-bold mb-6">
                        <span className="flex items-center gap-1 text-xs"><Clock size={14} /> {c.startTime} - {c.endTime}</span>
                        <span className="flex items-center gap-1 text-xs"><BookOpen size={14} /> {c.className || 'Individual'}</span>
                      </div>
                      {(userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) && (
                        c.status === 'SCHEDULED' ? (
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => {
                                // If class has disciplineId already, start immediately
                                if (c.disciplineId) {
                                  handleUpdateStatus(c.id, 'IN_PROGRESS');
                                  onViewChange?.('WHITEBOARD', { classId: c.id, disciplineId: c.disciplineId });
                                } else {
                                  // Otherwise open completion/selection modal
                                  setSelectedClass(c);
                                  setShowCompletionModal(true);
                                }
                              }}
                              className="w-full py-3 bg-white text-emerald-600 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                            >
                              <ArrowRight size={16} /> Dar Início à Aula
                            </button>
                            <button 
                              onClick={() => openRescheduleModal(c)}
                              className="w-full py-2 bg-white/10 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                            >
                              <History size={14} /> Remarcar Aula
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => openCompletionModal(c)}
                            className="w-full py-3 bg-emerald-400 text-emerald-900 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={16} /> Encerrar e Registrar
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda de Hoje */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] backdrop-blur-xl">
              <h3 className="text-lg font-black text-white flex items-center gap-3 mb-6">
                <Clock size={20} className="text-emerald-500" />
                Agenda de Hoje
              </h3>
              <div className="space-y-4">
                {classes
                  .filter(c => c.status === 'SCHEDULED' && c.classDate === (new Date().toISOString().split('T')[0]) && !isLive(c))
                  .sort((a,b) => a.startTime.localeCompare(b.startTime))
                  .map(c => (
                    <div key={c.id} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                          {c.startTime}
                        </span>
                        {(userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) && (
                          <div className="flex gap-1">
                            <button onClick={() => openRescheduleModal(c)} className="p-2 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-all" title="Remarcar"><Edit2 size={16} /></button>
                            <button onClick={() => handleUpdateStatus(c.id, 'CANCELLED')} className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all" title="Cancelar"><XCircle size={16} /></button>
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors uppercase">{c.studentName}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Resp: {c.parentName || '-'}</p>
                      <div className="flex items-center gap-3 text-gray-500 text-xs font-bold">
                        <span className="flex items-center gap-1"><UserIcon size={12} /> {c.className || 'Geral'}</span>
                        <span className="flex items-center gap-1"><Target size={12} /> 60 mim</span>
                      </div>
                    </div>
                  ))}
                {classes.filter(c => c.status === 'SCHEDULED' && c.classDate === (new Date().toISOString().split('T')[0]) && !isLive(c)).length === 0 && (
                  <div className="text-center py-10 opacity-30 select-none">
                    <CalendarIcon size={48} className="mx-auto mb-2" />
                    <p className="text-xs font-black uppercase tracking-widest">Sem aulas pendentes hoje</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content: Lista de Agendamentos / Histórico */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="p-8 border-b border-slate-800 bg-slate-900/80 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-lg font-black text-white mb-1">
                    {userRole === UserRole.STUDENT ? 'Histórico de Aulas' : 'Todas as Aulas'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {userRole === UserRole.STUDENT ? 'Registro de aulas e materiais' : 'Controle Acadêmico'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1">
                    <button 
                      onClick={() => setViewMode('table')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'table' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white'}`}
                    >
                      Lista
                    </button>
                    <button 
                      onClick={() => setViewMode('calendar')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white'}`}
                    >
                      Calendário
                    </button>
                  </div>
                  
                  {userRole === UserRole.STUDENT && (
                    <div className="flex gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                        <select 
                          value={filterDiscipline} 
                          onChange={(e) => setFilterDiscipline(e.target.value)}
                          className="bg-transparent border-none text-white text-xs font-bold pl-10 pr-4 py-2 focus:ring-0 w-40"
                        >
                          <option value="">Todas Disciplinas</option>
                          {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-bold pl-10 pr-4 py-3 focus:ring-emerald-500/50 w-48"
                    />
                  </div>
                </div>
              </div>

              {viewMode === 'calendar' ? (
                <div className="p-8">
                  <ModernCalendar 
                    classes={classes} 
                    onSelectClass={userRole !== UserRole.STUDENT ? openCompletionModal : undefined}
                    onRescheduleClass={userRole !== UserRole.STUDENT ? handleDragReschedule : undefined}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-900/20">
                        <th className="p-6">Data & Hora</th>
                        <th className="p-6">{userRole === UserRole.STUDENT ? 'Disciplina/Professor' : 'Aluno'}</th>
                        <th className="p-6">Conteúdo / Material</th>
                        <th className="p-6 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {classes
                        .filter(c => 
                          (userRole === UserRole.STUDENT 
                            ? (c.subjectNotes?.toLowerCase().includes(searchTerm.toLowerCase()) || c.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()))
                            : c.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
                          ) &&
                          (!filterDiscipline || c.disciplineId === filterDiscipline)
                        )
                        .map(c => (
                        <tr key={c.id} className="hover:bg-slate-800/30 transition-all group">
                          <td className="p-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-white font-black text-sm">
                                <CalendarIcon size={14} className="text-emerald-500" />
                                {new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase">
                                <Clock size={12} /> {c.startTime}
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              {userRole === UserRole.STUDENT ? (
                                  <div>
                                      <span className="text-white font-bold text-sm block uppercase tracking-tight">{disciplines.find(d => d.id === c.disciplineId)?.name || 'Aula Particular'}</span>
                                      <span className="text-gray-500 font-bold text-[10px] block uppercase">Prof. {c.teacherName}</span>
                                  </div>
                              ) : (
                                  <>
                                      <div className="relative">
                                      {c.studentPhoto ? (
                                          <img src={c.studentPhoto} className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-800 group-hover:ring-emerald-500/50 transition-all" alt="" />
                                      ) : (
                                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500">
                                          {c.studentName?.[0]}
                                          </div>
                                      )}
                                      </div>
                                      <div>
                                      <span className="text-white font-bold text-sm block uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{c.studentName}</span>
                                      <span className="text-gray-500 font-bold text-[9px] block uppercase">{c.className || 'Não definida'}</span>
                                      </div>
                                  </>
                              )}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="max-w-xs space-y-2">
                              <p className="text-[11px] text-gray-400 font-medium italic line-clamp-1">{c.subjectNotes || 'Nenhum registro de conteúdo'}</p>
                              {c.pdfUrl && (
                                  <a 
                                      href={c.pdfUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-red-500/20"
                                  >
                                      <FileText size={12} /> PDF Aula
                                  </a>
                              )}
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex justify-end gap-2">
                              {userRole === UserRole.STUDENT ? (
                                  <div className="flex justify-end gap-2">
                                      {c.status === 'COMPLETED' ? (
                                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20">Concluída</span>
                                      ) : c.status === 'IN_PROGRESS' ? (
                                          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase rounded-lg border border-amber-500/20 animate-pulse">Em Aula</span>
                                      ) : (
                                          <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase rounded-lg border border-sky-500/20">Agendada</span>
                                      )}
                                  </div>
                              ) : (
                                  <>
                                      {(c.status === 'SCHEDULED' || c.status === 'IN_PROGRESS') && (
                                          <button 
                                              onClick={() => c.status === 'SCHEDULED' ? handleUpdateStatus(c.id, 'IN_PROGRESS') : openCompletionModal(c)}
                                              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-lg ${
                                                  c.status === 'SCHEDULED' 
                                                  ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-emerald-500/10' 
                                                  : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white shadow-amber-500/10'
                                              }`}
                                              title={c.status === 'SCHEDULED' ? 'Iniciar Aula' : 'Encerrar Aula'}
                                          >
                                              {c.status === 'SCHEDULED' ? <ArrowRight size={20} /> : <CheckCircle size={20} />}
                                          </button>
                                      )}
                                      <button 
                                          onClick={() => openCompletionModal(c)}
                                          className="w-10 h-10 flex items-center justify-center bg-slate-800/50 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-500 rounded-xl transition-all"
                                          title="Editar Registro"
                                      >
                                          <Plus size={20} />
                                      </button>
                                  </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'finance' ? (
        <FinanceTab />
      ) : (
        /* Aba de Histórico e Análises */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Dashboard de Histórico */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-xl">
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-1">Aulas Realizadas</p>
              <h4 className="text-2xl font-black text-white">{classes.filter(c => c.status === 'COMPLETED').length}</h4>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-xl">
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-1">Presença</p>
              <h4 className="text-2xl font-black text-white">
                {Math.round((classes.filter(c => c.status === 'COMPLETED').length / (classes.filter(c => c.status !== 'CANCELLED').length || 1)) * 100)}%
              </h4>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-xl">
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-1">Alunos Ativos</p>
              <h4 className="text-2xl font-black text-white">{new Set(classes.map(c => c.studentId)).size}</h4>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-xl">
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-1">Remarcações</p>
              <h4 className="text-2xl font-black text-white">{classes.filter(c => c.rescheduledBy).length}</h4>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="p-8 border-b border-slate-800 bg-slate-900/80 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-1">
                    {userRole === UserRole.STUDENT ? 'Meus Materiais e Aulas' : 'Histórico Completo'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {userRole === UserRole.STUDENT ? 'Baixe os PDFs das suas aulas' : 'Filtros e Auditoria'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <select 
                      value={filterStudent}
                      onChange={(e) => setFilterStudent(e.target.value)}
                      className="bg-transparent border-none text-white text-sm font-bold pl-10 pr-4 py-2 focus:ring-0 w-48"
                    >
                      <option value="">Todos os Alunos</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <select 
                      value={filterDiscipline}
                      onChange={(e) => setFilterDiscipline(e.target.value)}
                      className="bg-transparent border-none text-white text-sm font-bold pl-10 pr-4 py-2 focus:ring-0 w-48"
                    >
                      <option value="">Todas Disciplinas</option>
                      {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  </div>
              </div>
            </div>

              <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-900/20">
                    <th className="p-6">Informações da Aula</th>
                    <th className="p-6">Conteúdo / Observação</th>
                    <th className="p-6">Auditoria</th>
                    <th className="p-6 text-right">Status Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {classes
                    .filter(c => (!filterStudent || c.studentId === filterStudent) && (!filterDiscipline || c.disciplineId === filterDiscipline))
                    .map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-all border-l-4 border-transparent hover:border-emerald-500/50">
                      <td className="p-6">
                        <div className="space-y-1">
                          <span className="text-white font-bold block text-sm uppercase tracking-tight">{c.studentName}</span>
                          <span className="text-slate-500 font-bold text-xs flex items-center gap-1">
                            <CalendarIcon size={12} /> {new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {c.startTime}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="max-w-xs">
                          {c.disciplineId ? (
                            <div className="space-y-2">
                              <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded border border-emerald-500/20">
                                {disciplines.find(d => d.id === c.disciplineId)?.name || 'Disciplina'}
                              </span>
                              <p className="text-slate-400 text-xs font-medium line-clamp-2 italic">{c.subjectNotes || 'Sem observações'}</p>
                              {c.pdfUrl && (
                                <a 
                                  href={c.pdfUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-black text-sky-400 hover:text-sky-300 uppercase underline mt-1"
                                >
                                  <FileText size={10} /> Ver Material (PDF)
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest italic">Dados indisponíveis</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        {c.rescheduledBy ? (
                          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl space-y-2">
                            <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase tracking-wider">
                              <Clock size={12} /> Aula Remarcada
                            </span>
                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
                              <span>De: {c.previousStartTime || '--:--'}</span>
                              <ArrowRight size={10} />
                              <span className="text-white">Para: {c.startTime}</span>
                            </div>
                            <span className="block text-[9px] text-slate-600 font-bold mt-1">Por: {c.rescheduledBy}</span>
                          </div>
                        ) : (
                          <span className="text-slate-700 font-black text-[10px] uppercase">Agendamento Original</span>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-black tracking-widest ${
                          c.status === 'COMPLETED' ? 'text-emerald-500' : 'text-slate-500'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendamento (Simplificado) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="text-emerald-500" /> Novo Agendamento
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><XCircle size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aluno</label>
                <select 
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white outline-none"
                  value={newClass.studentId || ''}
                  onChange={(e) => setNewClass({ ...newClass, studentId: e.target.value })}
                >
                  <option value="">Selecione um aluno</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                  <input type="date" className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white" value={newClass.classDate} onChange={(e) => setNewClass({ ...newClass, classDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Selecione o Horário</label>
                  <TimeGrid 
                    selected={newClass.startTime || ''} 
                    onSelect={(time) => {
                      const h = parseInt(time.split(':')[0]);
                      setNewClass({ 
                        ...newClass, 
                        startTime: time, 
                        endTime: `${(h + 1).toString().padStart(2, '0')}:00` 
                      });
                    }} 
                  />
                </div>
              </div>
              <button 
                onClick={handleCreateClass} 
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl mt-4 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Salvar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conclusão */}
      {showCompletionModal && selectedClass && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-emerald-500/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 text-emerald-500">
                <CheckCircle /> Concluir Aula
              </h2>
              <button onClick={() => setShowCompletionModal(false)} className="text-gray-400 hover:text-white"><XCircle size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#0f172a] rounded-lg border border-gray-700">
                <UserIcon size={20} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Aluno</p>
                  <p className="text-white font-bold">{selectedClass.studentName}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Disciplina Ministrada</label>
                <select 
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  value={completionData.disciplineId}
                  onChange={(e) => setCompletionData({ ...completionData, disciplineId: e.target.value })}
                >
                  <option value="">Selecione a disciplina</option>
                  {disciplines
                    .filter(d => {
                      if (!selectedClass.className) return true;
                      return d.name.toLowerCase().includes(selectedClass.className.toLowerCase());
                    })
                    .map(d => <option key={d.id} value={d.id}>{d.displayName || d.name}</option>)
                  }
                  {/* Fallback if no specific disciplines match the class name */}
                  {disciplines
                    .filter(d => !selectedClass.className || !d.name.includes(selectedClass.className))
                    .map(d => <option key={d.id} value={d.id}>{d.displayName || d.name}</option>)
                  }
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">O que foi ministrado? (Observações)</label>
                <textarea 
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 h-32"
                  placeholder="Descreva o conteúdo da aula..."
                  value={completionData.subjectNotes}
                  onChange={(e) => setCompletionData({ ...completionData, subjectNotes: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Anexar Material (PDF)</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  onChange={(e) => setCompletionData({ ...completionData, pdfFile: e.target.files?.[0] || null })}
                />
                {completionData.pdfFile && (
                  <p className="mt-1 text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle size={10} /> {completionData.pdfFile.name}
                  </p>
                )}
              </div>

              <button 
                onClick={handleConfirmCompletion} 
                disabled={completionData.uploading}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl mt-4 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {completionData.uploading ? 'Processando...' : (
                  <>
                    <CheckCircle size={20} /> Confirmar Conclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reagendamento */}
      {showRescheduleModal && selectedClass && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-blue-500/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 text-blue-500">
                <Edit2 size={20} /> Alterar Horário
              </h2>
              <button onClick={() => setShowRescheduleModal(false)} className="text-gray-400 hover:text-white"><XCircle size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">Alterando aula de <strong>{selectedClass.studentName}</strong></p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Data</label>
                  <input type="date" className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white" value={rescheduleData.date} onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Novo Horário</label>
                  <TimeGrid 
                    selected={rescheduleData.startTime} 
                    onSelect={(time) => {
                      const h = parseInt(time.split(':')[0]);
                      setRescheduleData({ 
                        ...rescheduleData, 
                        startTime: time, 
                        endTime: `${(h + 1).toString().padStart(2, '0')}:00` 
                      });
                    }} 
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Clock size={16} /></div>
                <p className="text-[11px] text-amber-500 font-bold italic leading-tight">
                  Esta alteração registrará que você reagendou de <strong>{selectedClass.startTime}</strong> para o novo horário.
                </p>
              </div>

              <button 
                onClick={handleConfirmReschedule} 
                className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl mt-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)]"
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};
