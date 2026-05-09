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
  Play,
  ArrowLeft,
  ArrowRight,
  Target,
  Layout,
  History as HistoryIcon,
  FileText,
  Search,
  Filter,
  Check,
  Trash2,
  AlertCircle,
  DollarSign,
  MessageCircle,
  Share2,
  Users
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
import { getHoliday } from './utils/holidays';
import { Star } from 'lucide-react';

const UserAvatar = ({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) => {
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED': return <CheckCircle className="text-emerald-400" size={16} />;
    case 'IN_PROGRESS': return <Target className="text-emerald-400 animate-pulse" size={16} />;
    case 'CANCELLED': return <XCircle className="text-rose-400" size={16} />;
    case 'ABSENT': return <Clock3 className="text-amber-400" size={16} />;
    default: return <Clock className="text-sky-400" size={16} />;
  }
};

const getCardColor = (id: string) => {
  const colors = [
    'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-500',
    'from-sky-500/10 via-sky-500/5 to-transparent border-sky-500/20 text-sky-500',
    'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 text-amber-500',
    'from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20 text-rose-500',
    'from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20 text-violet-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

interface CalendarViewProps {
  onShowToast: (msg: string) => void;
  userEmail: string;
  userId: string;
  userRole: UserRole;
  userName?: string;
  onViewChange?: (view: 'WHITEBOARD', context?: { classId: string; disciplineId: string }) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onShowToast, userEmail, userId, userRole, userName = 'Professor Jonas', onViewChange }) => {
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
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [registerHistory, setRegisterHistory] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [registerDeleteHistory, setRegisterDeleteHistory] = useState(true);
  const [agendaDate, setAgendaDate] = useState(new Date());
  const [agendaPage, setAgendaPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const historyFileInputRef = React.useRef<HTMLInputElement>(null);
  const [updatingPDFId, setUpdatingPDFId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 8;

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
    paymentDueDate: new Date().toISOString().split('T')[0],
    pdfFiles: [] as File[],
    uploading: false
  });

  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

  const openDeleteModal = (id: string) => {
    setSelectedDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteClass = async () => {
    if (!selectedDeleteId) return;
    try {
      if (registerDeleteHistory) {
        const success = await SupabaseService.cancelScheduledClass(selectedDeleteId, deleteReason);
        if (success) {
          setClasses(prev => prev.map(c => 
            c.id === selectedDeleteId 
              ? { ...c, status: 'CANCELLED' as const, notes: deleteReason ? `Cancelado: ${deleteReason}` : 'Cancelado pelo professor' } 
              : c
          ));
          onShowToast('Aula cancelada e registrada no histórico!');
        } else {
          onShowToast('Erro ao cancelar aula no banco de dados.');
          return;
        }
      } else {
        const success = await SupabaseService.deleteScheduledClass(selectedDeleteId);
        if (success) {
          setClasses(prev => prev.filter(c => c.id !== selectedDeleteId));
          onShowToast('Aula excluída com sucesso!');
        } else {
          onShowToast('Erro ao excluir aula no banco de dados.');
          return;
        }
      }
      setShowDeleteModal(false);
      setSelectedDeleteId(null);
      setDeleteReason('');
      setRegisterDeleteHistory(false); // Reseta para o padrão (ou mantém conforme preferência, aqui eu reseto)
    } catch (err) {
      console.error(err);
      onShowToast('Erro ao processar exclusão.');
    }
  };


  const [selectedClassesForPayment, setSelectedClassesForPayment] = useState<string[]>([]);
  const [selectedStudentFinance, setSelectedStudentFinance] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      // Usar o userId vindo das props para maior consistência
      const data = await SupabaseService.getBankAccounts(userId);
      setBankAccounts(data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

// Movido para o escopo global

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
    const student = students.find(s => s.id === item.studentId);
    let defaultDueDate = new Date().toISOString().split('T')[0];
    
    // Se o aluno tiver um dia de faturamento, tentar prever o vencimento
    if (student?.billing_day) {
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth(), student.billing_day);
      if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
      defaultDueDate = dueDate.toISOString().split('T')[0];
    }

    setSelectedClass(item);
    setCompletionData({
      disciplineId: item.disciplineId || '',
      subjectNotes: item.subjectNotes || '',
      paymentDueDate: defaultDueDate,
      pdfFiles: [],
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
      let existingPdfData: { name: string, url: string }[] = [];
      if (selectedClass.pdfUrl) {
         try {
             if (selectedClass.pdfUrl.trim().startsWith('[')) {
                 existingPdfData = JSON.parse(selectedClass.pdfUrl);
             } else {
                 existingPdfData = [{ name: 'Anexo Antigo', url: selectedClass.pdfUrl }];
             }
         } catch(e) {
             existingPdfData = [{ name: 'Anexo Antigo', url: selectedClass.pdfUrl }];
         }
      }

      if (completionData.pdfFiles && completionData.pdfFiles.length > 0) {
        for (const file of completionData.pdfFiles) {
           console.log('Uploading Material:', file.name);
           const uploaded = await SupabaseService.uploadPDF(file);
           if (uploaded) {
               existingPdfData.push({ name: file.name, url: uploaded });
               console.log('Material uploaded successfully:', uploaded);
           } else {
               onShowToast(`Erro ao enviar ${file.name}. Tente novamente.`);
               setCompletionData(prev => ({ ...prev, uploading: false }));
               return;
           }
        }
      }

      const finalPdfUrl = existingPdfData.length > 0 ? JSON.stringify(existingPdfData) : undefined;

      const success = await SupabaseService.updateScheduledClassStatus(selectedClass.id, 'COMPLETED', {
        totalValue: selectedClass.hourlyRate,
        disciplineId: completionData.disciplineId,
        subjectNotes: completionData.subjectNotes,
        pdfUrl: finalPdfUrl,
        paymentStatus: 'PENDING',
        paymentDueDate: completionData.paymentDueDate
      });

      if (success) {
        onShowToast('Aula concluída com sucesso');
        setShowCompletionModal(false);
        
        // Automated Notifications
        if (selectedClass.parentPhone) {
          handleNotifyParentCompletion(
            selectedClass.studentId, 
            selectedClass.studentName || '', 
            selectedClass.parentPhone, 
            selectedClass.classDate
          );
        }
        
        if (selectedClass.studentPhone) {
          const disciplineName = disciplines.find(d => d.id === (completionData.disciplineId || selectedClass.disciplineId))?.name || 'Aula';
          const msg = `Olá ${selectedClass.studentName}! Sua aula de ${disciplineName} do dia ${format(new Date(selectedClass.classDate + 'T12:00:00'), 'dd/MM')} foi concluída com sucesso. Bom descanso!`;
          window.open(`https://wa.me/${selectedClass.studentPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        }

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

  const handleWhatsAppMessage = (phone: string, studentName: string, startTime: string) => {
    const message = `Olá ${studentName}, tudo bem? Aqui é o ${userName}. Passando para confirmar nossa aula de hoje às ${startTime}!`;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleNotifyParentCompletion = async (studentId: string, studentName: string, parentPhone: string | undefined, classDate: string) => {
    const parentMsg = `Olá, aqui é o ${userName}. A aula de ${studentName} foi concluída com sucesso hoje!\n\nAproveito para enviar a agenda das próximas aulas da semana:\n\n`;
    
    // Calculate range: from classDate until next Saturday
    const dateObj = parseISO(classDate);
    const endOfWeekDate = endOfWeek(dateObj, { weekStartsOn: 0 }); // Saturday is end of week (Sunday start)
    const startDateStr = classDate;
    const endDateStr = format(endOfWeekDate, 'yyyy-MM-dd');

    // Fetch weekly schedule for the message
    const weekClasses = await SupabaseService.getWeeklyScheduleForWhatsApp(startDateStr, endDateStr, studentId);
    let scheduleText = "";
    if (weekClasses.length > 0) {
      weekClasses.forEach(c => {
        const dateObj = parseISO(c.classDate);
        const weekDay = format(dateObj, 'EEEE', { locale: ptBR });
        const dayMonth = format(dateObj, 'dd/MM');
        scheduleText += `*${weekDay} (${dayMonth})* às *${c.startTime}*\n`;
      });
    } else {
      scheduleText = "Nenhuma aula agendada para o restante da semana.";
    }

    const finalMsg = parentMsg + scheduleText + `\n\nQualquer dúvida estou à disposição!`;
    const targetPhone = parentPhone || ''; 
    
    if (!targetPhone) {
        onShowToast("Telefone do pai não cadastrado.");
        return;
    }

    const cleanPhone = targetPhone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(finalMsg)}`, '_blank');
  };

  const handleSendWeeklySchedule = async (studentId: string, studentName: string, phone?: string) => {
    if (!phone) {
      onShowToast(`Telefone não cadastrado para ${studentName}.`);
      return;
    }

    const start = format(agendaDate, 'yyyy-MM-dd');
    const end = format(endOfWeek(agendaDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    const weekClasses = await SupabaseService.getWeeklyScheduleForWhatsApp(start, end, studentId);
    
    if (weekClasses.length === 0) {
      onShowToast('Nenhuma aula encontrada para o restante da semana.');
      return;
    }

    let messageText = `Olá! Segue a agenda de aulas de *${studentName}* para o restante da semana:\n\n`;
    
    weekClasses.forEach(c => {
      const dateObj = parseISO(c.classDate);
      const weekDay = format(dateObj, 'EEEE', { locale: ptBR });
      const dayMonth = format(dateObj, 'dd/MM');
      messageText += `*${weekDay} (${dayMonth})* às *${c.startTime}*\n`;
    });

    messageText += `\nQualquer dúvida, estou à disposição!`;
    
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const handleBulkSendWeeklySchedules = async (list: ScheduledClass[]) => {
    const studentsInList = Array.from(new Set(list.map(c => c.studentId)));
    
    if (studentsInList.length === 0) {
      onShowToast('Nenhum aluno na lista para enviar.');
      return;
    }

    if (!confirm(`Deseja abrir as janelas de WhatsApp para os ${studentsInList.length} alunos da lista (agenda semanal)?`)) return;

    for (const sId of studentsInList) {
      const studentClass = list.find(c => c.studentId === sId);
      if (studentClass && studentClass.studentPhone) {
        await handleSendWeeklySchedule(sId, studentClass.studentName || 'Aluno', studentClass.studentPhone);
      }
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

// Movido para o escopo global



  const handleConfirmPayments = async (accountId: string) => {
    if (selectedClassesForPayment.length === 0) {
      onShowToast('Selecione ao menos uma aula para confirmar');
      return;
    }
    try {
      const success = await SupabaseService.confirmMultiplePayments(selectedClassesForPayment, accountId, paymentDate, userId);
      if (success) {
        onShowToast('Pagamento(s) confirmado(s) com sucesso');
        setShowPaymentModal(false);
        setSelectedClassesForPayment([]);
        fetchData();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      onShowToast('Erro ao confirmar pagamento');
    }
  };

  const FinanceTab = () => {
    const studentPayments = students.map(s => {
      const pendingClasses = classes.filter(c => c.studentId === s.id && c.status === 'COMPLETED' && c.paymentStatus === 'PENDING');
      const totalPending = pendingClasses.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
      return {
        ...s,
        pendingCount: pendingClasses.length,
        totalPending
      };
    }).filter(s => s.pendingCount > 0);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
        {/* Lado Esquerdo: Resumo por Aluno */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total a Receber</p>
              <h4 className="text-4xl font-black text-white">
                R$ {studentPayments.reduce((acc, curr) => acc + curr.totalPending, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </div>
            <DollarSign className="absolute -right-4 -bottom-4 text-emerald-500/10 group-hover:scale-110 transition-transform duration-500" size={160} />
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="p-8 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white mb-1">Aguardando Pagamento</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Resumo por Aluno</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-900/20">
                    <th className="p-6">Aluno</th>
                    <th className="p-6">Aulas</th>
                    <th className="p-6">Total</th>
                    <th className="p-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {studentPayments.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-all group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={s.name} size="sm" />
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm uppercase tracking-tight">{s.name}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase italic">{s.billing_day ? `Vence dia ${s.billing_day}` : 'Sem dia fixo'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-gray-400 font-bold text-sm">{s.pendingCount} aulas</span>
                      </td>
                      <td className="p-6">
                        <span className="text-emerald-400 font-black text-sm">R$ {s.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => { 
                            setSelectedStudentFinance(s.id);
                            const pending = classes.filter(c => c.studentId === s.id && c.status === 'COMPLETED' && c.paymentStatus === 'PENDING');
                            setSelectedClassesForPayment(pending.map(p => p.id));
                            setShowPaymentModal(true); 
                          }}
                          className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2 ml-auto"
                        >
                          <Check size={14} /> Receber
                        </button>
                      </td>
                    </tr>
                  ))}
                  {studentPayments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-24 text-center">
                        <div className="opacity-20 flex flex-col items-center">
                          <DollarSign size={64} className="mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Nenhum recebimento pendente</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lado Direito: Aulas Ministradas (Histórico Recente) */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-xl">
              <h3 className="text-lg font-black text-white flex items-center gap-3 mb-6">
                <HistoryIcon size={20} className="text-emerald-500" />
                Aulas Ministradas
              </h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {classes
                  .filter(c => c.status === 'COMPLETED')
                  .sort((a,b) => b.classDate.localeCompare(a.classDate))
                  .slice(0, 15)
                  .map(c => (
                    <div key={c.id} className="p-4 bg-[#0f172a]/60 rounded-2xl border border-gray-800/50 flex flex-col gap-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-gray-500 uppercase">{format(parseISO(c.classDate), 'dd/MM/yyyy')}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${c.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {c.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                          </span>
                       </div>
                       <p className="text-white font-bold text-sm truncate uppercase tracking-tight">{c.studentName}</p>
                       <p className="text-[10px] text-emerald-400 font-black">R$ {c.totalValue?.toFixed(2)}</p>
                    </div>
                  ))
                }
              </div>
           </div>
        </div>
      </div>
    );
  };

  const PaymentModal = () => {
    const student = students.find(s => s.id === selectedStudentFinance);
    const pendingClasses = classes.filter(c => c.studentId === selectedStudentFinance && c.status === 'COMPLETED' && c.paymentStatus === 'PENDING');

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
        <div className="bg-[#0f172a] w-full max-w-2xl rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-black text-white mb-1">Confirmar Recebimento</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Aluno: <span className="text-emerald-500">{student?.name}</span></p>
            </div>
            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
              <XCircle size={24} />
            </button>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Esquerda: Lista de Aulas para Seleção */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Selecione as Aulas para Baixa</label>
              <div className="space-y-2">
                {pendingClasses.map(c => (
                  <label key={c.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${selectedClassesForPayment.includes(c.id) ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/20 border-slate-800'}`}>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                      checked={selectedClassesForPayment.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClassesForPayment([...selectedClassesForPayment, c.id]);
                        } else {
                          setSelectedClassesForPayment(selectedClassesForPayment.filter(id => id !== c.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-black text-white uppercase tracking-tight">{format(parseISO(c.classDate), 'dd/MM/yyyy')}</p>
                      <p className="text-[10px] text-emerald-400 font-bold">R$ {c.totalValue?.toFixed(2)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Direita: Dados de Destino */}
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Dados do Recebimento</label>
                <div className="bg-slate-800/20 border border-slate-800 rounded-2xl p-4">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Data</p>
                   <input 
                    type="date" 
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Conta de Destino</p>
                  {bankAccounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => handleConfirmPayments(account.id)}
                      className="w-full p-4 bg-slate-800/40 hover:bg-emerald-500 text-white rounded-2xl flex items-center gap-4 transition-all group"
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                        {account.imageUrl ? (
                          <img src={account.imageUrl} className="w-full h-full object-contain" alt="" />
                        ) : (
                          <DollarSign size={18} />
                        )}
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest group-hover:scale-105 transition-transform">{account.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Selecionado</p>
                <h4 className="text-2xl font-black text-emerald-500">
                  R$ {pendingClasses
                    .filter(c => selectedClassesForPayment.includes(c.id))
                    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
                    .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  }
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            const holidayName = getHoliday(day);
            return (
              <button
                key={day.toString()}
                onClick={() => onChange(dateStr)}
                title={holidayName || undefined}
                className={`aspect-square p-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center relative ${
                  isSelected 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : isCurrentMonth 
                    ? 'text-slate-300 hover:bg-white/5' 
                    : 'text-slate-700'
                } ${holidayName ? 'text-amber-500' : ''}`}
              >
                {format(day, 'd')}
                {holidayName && <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-amber-500 rounded-full"></div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const TimeGrid = ({ selected, onSelect, occupied = [] }: { selected: string; onSelect: (time: string) => void; occupied?: string[] }) => (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 15 }, (_, i) => i + 7).map(h => {
        const time = `${h.toString().padStart(2, '0')}:00`;
        const isOccupied = occupied.includes(time);
        return (
          <button
            key={time}
            disabled={isOccupied}
            onClick={() => onSelect(time)}
            className={`p-2 rounded-lg text-sm font-bold transition-all border ${
              isOccupied
              ? 'bg-gray-800/50 border-gray-800 text-gray-600 cursor-not-allowed'
              : selected === time 
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

// Removido componente duplicado já definido acima



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

// Movido para o escopo global

  const AgendaCard = ({ c }: { c: ScheduledClass }) => {
    const colorStyle = getCardColor(c.studentId);
    const [colorBase, colorVia, colorTo, borderStyle, textStyle] = colorStyle.split(' ');

    return (
      <div key={c.id} className={`p-5 rounded-[2rem] border-2 ${borderStyle} hover:scale-[1.02] transition-all group relative overflow-hidden flex flex-col justify-between h-full ${c.status === 'IN_PROGRESS' ? 'bg-gradient-to-br from-orange-600/40 via-amber-500/20 to-transparent border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'bg-slate-900/60'}`}>
        {/* Background gradient subtle */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colorBase} ${colorVia} ${colorTo} ${c.status === 'IN_PROGRESS' ? 'opacity-0' : 'opacity-40'}`}></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-3">
              <UserAvatar name={c.studentName || ''} photoUrl={c.studentPhoto} size="md" />
              <div className="min-w-0">
                <h4 className="text-white font-black uppercase tracking-tight text-sm">
                  {c.studentName}
                </h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">{c.className}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className={`flex items-center gap-1 text-[10px] font-black ${textStyle} bg-white/5 px-2 py-1 rounded-lg border border-current/20 uppercase`}>
                <Clock size={10} /> {c.startTime}
              </div>
              {c.status !== 'SCHEDULED' && getStatusIcon(c.status)}
            </div>
          </div>

          <div className="space-y-2 mb-4 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white bg-slate-950/50 p-2 rounded-xl border border-white/5">
              <CalendarIcon size={12} className="text-emerald-500" />
              <span>{format(new Date(c.classDate + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-slate-950/50 p-2 rounded-xl">
              <BookOpen size={12} className={textStyle.split(' ')[0]} />
              <span className="truncate">{disciplines.find(d => d.id === c.disciplineId)?.name || 'Aula Particular'}</span>
            </div>
            {c.rescheduledBy && (
              <div className="flex items-center gap-2 text-[10px] font-black text-amber-500/80 bg-amber-500/5 p-2 rounded-xl border border-amber-500/10 italic">
                <HistoryIcon size={12} /> Reagendada
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-auto">
            {c.status === 'SCHEDULED' && (
              <button 
                onClick={() => handleUpdateStatus(c.id, 'IN_PROGRESS')} 
                className="flex-1 min-w-[100px] py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" /> INICIAR
              </button>
            )}
            
            {c.status === 'IN_PROGRESS' && (
              <button 
                onClick={() => openCompletionModal(c)} 
                className="flex-1 min-w-[100px] py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle size={14} /> CONCLUIR
              </button>
            )}

            {c.status === 'SCHEDULED' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => openRescheduleModal(c)}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-gray-300 rounded-xl transition-all active:scale-95 border border-slate-700/50"
                  title="Alterar Horário"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => openDeleteModal(c.id)}
                  className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all active:scale-95 border border-rose-500/20"
                  title="Excluir Aula"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
        <div className="flex items-center gap-3">
          {c.pdfUrl ? (
            <div className="flex flex-col gap-1">
              {(() => {
                try {
                  if (c.pdfUrl.trim().startsWith('[')) {
                    const parsed = JSON.parse(c.pdfUrl) as { name: string, url: string }[];
                    return parsed.map((item, idx) => (
                      <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-black text-sky-400 hover:text-sky-300 uppercase underline">
                        <FileText size={12} /> {item.name}
                      </a>
                    ));
                  }
                } catch(e) {}
                return (
                  <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-black text-sky-400 hover:text-sky-300 uppercase underline">
                    <FileText size={12} /> PDF Aula
                  </a>
                );
              })()}
            </div>
          ) : (
            <span className="text-[9px] text-slate-600 font-bold uppercase ring-1 ring-slate-800 px-2 py-1 rounded">Sem Material</span>
          )}

          {userRole !== UserRole.STUDENT && (
            <button 
              onClick={() => {
                setUpdatingPDFId(c.id);
                historyFileInputRef.current?.click();
              }}
              className="p-1.5 bg-slate-800/50 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-500 rounded-lg transition-all"
              title="Alterar/Adicionar PDF"
            >
              <Edit2 size={12} />
            </button>
          )}
        </div>
        
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

  const agendaClasses = classes
    .filter(c => c.status !== 'CANCELLED' && c.classDate === format(agendaDate, 'yyyy-MM-dd'))
    .sort((a,b) => a.startTime.localeCompare(b.startTime));

  const historyFiltered = classes.filter(c => 
    (activeTab === 'agenda' ? true : c.classDate === currentDate) &&
    (userRole === UserRole.STUDENT ? (
      c.subjectNotes?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : (
      c.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    )) &&
    (!filterDiscipline || c.disciplineId === filterDiscipline) &&
    (!filterStudent || c.studentId === filterStudent)
  );

  const historyPaginated = historyFiltered
    .sort((a,b) => b.classDate.localeCompare(a.classDate) || b.startTime.localeCompare(a.startTime))
    .slice((activeTab === 'agenda' ? (agendaPage - 1) : (historyPage - 1)) * ITEMS_PER_PAGE, (activeTab === 'agenda' ? agendaPage : historyPage) * ITEMS_PER_PAGE);

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
            {(userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) && (
              <button 
                onClick={() => setActiveTab('finance')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'finance' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
            >
                <DollarSign size={16} /> Financeiro
              </button>
            )}
          </div>
  
          <div className="flex items-center gap-4">
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
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {activeTab === 'agenda' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {userRole !== UserRole.STUDENT && (
              <div className="lg:col-span-4 space-y-8">
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
                      <button 
                        onClick={() => handleBulkSendWeeklySchedules(agendaClasses)}
                        className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/30 ml-1"
                        title="Enviar agendas da semana para todos"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
  
                  <div className="space-y-3">
                    {agendaClasses.map(c => {
                        const isStarted = c.status === 'IN_PROGRESS';
                        const isCompleted = c.status === 'COMPLETED';
                        const isScheduled = c.status === 'SCHEDULED';
  
                        let cardStyle = "bg-[#0f172a]/60 border-gray-800/50 hover:border-emerald-500/30";
                        if (isStarted) cardStyle = "bg-gradient-to-r from-orange-600/30 to-amber-500/10 border-orange-500/40 shadow-lg shadow-orange-500/10 scale-[1.02]";
                        if (isScheduled) cardStyle = "bg-gradient-to-r from-sky-600/30 to-blue-500/10 border-sky-500/40 shadow-lg shadow-sky-500/10";
                        if (isCompleted) cardStyle = "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5 opacity-80";
  
                        return (
                          <div key={c.id} className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${cardStyle}`}>
                            <div className={`flex flex-col items-center min-w-[50px] py-1 border-r pr-4 ${isStarted ? 'border-orange-500/20' : isScheduled ? 'border-sky-500/20' : 'border-emerald-500/20'}`}>
                              <span className={`text-[10px] font-black uppercase tracking-tighter ${isStarted ? 'text-white' : isScheduled ? 'text-sky-200' : 'text-emerald-200'}`}>{c.startTime}</span>
                              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isStarted ? 'bg-white animate-pulse' : isScheduled ? 'bg-sky-500 animate-pulse' : 'bg-emerald-500'} transition-colors`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[13px] font-black text-white uppercase tracking-tight leading-tight mb-1.5">{c.studentName}</p>
                               <div className="flex items-center justify-between">
                                 <p className={`text-[9px] font-bold uppercase tracking-widest ${isStarted ? 'text-orange-200/60' : isScheduled ? 'text-sky-200/60' : 'text-emerald-200/60'}`}>
                                   {isStarted ? 'Aula em andamento' : isCompleted ? 'Aula concluída' : (disciplines.find(d => d.id === c.disciplineId)?.name || 'Agendada')}
                                 </p>
                                 <div className="flex items-center gap-2">
                                   {(c.studentPhone || c.parentPhone) && (
                                     <>
                                       {(c.studentPhone || c.parentPhone) && (
                                         <>
                                           <button onClick={() => handleWhatsAppMessage((c.studentPhone || c.parentPhone)!, c.studentName || '', c.startTime)} className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded-lg"><MessageCircle size={12} /></button>
                                           <button onClick={() => handleSendWeeklySchedule(c.studentId, c.studentName || '', (c.studentPhone || c.parentPhone)!)} className="p-1 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Share2 size={11} /></button>
                                         </>
                                       )}
                                       {c.parentPhone && (
                                          <button onClick={() => handleNotifyParentCompletion(c.studentId, c.studentName || '', c.parentPhone, c.classDate)} className="p-1 hover:bg-purple-500/20 text-purple-400 rounded-lg"><Users size={12} /></button>
                                       )}
                                     </>
                                   )}
                                 </div>
                               </div>
                             </div>
                             <div className="flex gap-2">
                              {isScheduled && (
                                <>
                                  <button onClick={() => handleUpdateStatus(c.id, 'IN_PROGRESS')} className="p-2.5 bg-amber-400 rounded-xl" title="Iniciar Aula"><Play size={14} /></button>
                                  <button onClick={() => openRescheduleModal(c)} className="p-2.5 bg-slate-800 rounded-xl" title="Editar"><Edit2 size={14} /></button>
                                  <button onClick={() => openDeleteModal(c.id)} className="p-2.5 bg-rose-500/10 rounded-xl" title="Cancelar"><Trash2 size={14} /></button>
                                </>
                              )}
                              {isStarted && <button onClick={() => openCompletionModal(c)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase">Concluir</button>}
                              {isCompleted && <CheckCircle size={20} className="text-emerald-500" />}
                            </div>
                          </div>
                        );
                      })}
                    {agendaClasses.length === 0 && (
                      <div className="text-center py-10 opacity-30 select-none">
                        <CalendarIcon size={48} className="mx-auto mb-2" />
                        <p className="text-xs font-black uppercase tracking-widest">Sem aulas pendentes</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
  
            <div className={`${userRole === UserRole.STUDENT ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
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
                      <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${viewMode === 'table' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}>Lista</button>
                      <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${viewMode === 'calendar' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}>Calendário</button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                      <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs pl-10 pr-4 py-3 w-48" />
                    </div>
                  </div>
                </div>
  
                {viewMode === 'calendar' ? (
                  <div className="p-8">
                    <ModernCalendar classes={classes} userRole={userRole} onSelectClass={setSelectedClass} onRescheduleClass={userRole !== UserRole.STUDENT ? handleDragReschedule : undefined} />
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {historyPaginated.map(c => <AgendaCard key={c.id} c={c} />)}
                    </div>
                    <Pagination current={agendaPage} total={historyFiltered.length} onPageChange={setAgendaPage} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'finance' && (userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) ? (
          <FinanceTab />
        ) : (
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

              </div>

              <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {historyPaginated.map(c => <HistoryCard key={c.id} c={c} />)}
                  </div>
                  
                  {historyFiltered.length === 0 && (
                    <div className="text-center py-20 opacity-30 select-none">
                      <FileText size={64} className="mx-auto mb-4" />
                      <p className="text-xl font-black uppercase tracking-[0.2em]">Nenhum histórico encontrado</p>
                    </div>
                  )}

                  <Pagination 
                    current={historyPage} 
                    total={historyFiltered.length} 
                    onPageChange={setHistoryPage} 
                  />
              </div>
            </div>
          </div>
        )}
      </div>

    <input 
      type="file" 
      ref={historyFileInputRef} 
      className="hidden" 
      accept=".pdf"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file || !updatingPDFId) return;
        
        onShowToast('Enviando PDF...');
        try {
          const url = await SupabaseService.uploadPDF(file);
          if (url) {
            const currentClass = classes.find(cl => cl.id === updatingPDFId);
            const success = await SupabaseService.updateScheduledClassStatus(updatingPDFId, currentClass?.status || 'COMPLETED', { pdfUrl: url });
            if (success) {
              onShowToast('PDF atualizado com sucesso!');
              fetchData();
            } else {
              onShowToast('Erro ao atualizar registro.');
            }
          } else {
            onShowToast('Erro no upload do arquivo.');
          }
        } catch (err) {
          onShowToast('Erro na operação.');
        } finally {
          setUpdatingPDFId(null);
          if (historyFileInputRef.current) historyFileInputRef.current.value = '';
        }
      }}
    />

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
                    occupied={classes
                      .filter(c => c.classDate === newClass.classDate && c.status !== 'CANCELLED')
                      .map(c => c.startTime)
                    }
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
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                  placeholder="Descreva o conteúdo da aula..."
                  value={completionData.subjectNotes}
                  onChange={(e) => setCompletionData({ ...completionData, subjectNotes: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Previsão de Pagamento</label>
                <input 
                  type="date"
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  value={completionData.paymentDueDate}
                  onChange={(e) => setCompletionData({ ...completionData, paymentDueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Anexar Materiais (Múltiplos)</label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,image/*" 
                  multiple
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setCompletionData({ ...completionData, pdfFiles: [...completionData.pdfFiles, ...files] });
                  }}
                />
                {completionData.pdfFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                     {completionData.pdfFiles.map((file, idx) => (
                         <div key={idx} className="flex justify-between items-center text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1"><CheckCircle size={10} /> {file.name}</span>
                            <button onClick={() => setCompletionData({...completionData, pdfFiles: completionData.pdfFiles.filter((_, i) => i !== idx)})} className="text-rose-500 hover:text-rose-400 p-1"><XCircle size={12} /></button>
                         </div>
                     ))}
                  </div>
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
          <div className="bg-[#1e293b] w-full max-w-2xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-blue-500/10">
              <h2 className="text-lg font-black text-white flex items-center gap-3 text-blue-500 uppercase tracking-tight">
                <Edit2 size={20} /> Alterar Horário
              </h2>
              <button onClick={() => setShowRescheduleModal(false)} className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl transition-all">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Nova Data</label>
                  <div className="scale-95 origin-top-left">
                    <ModernDatePicker value={rescheduleData.date} onChange={(date) => setRescheduleData({ ...rescheduleData, date })} />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="registerHistory"
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/50"
                    checked={registerHistory}
                    onChange={(e) => setRegisterHistory(e.target.checked)}
                  />
                  <label htmlFor="registerHistory" className="text-[10px] font-black text-gray-300 cursor-pointer select-none uppercase tracking-widest">
                    Registrar Histórico?
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Novo Horário</label>
                  <TimeGrid 
                    selected={rescheduleData.startTime} 
                    occupied={classes
                      .filter(c => 
                        c.classDate === rescheduleData.date && 
                        c.status !== 'CANCELLED' && 
                        c.id !== selectedClass.id
                      )
                      .map(c => c.startTime)
                    }
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

                <button 
                  onClick={handleConfirmReschedule} 
                  className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  Confirmar Alteração
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-3xl border border-gray-700 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-700 flex justify-between items-center bg-rose-500/10 text-rose-500">
               <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                 <Trash2 size={24} /> Excluir Aula
               </h2>
               <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-white"><XCircle size={28} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <p className="text-sm text-gray-400 font-bold leading-relaxed text-center">
                Deseja realmente excluir este agendamento? Esta ação não pode ser desfeita.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="registerDeleteHistory"
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500/50"
                    checked={registerDeleteHistory}
                    onChange={(e) => setRegisterDeleteHistory(e.target.checked)}
                  />
                  <label htmlFor="registerDeleteHistory" className="text-xs font-black text-gray-300 cursor-pointer select-none uppercase tracking-widest">
                    Registrar motivo (Histórico)?
                  </label>
                </div>

                {registerDeleteHistory && (
                  <textarea 
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/50 h-24"
                    placeholder="Motivo da exclusão..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteClass}
                  className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95"
                >
                  Excluir Aula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
