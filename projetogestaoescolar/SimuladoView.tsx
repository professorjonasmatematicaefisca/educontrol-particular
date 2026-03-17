import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
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
  FileText
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
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Atribuição Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSimulado, setSelectedSimulado] = useState<Simulado | null>(null);
  const [assignData, setAssignData] = useState({
    studentId: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (userRole === UserRole.STUDENT) {
        // Aluno vê suas atribuições
        const data = await SupabaseService.getSimuladoAssignments(userEmail); // Assumindo userEmail como mock por enquanto
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
      console.error("Error fetching simulados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignData.studentId || !selectedSimulado) return;

    const success = await SupabaseService.assignSimulado({
      simuladoId: selectedSimulado.id,
      studentId: assignData.studentId,
      teacherId: userEmail, // Mock
      dueDate: assignData.dueDate
    });

    if (success) {
      onShowToast('Atribuído com sucesso!');
      setShowAssignModal(false);
      fetchData();
    }
  };

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

  if (activeSimulado) {
    return (
      <SimuladoPlayer 
        simulado={activeSimulado}
        studentId={userEmail}
        onComplete={(score) => {
          onShowToast(`Parabéns! Você completou com nota ${score}%`);
          setActiveSimulado(null);
          fetchData();
        }}
        onCancel={() => setActiveSimulado(null)}
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
            <Clock size={14} /> {userRole === UserRole.STUDENT ? 'Minhas Tarefas' : 'Atribuições'}
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

          {activeTab === 'assignments' && assignments.map(a => (
            <div key={a.id} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl group hover:border-emerald-500/30 transition-all flex flex-col h-full">
               <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl transition-transform ${a.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {a.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : <Timer size={24} />}
                  </div>
                  <div className="text-right">
                     <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${a.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 border-amber-500/10'}`}>
                       {a.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                     </span>
                  </div>
               </div>
               <h3 className="text-lg font-black text-white mb-1 uppercase italic leading-tight">{a.simulado?.title}</h3>
               <div className="flex items-center gap-2 mb-6">
                  <User size={12} className="text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{students.find(s => s.id === a.studentId)?.name || 'Aluno'}</span>
               </div>
               
               <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                     <span className="text-slate-500">Prazo</span>
                     <span className="text-white">{a.dueDate ? new Date(a.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                  </div>
                  <button 
                    disabled={a.status === 'COMPLETED' && userRole === UserRole.STUDENT}
                    onClick={() => { if (a.simulado) setActiveSimulado(a.simulado); }}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                      a.status === 'COMPLETED' 
                      ? 'bg-slate-800 text-slate-500 cursor-default' 
                      : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                    }`}
                  >
                    {a.status === 'COMPLETED' ? 'Vizualizar Respostas' : 'Iniciar Atividade'} <ArrowRight size={14} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Vazio */}
      {!loading && ((activeTab === 'my_simulados' && simulados.length === 0) || (activeTab === 'assignments' && assignments.length === 0)) && (
        <div className="py-32 text-center opacity-30 select-none bg-slate-900/20 border border-slate-800 border-dashed rounded-[3rem]">
           <BookOpen size={80} className="mx-auto mb-6 text-emerald-500" />
           <p className="text-2xl font-black uppercase tracking-[0.3em]">Nada por aqui ainda</p>
           <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest">Comece criando seu primeiro conteúdo premium</p>
        </div>
      )}

      {/* Modal Atribuição */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-[#1e293b] w-full max-w-lg rounded-[3rem] border border-white/10 p-12 space-y-8 animate-in zoom-in-95">
              <div className="space-y-2">
                 <h3 className="text-2xl font-black">Atribuir Atividade</h3>
                 <p className="text-slate-400 text-sm italic">Destinatário: {selectedSimulado?.title}</p>
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
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prazo Final</label>
                    <div className="relative">
                       <CalendarIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                        type="date"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={assignData.dueDate}
                        onChange={(e) => setAssignData({...assignData, dueDate: e.target.value})}
                       />
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                  onClick={handleAssign}
                  className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-500/20 transition-all active:scale-95"
                 >
                    Confirmar Atribuição
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
