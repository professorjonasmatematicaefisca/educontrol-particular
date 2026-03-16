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
  History as HistoryIcon,
  FileText,
  ArrowRight,
  DollarSign,
  Filter,
  Play,
  ArrowLeft,
  Check
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isValid,
  parseISO,
  addDays,
  subDays,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'agenda' | 'history' | 'finance'>('agenda');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>(userRole === UserRole.STUDENT ? 'calendar' : 'table');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [registerHistory, setRegisterHistory] = useState(false);
  const [agendaDate, setAgendaDate] = useState(new Date());
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [agendaPage, setAgendaPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

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

  const isConflict = (date: string, start: string, end: string, excludeId?: string) => {
    return classes.some(c => 
      c.id !== excludeId && 
      c.classDate === date && 
      c.status !== 'CANCELLED' &&
      (start < c.endTime && end > c.startTime)
    );
  };

  const handleCreateClass = async () => {
    if (!newClass.studentId || !newClass.classDate || !newClass.startTime) {
      onShowToast('Preencha os campos obrigatórios');
      return;
    }

    if (isConflict(newClass.classDate, newClass.startTime, newClass.endTime || '')) {
      onShowToast('Já existe uma aula agendada neste horário');
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
        console.log('Uploading PDF:', completionData.pdfFile.name);
        const uploaded = await SupabaseService.uploadPDF(completionData.pdfFile);
        if (uploaded) {
          pdfUrl = uploaded;
          console.log('PDF uploaded successfully:', pdfUrl);
        } else {
          onShowToast('Erro ao enviar PDF. Tente novamente.');
          setCompletionData(prev => ({ ...prev, uploading: false }));
          return;
        }
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
    setRegisterHistory(false);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedClass || !rescheduleData.date || !rescheduleData.startTime) {
      onShowToast('Preencha os dados de reagendamento');
      return;
    }

    if (isConflict(rescheduleData.date, rescheduleData.startTime, rescheduleData.endTime, selectedClass.id)) {
      onShowToast('Horário ocupado por outra aula');
      return;
    }

    try {
      let success;
      if (registerHistory) {
        success = await SupabaseService.rescheduleClass(
          selectedClass.id,
          selectedClass.classDate,
          selectedClass.startTime,
          rescheduleData.date,
          rescheduleData.startTime,
          rescheduleData.endTime,
          userEmail
        );
      } else {
        success = await SupabaseService.updateScheduledClassDateTime(
          selectedClass.id,
          rescheduleData.date,
          rescheduleData.startTime,
          rescheduleData.endTime
        );
      }

      if (success) {
        onShowToast('Horário alterado com sucesso');
        setShowRescheduleModal(false);
        fetchData();
      } else {
        onShowToast('Erro ao alterar horário');
      }
    } catch (error) {
      onShowToast('Erro na operação');
    }
  };

  const handleDragReschedule = async (classId: string, newDate: string, isCopy?: boolean) => {
    const item = classes.find(c => c.id === classId);
    if (!item) return;

    if (isConflict(newDate, item.startTime, item.endTime, isCopy ? undefined : item.id)) {
      onShowToast('Este horário já está ocupado por outra aula');
      return;
    }

    if (isCopy) {
      try {
        const success = await SupabaseService.createScheduledClass({
          studentId: item.studentId,
          classDate: newDate,
          startTime: item.startTime,
          endTime: item.endTime,
          status: 'SCHEDULED',
          hourlyRate: item.hourlyRate || 0
        });

        if (success) {
          onShowToast('Aula duplicada com sucesso');
          fetchData();
        } else {
          onShowToast('Erro ao duplicar aula');
        }
      } catch (error) {
        onShowToast('Erro na operação de duplicação');
      }
      return;
    }

    const saveHistory = registerHistory || window.confirm('Mover aula? Deseja registrar esta remarcação no histórico?');

    try {
      let success;
      if (saveHistory) {
        success = await SupabaseService.rescheduleClass(
          item.id,
          item.classDate,
          item.startTime,
          newDate,
          item.startTime,
          item.endTime,
          userEmail
        );
      } else {
        success = await SupabaseService.updateScheduledClassDateTime(
          item.id,
          newDate,
          item.startTime,
          item.endTime
        );
      }

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
          onShowToast('Aula iniciada! Status atualizado.');
          // Removido abertura automática da lousa conforme pedido
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

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const handleConfirmPayment = async (accountId: string) => {
    if (!selectedClass) return;
    try {
      const success = await SupabaseService.confirmPayment(selectedClass.id, accountId, paymentDate);
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
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Selecione a data e a conta de destino</p>
        </div>
        <div className="p-8 pb-0 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data de Recebimento</label>
            <input 
              type="date" 
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-white text-sm font-bold focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none"
            />
          </div>
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

  const ModernDatePicker: React.FC<{ value: string; onChange: (date: string) => void }> = ({ value, onChange }) => {
    const initialDate = value ? parseISO(value) : new Date();
    const [viewDate, setViewDate] = useState(isValid(initialDate) ? initialDate : new Date());
    
    // Safety check for monthDays generation
    let monthDays: Date[] = [];
    try {
      monthDays = eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewDate)),
        end: endOfWeek(endOfMonth(viewDate)),
      });
    } catch (e) {
      monthDays = [];
    }

    return (
      <div className="bg-slate-950/50 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50">
          <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-400 transition-all">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-black text-white capitalize tracking-wider">
            {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-400 transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 p-2 gap-1 bg-slate-950/20">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
            <div key={d} className="text-[9px] font-black text-slate-600 text-center py-1">{d}</div>
          ))}
          {monthDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isSelected = value === dateStr;
            const isCurrentMonth = isSameMonth(day, viewDate);
            return (
              <button
                key={day.toString()}
                onClick={() => onChange(dateStr)}
                className={`aspect-square p-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${
                  isSelected 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : isCurrentMonth 
                    ? 'text-slate-300 hover:bg-white/5' 
                    : 'text-slate-700'
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const TimeGrid = ({ selected, onSelect }: { selected: string; onSelect: (time: string) => void }) => (
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

  const UserAvatar = ({ name, photoUrl, size = 'sm' }: { name: string; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const sizeClasses = {
      sm: 'w-8 h-8 text-[10px]',
      md: 'w-10 h-10 text-xs',
      lg: 'w-12 h-12 text-sm'
    };

    return (
      <div className={`${sizeClasses[size]} rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden flex-shrink-0`}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-black text-emerald-500">{initials}</span>
        )}
      </div>
    );
  };

  const AlphabetFilter = ({ selected, onSelect }: { selected: string | null; onSelect: (letter: string | null) => void }) => (
    <div className="flex flex-wrap gap-1 mb-6 p-2 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-md">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!selected ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
      >
        Tudo
      </button>
      {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
        <button
          key={l}
          onClick={() => onSelect(l === selected ? null : l)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-black transition-all ${selected === l ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  const Pagination = ({ current, total, onPageChange }: { current: number; total: number; onPageChange: (p: number) => void }) => {
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
          className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-gray-400 hover:text-white rounded-xl transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
          Página <span className="text-white">{current}</span> de {totalPages}
        </span>
        <button
          disabled={current === totalPages}
          onClick={() => onPageChange(current + 1)}
          className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-gray-400 hover:text-white rounded-xl transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  const AgendaCard = ({ c }: { c: ScheduledClass }) => (
    <div key={c.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-emerald-500/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <UserAvatar name={c.studentName || ''} photoUrl={c.studentPhoto} size="md" />
          <div>
            <h4 className="text-white font-black uppercase tracking-tight text-sm">
              {c.studentName}
            </h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{c.className}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-[10px] font-black text-sky-400 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/20 uppercase">
            <Clock size={10} /> {c.startTime}
          </div>
          {c.status !== 'SCHEDULED' && (
            <div className="mt-2">{getStatusIcon(c.status)}</div>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-slate-950/50 p-2 rounded-xl">
          <BookOpen size={14} className="text-emerald-500" />
          <span className="truncate">{disciplines.find(d => d.id === c.disciplineId)?.name || 'Aula Particular'}</span>
        </div>
        {c.rescheduledBy && (
          <div className="flex items-center gap-2 text-[10px] font-black text-amber-500/80 bg-amber-500/5 p-2 rounded-xl border border-amber-500/10 italic">
            <HistoryIcon size={12} /> Reagendada
          </div>
        )}
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {c.status === 'SCHEDULED' && isToday(new Date(c.classDate + 'T12:00:00')) && (
          <button 
            onClick={() => handleUpdateStatus(c.id, 'IN_PROGRESS')} 
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Play size={14} /> Iniciar Aula
          </button>
        )}
        
        {c.status === 'IN_PROGRESS' && (
          <button 
            onClick={() => openCompletionModal(c)} 
            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle size={14} /> Concluir Aula
          </button>
        )}

        {c.status === 'SCHEDULED' && (
          <button 
            onClick={() => openRescheduleModal(c)}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl transition-all active:scale-95"
            title="Alterar Horário"
          >
            <Edit2 size={14} />
          </button>
        )}
      </div>
    </div>
  );

  const HistoryCard = ({ c }: { c: ScheduledClass }) => (
    <div key={c.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-black text-xs">
            <CalendarIcon size={12} className="text-emerald-500" />
            {new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>
          <div className="text-gray-500 font-bold text-[10px] uppercase">{c.startTime}</div>
        </div>
        {c.status === 'COMPLETED' ? (
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded border border-emerald-500/20">Concluída</span>
        ) : c.status === 'IN_PROGRESS' ? (
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase rounded border border-amber-500/20 animate-pulse">Em Aula</span>
        ) : (
          <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 text-[9px] font-black uppercase rounded border border-sky-500/20">Agendada</span>
        )}
      </div>
      
      <div className="mb-4">
        <p className="text-white font-black text-sm uppercase tracking-tight group-hover:text-emerald-400 transition-all">{c.studentName}</p>
        <p className="text-slate-500 font-bold text-[10px] uppercase">
          {userRole === UserRole.STUDENT ? `Prof. ${c.teacherName}` : (disciplines.find(d => d.id === c.disciplineId)?.name || 'Disciplina')}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
        {c.pdfUrl ? (
          <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-black text-sky-400 hover:text-sky-300 uppercase underline">
            <FileText size={12} /> PDF Aula
          </a>
        ) : (
          <span className="text-[9px] text-slate-600 font-bold uppercase ring-1 ring-slate-800 px-2 py-1 rounded">Sem Material</span>
        )}
        
        {userRole !== UserRole.STUDENT && (c.status === 'SCHEDULED' || c.status === 'IN_PROGRESS') && (
          <button 
            onClick={() => c.status === 'SCHEDULED' ? handleUpdateStatus(c.id, 'IN_PROGRESS') : openCompletionModal(c)}
            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-lg"
          >
            {c.status === 'SCHEDULED' ? <ArrowRight size={16} /> : <CheckCircle size={16} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Header Premium - Fixo no topo */}
      <div className="sticky top-0 z-[100] bg-slate-950/80 backdrop-blur-xl -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-8 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
              <HistoryIcon size={16} /> {userRole === UserRole.STUDENT ? 'Aulas Concluídas' : 'Histórico'}
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
              onClick={() => {
                setNewClass({
                  ...newClass,
                  classDate: new Date().toISOString().split('T')[0],
                  startTime: '08:00',
                  endTime: '09:00',
                  studentId: ''
                });
                setShowModal(true);
              }}
              className="group relative flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              Novo Agendamento
            </button>
          )}
        </div>
      </div>
  
      <div className="max-w-7xl mx-auto space-y-8">

      {activeTab === 'agenda' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar: Status & Próximas */}
          <div className="lg:col-span-4 space-y-8">
            {/* Aula em Andamento (Destaque) */}
            {classes.some(c => isLive(c) || c.status === 'IN_PROGRESS') && (
              <div className={`relative overflow-hidden p-6 rounded-[2rem] shadow-2xl animate-pulse-slow ${
                classes.some(c => c.status === 'IN_PROGRESS') 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-900/40' 
                  : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-900/40'
              }`}>
                <div className="absolute top-0 right-0 p-4 opacity-20"><Target size={80} /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">
                      {classes.some(c => c.status === 'IN_PROGRESS') ? 'Aula em Andamento' : 'Iniciando'}
                    </span>
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
                                handleUpdateStatus(c.id, 'IN_PROGRESS');
                              }}
                              className="w-full py-3 bg-white text-emerald-600 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                            >
                              <ArrowRight size={16} /> Dar Início à Aula
                            </button>
                            <button 
                              onClick={() => openRescheduleModal(c)}
                              className="w-full py-2 bg-white/10 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                            >
                              <HistoryIcon size={14} /> Alterar Horário
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => openCompletionModal(c)}
                              className="w-full py-3 bg-white text-orange-600 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                              <CheckCircle size={16} /> Concluir Aula
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white flex items-center gap-3">
                  <Clock size={20} className="text-emerald-500" />
                  {isToday(agendaDate) ? 'Agenda de Hoje' : `Agenda - ${format(agendaDate, 'dd/MM', { locale: ptBR })}`}
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setAgendaDate(prev => subDays(prev, 1)); setAgendaPage(1); }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={() => { setAgendaDate(prev => addDays(prev, 1)); setAgendaPage(1); }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const filtered = classes
                    .filter(c => 
                      c.status === 'SCHEDULED' && 
                      c.classDate === format(agendaDate, 'yyyy-MM-dd') && 
                      !isLive(c)
                    )
                    .sort((a,b) => a.startTime.localeCompare(b.startTime));
                  
                  const paginated = filtered.slice((agendaPage - 1) * ITEMS_PER_PAGE, agendaPage * ITEMS_PER_PAGE);

                  return (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        {paginated.map(c => <AgendaCard key={c.id} c={c} />)}
                      </div>
                      
                      {filtered.length === 0 && (
                        <div className="text-center py-10 opacity-30 select-none">
                          <CalendarIcon size={48} className="mx-auto mb-2" />
                          <p className="text-xs font-black uppercase tracking-widest">Sem aulas pendentes</p>
                        </div>
                      )}

                      <Pagination 
                        current={agendaPage} 
                        total={filtered.length} 
                        onPageChange={setAgendaPage} 
                      />
                    </>
                  );
                })()}
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
                          className="bg-[#0f172a] border-none text-white text-[10px] font-black uppercase pl-10 pr-4 py-2 focus:ring-0 w-44 rounded-xl cursor-pointer"
                        >
                          <option value="" className="bg-[#0f172a]">Todas Disciplinas</option>
                          {disciplines.map(d => <option key={d.id} value={d.id} className="bg-[#0f172a]">{d.name}</option>)}
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
                    userRole={userRole}
                    onSelectClass={setSelectedClass}
                    onRescheduleClass={userRole !== UserRole.STUDENT ? handleDragReschedule : undefined}
                  />
                </div>
              ) : (
                <div className="p-8">
                  {(() => {
                    const filtered = classes.filter(c => 
                      (userRole === UserRole.STUDENT 
                        ? (c.subjectNotes?.toLowerCase().includes(searchTerm.toLowerCase()) || c.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()))
                        : c.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
                      ) &&
                      (!filterDiscipline || c.disciplineId === filterDiscipline)
                    );
                    
                    const paginated = filtered.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {paginated.map(c => <HistoryCard key={c.id} c={c} />)}
                        </div>
                        
                        {filtered.length === 0 && (
                          <div className="text-center py-20 opacity-30 select-none">
                            <Search size={64} className="mx-auto mb-4" />
                            <p className="text-xl font-black uppercase tracking-[0.2em]">Nenhum registro encontrado</p>
                          </div>
                        )}

                        <Pagination 
                          current={historyPage} 
                          total={filtered.length} 
                          onPageChange={setHistoryPage} 
                        />
                      </>
                    );
                  })()}
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
            <div className="p-8 border-b border-slate-800 bg-slate-900/80">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
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
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const prev = subDays(new Date(currentDate + 'T12:00:00'), 1);
                      setCurrentDate(format(prev, 'yyyy-MM-dd'));
                    }}
                    className="p-2 hover:bg-emerald-500/10 rounded-full text-emerald-500 transition-all border border-transparent hover:border-emerald-500/20"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex flex-col items-center min-w-[120px]">
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                      {isToday(new Date(currentDate + 'T12:00:00')) ? 'Hoje' : format(new Date(currentDate + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                      {format(new Date(currentDate + 'T12:00:00'), 'EEEE', { locale: ptBR })}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const next = addDays(new Date(currentDate + 'T12:00:00'), 1);
                      setCurrentDate(format(next, 'yyyy-MM-dd'));
                    }}
                    className="p-2 hover:bg-emerald-500/10 rounded-full text-emerald-500 transition-all border border-transparent hover:border-emerald-500/20"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {userRole !== UserRole.STUDENT && (
                    <div className="flex gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-inner">
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                        <select 
                          value={filterStudent}
                          onChange={(e) => setFilterStudent(e.target.value)}
                          className="bg-[#0f172a] border-none text-white text-sm font-bold pl-10 pr-4 py-2 focus:ring-0 w-48 rounded-xl cursor-pointer"
                        >
                          <option value="">Todos os Alunos</option>
                          {students.map(s => <option key={s.id} value={s.id} className="bg-[#0f172a]">{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                      <select 
                        value={filterDiscipline}
                        onChange={(e) => setFilterDiscipline(e.target.value)}
                        className="bg-[#0f172a] border-none text-white text-sm font-bold pl-10 pr-4 py-2 focus:ring-0 w-48 rounded-xl cursor-pointer shadow-inner"
                      >
                        <option value="" className="bg-[#0f172a]">Todas Disciplinas</option>
                        {disciplines.map(d => <option key={d.id} value={d.id} className="bg-[#0f172a]">{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <AlphabetFilter selected={selectedLetter} onSelect={setSelectedLetter} />
            </div>

            <div className="p-8">
              {(() => {
                const filtered = classes.filter(c => 
                  (!filterStudent || c.studentId === filterStudent) && 
                  (!filterDiscipline || c.disciplineId === filterDiscipline) &&
                  (!selectedLetter || c.studentName.toUpperCase().startsWith(selectedLetter))
                );
                
                const paginated = filtered.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginated.map(c => <HistoryCard key={c.id} c={c} />)}
                    </div>
                    
                    {filtered.length === 0 && (
                      <div className="text-center py-20 opacity-30 select-none">
                        <FileText size={64} className="mx-auto mb-4" />
                        <p className="text-xl font-black uppercase tracking-[0.2em]">Nenhum histórico encontrado</p>
                      </div>
                    )}

                    <Pagination 
                      current={historyPage} 
                      total={filtered.length} 
                      onPageChange={setHistoryPage} 
                    />
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-4xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-700 flex justify-between items-center bg-[#0f172a]/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Novo Agendamento</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Planejamento Acadêmico</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-3 hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl transition-all"
              >
                <XCircle size={28} />
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Coluna 1: Aluno e Data */}
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">1. Selecione o Aluno</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <select 
                      className="w-full bg-[#0f172a] border border-gray-700 hover:border-emerald-500/50 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                      value={newClass.studentId || ''}
                      onChange={(e) => setNewClass({ ...newClass, studentId: e.target.value })}
                    >
                      <option value="">Selecione um aluno na lista...</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">2. Selecione o Dia</label>
                  <ModernDatePicker value={newClass.classDate || ''} onChange={(date) => setNewClass({ ...newClass, classDate: date })} />
                </div>
              </div>

              {/* Coluna 2: Horário e Ação */}
              <div className="space-y-8 flex flex-col">
                <div className="flex-1">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">3. Selecione o Horário</label>
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

                <div className="pt-8 border-t border-gray-700/50">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumo do Agendamento</span>
                      <CheckCircle size={14} className="text-emerald-500" />
                    </div>
                    <p className="text-white font-bold flex items-center gap-2">
                       {newClass.classDate ? format(parseISO(newClass.classDate), 'dd/MM/yyyy') : '---'} 
                       <ArrowRight size={14} className="text-slate-600" />
                       {newClass.startTime || '---'}
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleCreateClass} 
                    disabled={!newClass.studentId || !newClass.classDate || !newClass.startTime}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-500 text-white font-black text-lg rounded-2xl active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3"
                  >
                    <Plus size={24} /> Confirmar Agendamento
                  </button>
                </div>
              </div>
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
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Nova Data</label>
                  <ModernDatePicker value={rescheduleData.date} onChange={(date) => setRescheduleData({ ...rescheduleData, date })} />
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

                <div className="flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="registerHistory"
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/50"
                    checked={registerHistory}
                    onChange={(e) => setRegisterHistory(e.target.checked)}
                  />
                  <label htmlFor="registerHistory" className="text-xs font-bold text-gray-300 cursor-pointer select-none">
                    Registrar no histórico de remarcação?
                  </label>
                </div>
              </div>

              {registerHistory && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Clock size={16} /></div>
                  <p className="text-[11px] text-amber-500 font-bold italic leading-tight">
                    Esta alteração registrará que você reagendou de <strong>{selectedClass.startTime}</strong> para o novo horário.
                  </p>
                </div>
              )}

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
