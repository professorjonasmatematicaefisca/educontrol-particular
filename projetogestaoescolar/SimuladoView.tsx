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
  XCircle
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

  // Atribuição Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSimulado, setSelectedSimulado] = useState<Simulado | null>(null);
  const [assignData, setAssignData] = useState({
    studentId: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) // 7 days from now
  });

  useEffect(() => {
    fetchData();
  }, [userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (userRole === UserRole.STUDENT) {
        // Aluno vê suas atribuições — userEmail contém o UUID do aluno (ver Login.tsx)
        const data = await SupabaseService.getSimuladoAssignments(userEmail);
        setAssignments(data);
        setActiveTab('assignments');
      } else {
        // Professor vê repositório e atribuições feitas por ele
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
    if (!assignData.studentId || !selectedSimulado) {
      onShowToast('Selecione um aluno para continuar.');
      return;
    }

    // Convert datetime-local value to ISO string
    const dueDateISO = assignData.dueDate 
      ? new Date(assignData.dueDate).toISOString() 
      : undefined;

    const success = await SupabaseService.assignSimulado({
      simuladoId: selectedSimulado.id,
      studentId: assignData.studentId,
      teacherId: userEmail, // supabaseService will resolve email → UUID
      dueDate: dueDateISO
    });

    if (success) {
      onShowToast('✅ Atribuído com sucesso!');
      setShowAssignModal(false);
      setAssignData({ studentId: '', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) });
      fetchData();
    } else {
      onShowToast('❌ Erro ao atribuir. Tente novamente.');
    }
  };

  const handleOpenAssignment = (assignment: SimuladoAssignment) => {
    if (!assignment.simulado) return;
    setActiveAssignment(assignment);
    setActiveSimulado(assignment.simulado);
    setViewingCompleted(assignment.status === 'COMPLETED');
  };

  // Filter assignments for student view
  const filteredAssignments = assignments.filter(a => {
    if (studentFilter === 'PENDING') return a.status !== 'COMPLETED';
    if (studentFilter === 'COMPLETED') return a.status === 'COMPLETED';
    return true;
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
    // If viewing a completed assignment, show a read-only review
    if (viewingCompleted) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => { setActiveSimulado(null); setActiveAssignment(null); setViewingCompleted(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase transition-all"
            >
              <XCircle size={16} /> Voltar
            </button>
            <div>
              <h2 className="text-2xl font-black text-white">{activeSimulado.title}</h2>
              <p className="text-xs text-emerald-500 font-black uppercase tracking-widest">Revisando atividade concluída</p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-emerald-500/20 p-8 rounded-[2.5rem] text-center">
            <CheckCircle2 size={64} className="mx-auto mb-4 text-emerald-500" />
            <p className="text-xl font-black text-white mb-2">Atividade já foi concluída!</p>
            <p className="text-sm text-slate-400">Você completou esta atividade. Em breve você poderá ver suas respostas aqui.</p>
          </div>
          {/* Questions preview */}
          <div className="space-y-4">
            {activeSimulado.questions.map((q, i) => (
              <div key={q.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem]">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Questão {i + 1}</p>
                <p className="text-white font-bold">{q.statement}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <SimuladoPlayer 
        simulado={activeSimulado}
        studentId={userEmail}
        assignmentId={activeAssignment.id}
        onComplete={(score) => {
          onShowToast(`🎉 Parabéns! Você completou com nota ${score}%`);
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
      {/* Header com Abas e Ações */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl">
        <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-2xl border border-slate-800">
          {userRole !== UserRole.STUDENT && (
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
          {userRole !== UserRole.STUDENT && (
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
           {userRole !== UserRole.STUDENT && (
             <button 
                onClick={() => { setEditingSimulado(null); setShowCreator(true); }}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
             >
                <Plus size={20} /> Novo Conteúdo
             </button>
           )}
        </div>
      </div>

      {/* Repo tab selector */}
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

      {/* Student filter bar (only in assignments tab for student) */}
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

      {/* Grid de Cards */}
      {loading ? (
        <div className="py-20 text-center opacity-30 animate-pulse">
           <Timer size={64} className="mx-auto mb-4" />
           <p className="text-sm font-black uppercase tracking-widest">Carregando conteúdos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div key={s.id} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl group hover:border-emerald-500/30 transition-all flex flex-col h-full relative">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    {userRole !== UserRole.STUDENT && (
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
                <button 
                  onClick={() => { setSelectedSimulado(s); setShowAssignModal(true); }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                >
                  <Send size={14} /> Atribuir ao Aluno
                </button>
              </div>
            </div>
          ))}

          {/* STUDENT: full activity panel */}
          {activeTab === 'assignments' && filteredAssignments.map(a => {
            const isPending = a.status !== 'COMPLETED';
            const overdue = a.dueDate && new Date(a.dueDate) < new Date() && isPending;
            
            return (
              <div 
                key={a.id} 
                onClick={() => handleOpenAssignment(a)}
                className={`bg-slate-900/40 border p-8 rounded-[2.5rem] backdrop-blur-xl group transition-all flex flex-col h-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  !isPending 
                    ? 'border-emerald-500/30 hover:border-emerald-500/60' 
                    : overdue
                      ? 'border-rose-500/30 hover:border-rose-500/60'
                      : 'border-slate-800 hover:border-amber-500/30'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${
                    !isPending ? 'bg-emerald-500/10 text-emerald-500' 
                    : overdue ? 'bg-rose-500/10 text-rose-500'
                    : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {!isPending ? <CheckCircle2 size={24} /> : overdue ? <XCircle size={24} /> : <Timer size={24} />}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                    !isPending
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : overdue
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/10'
                  }`}>
                    {!isPending ? 'Concluída' : overdue ? 'Em Atraso' : 'Pendente'}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white mb-1 uppercase italic leading-tight group-hover:text-emerald-400 transition-colors">
                  {a.simulado?.contentTopic || a.simulado?.title || 'Atividade'}
                </h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">
                  {a.simulado?.title}
                </p>
                {userRole !== UserRole.STUDENT && (
                  <div className="flex items-center gap-2 mb-4">
                    <User size={12} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {students.find(s => s.id === a.studentId)?.name || 'Aluno'}
                    </span>
                  </div>
                )}
                {a.simulado && (
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={12} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      {a.simulado.questions?.length || 0} questões
                    </span>
                  </div>
                )}
                
                <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className={overdue && isPending ? 'text-rose-400' : 'text-slate-500'}>Prazo</span>
                    <span className={`${overdue && isPending ? 'text-rose-400' : 'text-white'}`}>
                      {a.dueDate 
                        ? new Date(a.dueDate).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Sem prazo'}
                    </span>
                  </div>
                  
                  <div className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${
                    !isPending
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white'
                      : 'bg-emerald-500 text-white shadow-emerald-500/20 group-hover:bg-emerald-600'
                  }`}>
                    {!isPending 
                      ? <><Eye size={14} /> Ver Atividade</> 
                      : <><PlayCircle size={14} /> Iniciar Atividade</>}
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vazio */}
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

      {/* Modal Atribuição */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-[#1e293b] w-full max-w-lg rounded-[3rem] border border-white/10 p-12 space-y-8 animate-in zoom-in-95">
              <div className="space-y-2">
                 <h3 className="text-2xl font-black">Atribuir Atividade</h3>
                 <p className="text-slate-400 text-sm italic">
                   {selectedSimulado?.contentTopic || selectedSimulado?.title}
                 </p>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecione o Aluno</label>
                    <div className="relative">
                       <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                        value={assignData.studentId}
                        onChange={(e) => setAssignData({...assignData, studentId: e.target.value})}
                       >
                         <option value="">Escolher aluno...</option>
                         {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
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
