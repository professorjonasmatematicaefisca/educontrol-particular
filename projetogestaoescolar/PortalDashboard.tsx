import React, { useState, useEffect } from 'react';
import {
    Activity, GraduationCap,
    MessageSquare, FileText, CheckCircle, History,
    AlertCircle, TrendingUp, Clock, BookOpen, Calendar as CalendarIcon, Star, ArrowRight,
    BarChart3, CheckCircle2
} from 'lucide-react';
import { SupabaseService } from './services/supabaseService';
import { StorageService } from './services/storageService';
import { ClassSession, Student, UserRole, ScheduledClass, Discipline } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserAvatar } from './components/UserAvatar';
import { ModernCalendar } from './components/ModernCalendar';

interface PortalDashboardProps {
    userEmail: string;
    userRole: UserRole;
    onNavigate: (view: any) => void;
}

export const PortalDashboard: React.FC<PortalDashboardProps> = ({ userEmail, userRole, onNavigate }) => {
    const [student, setStudent] = useState<Student | null>(null);

    const [sessions, setSessions] = useState<ClassSession[]>([]);
    const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [simuladoAssignments, setSimuladoAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [userEmail]);

    const loadData = async () => {
        setLoading(true);
        try {
            const allStudents = await SupabaseService.getStudents();
            // Find student by ID (if UID is passed as userEmail) or legacy name/parentEmail
            const me = allStudents.find(s => s.id === userEmail || s.parentEmail === userEmail || s.name === userEmail);

            if (me) {
                setStudent(me);
                const [allSessions, allScheduled, allDisciplines, myAttempts] = await Promise.all([
                    SupabaseService.getSessions(),
                    SupabaseService.getScheduledClasses(undefined, undefined, me.id),
                    SupabaseService.getDisciplines(),
                    SupabaseService.getSimuladoAssignments(me.id) // Fetch full assignments, including completed ones with scores
                ]);
                const filtered = allSessions.filter(s => s.className === me.className);
                setSessions(filtered);
                setScheduledClasses(allScheduled);
                setDisciplines(allDisciplines);
                setSimuladoAssignments(myAttempts || []);
            }
        } catch (err) {
            console.error("Error loading portal data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-[#0f172a] border border-gray-800 rounded-2xl text-center">
                <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-white mb-2">Dados não encontrados</h3>
                <p className="text-gray-400 text-sm">Não encontramos um aluno vinculado ao seu e-mail ({userEmail}). Por favor, entre em contato com a secretaria.</p>
            </div>
        );
    }

    // --- CALCULATIONS ---
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Aulas no Mês
    const monthlyClasses = scheduledClasses.filter(c => {
        const d = new Date(c.classDate + 'T00:00:00');
        return c.status === 'COMPLETED' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // 2. Atividades/Simulados em Aberto
    const openActivities = simuladoAssignments.filter(a => a.status !== 'COMPLETED').length;

    // 4. Média de Desempenho (Apenas Atividades conforme novo requisito)
    const simuladoGrades = simuladoAssignments.filter(a => a.status === 'COMPLETED' && a.score !== undefined).map(a => a.score as number);
    const avgGrade = simuladoGrades.length > 0 ? (simuladoGrades.reduce((a, b) => a + b, 0) / simuladoGrades.length).toFixed(1) : '0.0';

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                <UserAvatar name={student.name} photoUrl={student.photoUrl} size="xl" />
                <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Olá, {student.name.split(' ')[0]}!</h2>
                    <p className="text-emerald-400 font-medium">{student.className} • {userRole === UserRole.PARENT ? 'Espaço do Responsável' : 'Espaço do Aluno'}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] border border-gray-800 rounded-lg text-xs font-bold text-gray-500 cursor-default transition-all opacity-70">
                            <MessageSquare size={14} className="text-gray-500" />
                            Ver Comunicados
                        </button>
                        <button onClick={() => onNavigate('CALENDAR')} className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                            <CalendarIcon size={14} />
                            Acessar Minha Agenda
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Section - Refined */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-2xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Atividades em Aberto</p>
                        <h4 className="text-2xl font-black text-white">{openActivities}</h4>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Activity size={22} className="text-amber-400" />
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nota Desempenho (Atividades)</p>
                        <h4 className="text-2xl font-black text-white">{avgGrade}%</h4>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BarChart3 size={22} className="text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Main Grid - 3 Columns (Performance, Activities, Classes) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Performance in Activities */}
                <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                            <BarChart3 size={18} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">Desempenho em Atividades</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {simuladoAssignments.filter(a => a.status === 'COMPLETED').slice(0, 5).map(a => (
                            <div key={a.id} className="flex flex-col gap-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase text-gray-400 truncate max-w-[70%]">
                                        {a.simulado?.title || 'Atividade'}
                                    </span>
                                    <span className="text-[10px] font-black text-emerald-400">{a.score}%</span>
                                </div>
                                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${a.score}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {simuladoAssignments.filter(a => a.status === 'COMPLETED').length === 0 && (
                            <div className="py-12 text-center opacity-30 italic text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Nenhuma atividade concluída
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Activity Status */}
                <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                            <FileText size={18} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">Status de Atividades</h3>
                    </div>

                    <div className="space-y-2">
                        {simuladoAssignments.map(a => {
                            const isPending = a.status !== 'COMPLETED';
                            const overdue = a.dueDate && new Date(a.dueDate) < new Date() && isPending;
                            
                            return (
                                <div 
                                    key={a.id}
                                    className={`p-2.5 rounded-xl border ${
                                        !isPending ? 'bg-emerald-500/5 border-emerald-500/20' : 
                                        overdue ? 'bg-rose-500/5 border-rose-500/20' : 
                                        'bg-slate-900/50 border-gray-800'
                                    } flex items-center justify-between group transition-all`}
                                >
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <span className="text-[10px] font-black text-white uppercase truncate">
                                            {a.simulado?.title || 'Atividade'}
                                        </span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${
                                            !isPending ? 'text-emerald-500' : overdue ? 'text-rose-500' : 'text-amber-500'
                                        }`}>
                                            {!isPending 
                                                ? `Concluída • ${a.score !== null && a.score !== undefined ? a.score : 0}%` 
                                                : overdue ? 'Em Atraso' : 'Pendente'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => onNavigate('SIMULADO')}
                                        className={`p-1.5 transition-all rounded-lg ${
                                            !isPending ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' :
                                            overdue ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' :
                                            'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'
                                        }`}
                                    >
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            );
                        })}
                        {simuladoAssignments.length === 0 && (
                            <div className="py-12 text-center opacity-30 italic text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Nenhuma atividade atribuída
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: My Classes */}
                <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                            <CalendarIcon size={18} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">Minhas Aulas</h3>
                    </div>

                    <div className="space-y-3">
                        {/* Upcoming Classes */}
                        {scheduledClasses
                            .filter(c => c.status === 'SCHEDULED' && new Date(c.classDate + 'T00:00:00') >= new Date(new Date().setHours(0,0,0,0)))
                            .sort((a,b) => (a.classDate + a.startTime).localeCompare(b.classDate + b.startTime))
                            .slice(0, 2)
                            .map(c => (
                                <div key={c.id} className="p-2.5 bg-sky-500/5 border border-sky-500/20 rounded-xl flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black text-white uppercase italic truncate pr-2">
                                            {c.subjectNotes || disciplines.find(d => d.id === c.disciplineId)?.name || 'Aula Particular'}
                                        </span>
                                        <span className="text-[7px] font-black bg-sky-500 text-white px-1.5 py-0.5 rounded-full uppercase">
                                            Agendada
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] font-bold text-gray-500 uppercase">
                                        <Clock size={10} />
                                        {new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {c.startTime}
                                    </div>
                                </div>
                            ))}

                        {/* Completed Classes with Material */}
                        {scheduledClasses
                            .filter(c => c.status === 'COMPLETED' && (c.whiteboardUrl || c.pdfUrl))
                            .sort((a, b) => b.classDate.localeCompare(a.classDate))
                            .slice(0, 2)
                            .map(c => (
                                <div key={c.id} className="p-2.5 bg-slate-900/50 border border-gray-800 rounded-xl flex items-center justify-between group">
                                    <div className="flex flex-col pr-4 min-w-0">
                                        <span className="text-[10px] font-black text-gray-300 uppercase truncate">
                                            {c.subjectNotes || c.disciplineName || 'Aula Concluída'}
                                        </span>
                                        <span className="text-[8px] font-bold text-gray-500 uppercase">
                                            Finalizada em {new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {(c.whiteboardUrl || c.pdfUrl) && (
                                            <a 
                                                href={c.whiteboardUrl || c.pdfUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-1.5 bg-rose-500/10 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                                title="Baixar Material PDF"
                                            >
                                                <FileText size={14} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}

                        {sessions.length === 0 && scheduledClasses.length === 0 && (
                            <div className="py-12 text-center opacity-30 italic text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Nenhuma aula disponível
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
