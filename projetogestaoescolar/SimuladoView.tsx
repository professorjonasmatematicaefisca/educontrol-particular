import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  BookOpen, 
  Timer,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  Send,
  Trash2,
  Edit3,
  BarChart3,
  FileText,
  PlayCircle,
  Eye,
  Filter,
  XCircle,
  Copy,
  ChevronLeft
} from 'lucide-react';
import { UserRole, Simulado, SimuladoAssignment, Student, Discipline } from './types';
import { SupabaseService } from './services/supabaseService';
import { SimuladoCreator } from './SimuladoCreator';
import { SimuladoPlayer } from './SimuladoPlayer';

interface SimuladoViewProps {
  userRole: UserRole;
  userEmail: string;
  students: Student[];
  disciplines: Discipline[];
  onShowToast: (msg: string) => void;
}

type StudentFilter = 'ALL' | 'PENDING' | 'COMPLETED';

export const SimuladoView: React.FC<SimuladoViewProps> = ({ 
  userRole, 
  userEmail, 
  students, 
  disciplines,
  onShowToast 
}) => {
  const [activeTab, setActiveTab] = useState<'my_simulados' | 'assignments' | 'results'>('my_simulados');
  const [repoTab, setRepoTab] = useState<'SIMULADO' | 'LISTA'>('SIMULADO');
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [editingSimulado, setEditingSimulado] = useState<Simulado | null>(null);
  const [assignments, setAssignments] = useState<SimuladoAssignment[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [activeSimulado, setActiveSimulado] = useState<Simulado | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<SimuladoAssignment | null>(null);
  const [viewingCompleted, setViewingCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentFilter, setStudentFilter] = useState<StudentFilter>('ALL');
  const [loading, setLoading] = useState(true);

  // Filtros da aba de Resultados (Professor)
  const [resultsNameFilter, setResultsNameFilter] = useState('');
  const [resultsDateFilter, setResultsDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK'>('ALL');
  const [resultsStatusFilter, setResultsStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'OVERDUE'>('ALL');

  // Navigation states for Results Tab
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    setExpandedClass(null);
    setExpandedStudent(null);
  }, [activeTab]);

  // Atribuição Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSimulado, setSelectedSimulado] = useState<Simulado | null>(null);
  const [assignData, setAssignData] = useState({
    studentId: '',
    classId: '',
    assignMode: 'INDIVIDUAL' as 'INDIVIDUAL' | 'CLASS',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) // 7 days from now
  });

  const uniqueClasses = [...new Set(students.map(s => s.className))].filter(Boolean).sort();

  useEffect(() => {
    fetchData();
  }, [userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (userRole === UserRole.STUDENT) {
        const data = await SupabaseService.getSimuladoAssignments(userEmail);
        setAssignments(data);
        setActiveTab('assignments');
      } else {
        const [sims, assigns] = await Promise.all([
          SupabaseService.getSimulados(),
          SupabaseService.getSimuladoAssignments()
        ]);
        setSimulados(sims);
        setAssignments(assigns);
      }
    } catch (error) {
      console.error('Error fetching simulados:', error);
      onShowToast('Erro ao carregar atividades.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (assignData.assignMode === 'INDIVIDUAL' && !assignData.studentId) {
      onShowToast('Selecione um aluno para continuar.');
      return;
    }
    if (assignData.assignMode === 'CLASS' && !assignData.classId) {
      onShowToast('Selecione uma turma para continuar.');
      return;
    }
    if (!selectedSimulado) return;

    // Convert datetime-local value to ISO string
    const dueDateISO = assignData.dueDate 
      ? new Date(assignData.dueDate).toISOString() 
      : undefined;

    const targetStudentIds = assignData.assignMode === 'CLASS' 
      ? students.filter(s => s.className === assignData.classId).map(s => s.id)
      : [assignData.studentId];

    if (targetStudentIds.length === 0) {
      onShowToast('Nenhum aluno encontrado nesta turma.');
      return;
    }

    const result = await SupabaseService.assignSimuladoBulk({
      simuladoId: selectedSimulado.id,
      studentIds: targetStudentIds,
      teacherId: userEmail,
      dueDate: dueDateISO
    });

    if (result.success) {
      onShowToast('Atribuído com sucesso!');
      setShowAssignModal(false);
      setAssignData({ 
        studentId: '', 
        classId: '', 
        assignMode: 'INDIVIDUAL', 
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) 
      });
      fetchData();
    } else {
      onShowToast(`Erro: ${result.error || 'Erro ao atribuir. Tente novamente.'}`);
    }
  };

  const handleOpenAssignment = (assignment: SimuladoAssignment) => {
    if (!assignment.simulado) return;
    setActiveAssignment(assignment);
    setActiveSimulado(assignment.simulado);
    setViewingCompleted(assignment.status === 'COMPLETED');
  };

  const filteredAssignments = assignments.filter(a => {
    if (studentFilter === 'PENDING') return a.status !== 'COMPLETED';
    if (studentFilter === 'COMPLETED') return a.status === 'COMPLETED';
    return true;
  });

  const nearDueAssignments = assignments.filter(a => {
    if (a.status === 'COMPLETED') return false;
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    const now = new Date();
    const diff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });

  if (showCreator) {
    return (
      <SimuladoCreator 
        disciplines={disciplines} 
        teacherEmail={userEmail}
        editingSimulado={editingSimulado}
        onSave={() => { 
          setShowCreator(false); 
          setEditingSimulado(null);
          fetchData(); 
        }}
        onCancel={() => {
          setShowCreator(false);
          setEditingSimulado(null);
        }}
        onShowToast={onShowToast}
      />
    );
  }

  if (activeSimulado && activeAssignment) {
    if (viewingCompleted) {
      return (
        <SimuladoPlayer 
          simulado={activeSimulado}
          studentId={userEmail}
          assignmentId={activeAssignment.id}
          initialAnswers={activeAssignment.answers || []}
          initialMode="REVIEW"
          onComplete={() => {
            setActiveSimulado(null);
            setActiveAssignment(null);
            setViewingCompleted(false);
          }}
          onCancel={() => { 
            setActiveSimulado(null); 
            setActiveAssignment(null); 
            setViewingCompleted(false); 
          }}
        />
      );
    }

    return (
      <SimuladoPlayer 
        simulado={activeSimulado}
        studentId={userEmail}
        assignmentId={activeAssignment.id}
        onComplete={(score) => {
          onShowToast(`Parabéns! Você completou com nota ${score}%`);
          setActiveSimulado(null);
          setActiveAssignment(null);
          fetchData();
        }}
        onCancel={() => { setActiveSimulado(null); setActiveAssignment(null); }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl">
        <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-2xl border border-slate-800">
          {(userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) && (
            <button 
              onClick={() => setActiveTab('my_simulados')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'my_simulados' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <FileText size={14} /> Repositório
            </button>
          )}
          <button 
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'assignments' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Clock size={14} /> {userRole === UserRole.STUDENT ? 'Minhas Atividades' : 'Atribuições'}
          </button>
          {(userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) && (
            <button 
              onClick={() => setActiveTab('results')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'results' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <BarChart3 size={14} /> Resultados
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                placeholder="Buscar títulos, tópicos..."
                className="bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all w-64 md:w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           {(userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) && (
             <button 
                onClick={() => { setEditingSimulado(null); setShowCreator(true); }}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
             >
                <Plus size={20} /> Novo Conteúdo
             </button>
           )}
        </div>
      </div>

      {activeTab === 'my_simulados' && (
        <div className="flex justify-start gap-4 mb-4">
          <button 
            onClick={() => setRepoTab('SIMULADO')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${repoTab === 'SIMULADO' ? 'bg-white text-black' : 'bg-slate-900/40 text-slate-500 border border-slate-800'}`}
          >
            Simulados
          </button>
          <button 
            onClick={() => setRepoTab('LISTA')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${repoTab === 'LISTA' ? 'bg-white text-black' : 'bg-slate-900/40 text-slate-500 border border-slate-800'}`}
          >
            Listas de Exercícios
          </button>
        </div>
      )}

      {activeTab === 'assignments' && userRole === UserRole.STUDENT && (
        <div className="flex items-center gap-3">
          <Filter size={14} className="text-slate-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filtrar:</span>
          {(['ALL', 'PENDING', 'COMPLETED'] as StudentFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStudentFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                studentFilter === f 
                  ? f === 'PENDING' ? 'bg-amber-500 text-black' 
                  : f === 'COMPLETED' ? 'bg-emerald-500 text-white' 
                  : 'bg-white text-black'
                  : 'bg-slate-900/40 text-slate-500 border border-slate-800 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendentes' : 'Concluídas'}
            </button>
          ))}
          <span className="ml-auto text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {filteredAssignments.length} atividade(s)
          </span>
        </div>
      )}

      {activeTab === 'assignments' && nearDueAssignments.length > 0 && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Timer size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic uppercase">Próximos Prazos</h3>
              <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">Atividades que vencem nos próximos 3 dias</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearDueAssignments.map(a => (
              <div 
                key={`reminder-${a.id}`}
                onClick={() => handleOpenAssignment(a)}
                className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-amber-500/10 transition-all group"
              >
                <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-white uppercase truncate">{a.simulado?.contentTopic || a.simulado?.title}</h4>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                    Vence em {a.dueDate ? new Date(a.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem data'}
                  </p>
                </div>
                <ArrowRight size={16} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center opacity-30 animate-pulse">
           <Timer size={64} className="mx-auto mb-4" />
           <p className="text-sm font-black uppercase tracking-widest">Carregando conteúdos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeTab === 'my_simulados' && simulados
            .filter(s => s.type === repoTab)
            .filter(s => {
              if (!searchTerm) return true;
              const search = searchTerm.toLowerCase();
              const discName = disciplines.find(d => d.id === s.disciplineId)?.name?.toLowerCase() || '';
              const contentTopic = s.contentTopic?.toLowerCase() || '';
              return s.title.toLowerCase().includes(search) || 
                     contentTopic.includes(search) ||
                     discName.includes(search);
            })
            .map(s => (
            <div key={s.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl backdrop-blur-xl group hover:border-emerald-500/30 transition-all flex flex-col h-full relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    {(userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => { setEditingSimulado(s); setShowCreator(true); }}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
                          title="Editar"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm('Tem certeza que deseja excluir?')) {
                              await SupabaseService.deleteSimulado(s.id);
                              onShowToast('Excluído com sucesso!');
                              fetchData();
                            }
                          }}
                          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-500 transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-950 text-slate-500 rounded-full text-[8px] font-black uppercase border border-white/5">
                  {s.type}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mb-1 leading-tight group-hover:text-emerald-400 transition-colors uppercase italic">
                {s.contentTopic || s.title}
              </h3>
              <div className="flex flex-col gap-0.5 mb-6 flex-1">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{s.title}</p>
                <p className="text-[10px] text-slate-500 font-bold line-clamp-2 italic">{s.description || 'Sem descrição.'}</p>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-slate-950/50 text-emerald-500 rounded-lg text-[9px] font-black uppercase border border-emerald-500/10">
                     {disciplines.find(d => d.id === s.disciplineId)?.name || 'Geral'}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-950/50 text-sky-500 rounded-lg text-[9px] font-black uppercase border border-sky-500/10">
                     {s.questions.length} Questões
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedSimulado(s); setShowAssignModal(true); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                  >
                    <Send size={14} /> Atribuir
                  </button>
                  <button 
                    onClick={() => {
                        const msg = `Olá! Você tem uma nova atividade: *${s.title}*.\n\nAcesse o Portal do Aluno: https://projetogestaoescolar.vercel.app\nLogin: Seu Nome + Sobrenome\nSenha: 2026`;
                        navigator.clipboard.writeText(msg);
                        onShowToast('Link e instruções copiados!');
                    }}
                    className="px-4 flex items-center justify-center bg-slate-800 text-slate-300 rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 border border-slate-700 hover:border-emerald-500"
                    title="Copiar instruções para o aluno"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'assignments' && filteredAssignments.map(a => {
            const isPending = a.status !== 'COMPLETED';
            const overdue = a.dueDate && new Date(a.dueDate) < new Date() && isPending;
            
            return (
              <div 
                key={a.id} 
                onClick={() => handleOpenAssignment(a)}
                className={`bg-slate-900/40 border p-4 rounded-2xl backdrop-blur-xl group transition-all flex flex-col h-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  !isPending 
                    ? 'border-emerald-500/30 hover:border-emerald-500/60' 
                    : overdue
                      ? 'border-rose-500/30 hover:border-rose-500/60'
                      : 'border-slate-800 hover:border-amber-500/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${
                    !isPending ? 'bg-emerald-500/10 text-emerald-500' 
                    : overdue ? 'bg-rose-500/10 text-rose-500'
                    : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {!isPending ? <CheckCircle2 size={20} /> : overdue ? <XCircle size={20} /> : <Timer size={20} />}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase border ${
                      !isPending
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : overdue
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/10'
                    }`}>
                      {!isPending ? 'Concluída' : overdue ? 'Em Atraso' : 'Pendente'}
                    </span>
                    {!isPending && a.score !== undefined && (
                      <span className="text-[10px] font-black text-emerald-400">Nota: {a.score}%</span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-black text-white mb-0.5 uppercase italic leading-tight group-hover:text-emerald-400 transition-colors truncate">
                  {a.simulado?.contentTopic || a.simulado?.title || 'Atividade'}
                </h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1 truncate">
                  {a.simulado?.title}
                </p>
                
                {a.simulado && (
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={10} className="text-slate-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase">
                      {a.simulado.questions?.length || 0} questões
                    </span>
                  </div>
                )}
                
                <div className="mt-auto pt-3 border-t border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase">
                    <span className={overdue && isPending ? 'text-rose-400' : 'text-slate-500'}>Prazo</span>
                    <span className={`${overdue && isPending ? 'text-rose-400' : 'text-white'}`}>
                      {a.dueDate 
                        ? new Date(a.dueDate).toLocaleString('pt-BR', { day: '2-digit', month: 'short' })
                        : 'Sem prazo'}
                    </span>
                  </div>
                  
                  <div className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-xl ${
                    !isPending
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white'
                      : 'bg-emerald-500 text-white shadow-emerald-500/20 group-hover:bg-emerald-600'
                  }`}>
                    {!isPending 
                      ? <><Eye size={12} /> Ver Desempenho</> 
                      : <><PlayCircle size={12} /> Iniciar</>}
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}

          {activeTab === 'results' && userRole !== UserRole.STUDENT && (
            <div className="col-span-full">
               {!expandedClass ? (
                 <div className="space-y-6 animate-in fade-in duration-500">
                    <h3 className="text-xl font-black text-white px-2">Turmas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {uniqueClasses.map(className => (
                        <div 
                          key={className}
                          onClick={() => setExpandedClass(className)}
                          className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-emerald-500/50 cursor-pointer transition-all group"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                 <BookOpen size={24} />
                              </div>
                              <div className="flex flex-col">
                                 <h4 className="text-lg font-black uppercase text-white">{className}</h4>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {students.filter(s => s.className === className).length} Alunos
                                 </span>
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                 </div>
               ) : !expandedStudent ? (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-4 mb-6">
                       <button 
                         onClick={() => setExpandedClass(null)}
                         className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all group"
                       >
                         <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                       </button>
                       <h3 className="text-xl font-black text-white">Turma: {expandedClass}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {students
                         .filter(s => s.className === expandedClass)
                         .sort((a, b) => {
                            const aAssigns = assignments.filter(assign => assign.studentId === a.id);
                            const bAssigns = assignments.filter(assign => assign.studentId === b.id);
                            const lastA = Math.max(...aAssigns.map(as => as.completedAt ? new Date(as.completedAt).getTime() : (as.dueDate ? new Date(as.dueDate).getTime() : new Date(as.createdAt || 0).getTime())), 0);
                            const lastB = Math.max(...bAssigns.map(as => as.completedAt ? new Date(as.completedAt).getTime() : (as.dueDate ? new Date(as.dueDate).getTime() : new Date(as.createdAt || 0).getTime())), 0);
                            return lastB - lastA;
                         })
                         .map(student => {
                           const studentAssigns = assignments.filter(a => a.studentId === student.id);
                           const pendingCount = studentAssigns.filter(a => a.status !== 'COMPLETED').length;
                           return (
                             <div 
                               key={student.id}
                               onClick={() => setExpandedStudent(student.id)}
                               className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-emerald-500/30 cursor-pointer transition-all group flex items-center justify-between"
                             >
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all">
                                      <User size={20} />
                                   </div>
                                   <div className="flex flex-col">
                                      <h4 className="text-sm font-black text-white truncate max-w-[120px]" title={student.name}>{student.name}</h4>
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                         {studentAssigns.length} Atividades
                                      </span>
                                   </div>
                                </div>
                                {pendingCount > 0 && (
                                   <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-lg border border-amber-500/20 whitespace-nowrap">
                                      {pendingCount} Pendente{pendingCount !== 1 && 's'}
                                   </span>
                                )}
                             </div>
                           );
                         })}
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-800/50 pb-6 mb-2">
                       <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setExpandedStudent(null)}
                            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all group"
                          >
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                          </button>
                          <div>
                            <h3 className="text-xl font-black text-white">{students.find(s => s.id === expandedStudent)?.name}</h3>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{expandedClass}</span>
                          </div>
                       </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-xl">
                       <div className="flex-1 relative">
                          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Buscar atividade por título..." 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition-all"
                            value={resultsNameFilter}
                            onChange={e => setResultsNameFilter(e.target.value)}
                          />
                       </div>
                       
                       <div className="flex items-center gap-2">
                          <CalendarIcon size={16} className="text-slate-500 hidden md:block" />
                          <select 
                            className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition-all"
                            value={resultsDateFilter}
                            onChange={e => setResultsDateFilter(e.target.value as any)}
                          >
                             <option value="ALL">Todas as Datas</option>
                             <option value="TODAY">Hoje</option>
                             <option value="WEEK">Nesta Semana</option>
                          </select>
                       </div>

                       <div className="flex items-center gap-2">
                          <Filter size={16} className="text-slate-500 hidden md:block" />
                          <select 
                            className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition-all"
                            value={resultsStatusFilter}
                            onChange={e => setResultsStatusFilter(e.target.value as any)}
                          >
                             <option value="ALL">Todos os Status</option>
                             <option value="COMPLETED">Concluídos</option>
                             <option value="PENDING">Pendentes</option>
                             <option value="OVERDUE">Atrasados</option>
                          </select>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {assignments
                        .filter(a => a.studentId === expandedStudent)
                        .filter(a => {
                          const isPending = a.status !== 'COMPLETED';
                          const overdue = isPending && a.dueDate && new Date(a.dueDate) < new Date();
                          const computedStatus = a.status === 'COMPLETED' ? 'COMPLETED' : overdue ? 'OVERDUE' : 'PENDING';

                          const titleMatches = a.simulado?.title?.toLowerCase()?.includes(resultsNameFilter.toLowerCase()) || a.simulado?.contentTopic?.toLowerCase()?.includes(resultsNameFilter.toLowerCase());
                          if (resultsNameFilter && !titleMatches) return false;

                          if (resultsDateFilter !== 'ALL') {
                             const targetDate = a.completedAt ? new Date(a.completedAt) : (a.dueDate ? new Date(a.dueDate) : new Date(a.createdAt || 0));
                             const now = new Date();
                             if (resultsDateFilter === 'TODAY' && targetDate.toDateString() !== now.toDateString()) return false;
                             const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                             if (resultsDateFilter === 'WEEK' && targetDate < weekAgo) return false;
                          }

                          if (resultsStatusFilter !== 'ALL' && computedStatus !== resultsStatusFilter) return false;
                          return true;
                        })
                        .sort((a, b) => {
                           if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return -1;
                           if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return 1;
                           const tA = a.completedAt ? new Date(a.completedAt).getTime() : (a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.createdAt || 0).getTime());
                           const tB = b.completedAt ? new Date(b.completedAt).getTime() : (b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.createdAt || 0).getTime());
                           return tB - tA;
                        })
                        .map(a => {
                          const isPending = a.status !== 'COMPLETED';
                          const overdue = isPending && a.dueDate && new Date(a.dueDate) < new Date();

                          const formatTime = (seconds?: number) => {
                             if (!seconds) return '-- : --';
                             const m = Math.floor(seconds / 60);
                             const s = seconds % 60;
                             return `${m}m ${s}s`;
                          };

                          return (
                            <div 
                              key={a.id} 
                              className={`flex flex-col gap-3 p-4 bg-slate-900/40 border rounded-2xl backdrop-blur-xl group transition-all ${
                                 !isPending 
                                   ? 'border-emerald-500/20 hover:border-emerald-500/50 cursor-pointer' 
                                   : overdue 
                                     ? 'border-rose-500/20' 
                                     : 'border-amber-500/20'
                              }`}
                              onClick={() => { if (!isPending) handleOpenAssignment(a); }}
                            >
                               <div className="flex items-center justify-between">
                                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md border ${
                                     !isPending ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                     overdue ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                     'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  }`}>
                                     {!isPending ? 'Concluído' : overdue ? 'Atrasado' : 'Pendente'}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                     <Timer size={10} /> 
                                     {!isPending && a.completedAt 
                                       ? new Date(a.completedAt).toLocaleDateString('pt-BR') 
                                       : (a.dueDate ? new Date(a.dueDate).toLocaleDateString('pt-BR') : 'Sem Prazo')}
                                  </span>
                               </div>

                               <div className="flex flex-col">
                                  <span className="text-sm font-black text-white uppercase truncate" title={a.simulado?.title}>{a.simulado?.title || 'Atividade Excluída'}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5" title={a.simulado?.contentTopic}>
                                     {a.simulado?.contentTopic || 'Sem Tópico'}
                                  </span>
                               </div>

                               {!isPending && (
                                  <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800">
                                     <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nota</span>
                                        <span className="text-sm font-black text-emerald-400">{a.score}%</span>
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tempo</span>
                                        <span className="text-sm font-black text-sky-400">{formatTime(a.timeSpentSeconds)}</span>
                                     </div>
                                  </div>
                               )}
                            </div>
                          );
                        })}
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      )}

      {!loading && ((activeTab === 'my_simulados' && simulados.length === 0) || (activeTab === 'assignments' && filteredAssignments.length === 0)) && (
        <div className="py-32 text-center opacity-30 select-none bg-slate-900/20 border border-slate-800 border-dashed rounded-[3rem]">
           <BookOpen size={80} className="mx-auto mb-6 text-emerald-500" />
           <p className="text-2xl font-black uppercase tracking-[0.3em]">
             {activeTab === 'assignments' && studentFilter !== 'ALL' 
               ? `Nenhuma atividade ${studentFilter === 'PENDING' ? 'pendente' : 'concluída'}`
               : 'Nada por aqui ainda'
             }
           </p>
           <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest">
             {activeTab === 'assignments' ? 'Aguarde seu professor atribuir atividades' : 'Comece criando seu primeiro conteúdo premium'}
           </p>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-[#1e293b] w-full max-w-lg rounded-[3rem] border border-white/10 p-12 space-y-8 animate-in zoom-in-95 leading-relaxed">
              <div className="space-y-2">
                 <h3 className="text-2xl font-black">Atribuir Atividade</h3>
                 <p className="text-slate-400 text-sm italic">
                   {selectedSimulado?.contentTopic || selectedSimulado?.title}
                 </p>
              </div>

              <div className="space-y-6">
                 {/* Mode Selector Toggle */}
                 <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                    <button 
                      onClick={() => setAssignData({...assignData, assignMode: 'INDIVIDUAL'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${assignData.assignMode === 'INDIVIDUAL' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      <User size={14} /> Aluno Individual
                    </button>
                    <button 
                      onClick={() => setAssignData({...assignData, assignMode: 'CLASS'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${assignData.assignMode === 'CLASS' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Plus size={14} /> Turma Inteira
                    </button>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {assignData.assignMode === 'INDIVIDUAL' ? 'Selecione o Aluno' : 'Selecione a Turma'}
                    </label>
                    <div className="relative">
                       {assignData.assignMode === 'INDIVIDUAL' ? (
                         <>
                           <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                           <select 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                            value={assignData.studentId}
                            onChange={(e) => setAssignData({...assignData, studentId: e.target.value})}
                           >
                             <option value="">Escolher aluno...</option>
                             {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                         </>
                       ) : (
                         <>
                           <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                           <select 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                            value={assignData.classId}
                            onChange={(e) => setAssignData({...assignData, classId: e.target.value})}
                           >
                             <option value="">Escolher turma...</option>
                             {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                         </>
                       )}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prazo Final (Data e Hora)</label>
                    <div className="relative">
                       <CalendarIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                        type="datetime-local"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all [color-scheme:dark]"
                        value={assignData.dueDate}
                        onChange={(e) => setAssignData({...assignData, dueDate: e.target.value})}
                       />
                    </div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest pl-1">
                      Opcional — deixe em branco para sem prazo
                    </p>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                  onClick={handleAssign}
                  className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-500/20 transition-all active:scale-95"
                 >
                    ✅ Confirmar Atribuição
                 </button>
                 <button 
                  onClick={() => setShowAssignModal(false)}
                  className="w-full py-5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all"
                 >
                    Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
