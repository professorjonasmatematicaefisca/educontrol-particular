import React, { useState, useEffect } from 'react';
import {
    Activity, GraduationCap,
    MessageSquare, FileText, CheckCircle, History,
    AlertCircle, TrendingUp, Clock, BookOpen, Calendar as CalendarIcon, Star, ArrowRight
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
    const [simuladoAttempts, setSimuladoAttempts] = useState<any[]>([]);
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
                    SupabaseService.getSimuladoAttempts(me.id)
                ]);
                const filtered = allSessions.filter(s => s.className === me.className);
                setSessions(filtered);
                setScheduledClasses(allScheduled);
                setDisciplines(allDisciplines);
                setSimuladoAttempts(myAttempts || []);
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
    // Assuming simulados have a status property
    const openActivities = simuladoAttempts.filter(a => a.status !== 'COMPLETED').length;

    // 3. Desempenho (Média)
    const myRecords = sessions.map(s => s.records.find(r => r.studentId === student.id)).filter(Boolean);
    const sessionGrades = myRecords.map(r => r ? StorageService.calculateGrade(r) : 0);
    const simuladoGrades = simuladoAttempts.filter(a => a.status === 'COMPLETED').map(a => a.score || 0);
    const allGrades = [...sessionGrades, ...simuladoGrades];
    const avgGrade = allGrades.length > 0 ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(1) : '0.0';

    // 4. Performance Chart Data (Last 5 activities)
    const recentGrades = allGrades.slice(-6);

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

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Aulas no Mês</p>
                        <h4 className="text-2xl font-black text-white">{monthlyClasses}</h4>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle size={22} className="text-emerald-400" />
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-2xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Atividades em Aberto</p>
                        <h4 className="text-2xl font-black text-white">{openActivities}</h4>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Activity size={22} className="text-amber-400" />
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Aulas Realizadas (Total)</p>
                        <h4 className="text-2xl font-black text-white">{scheduledClasses.filter(c => c.status === 'COMPLETED').length}</h4>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <GraduationCap size={22} className="text-purple-400" />
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nota Desempenho</p>
                        <h4 className="text-2xl font-black text-white">{avgGrade}</h4>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp size={22} className="text-blue-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Chart & Recent Activities */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Evolution Chart */}
                    <div className="bg-[#0f172a] border border-gray-800 p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
                                <TrendingUp size={20} className="text-blue-400" />
                                Desempenho em Atividades
                            </h3>
                        </div>
                        <div className="h-48 w-full flex items-end justify-around gap-2 px-4 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 border-y border-gray-500 py-1">
                                <div className="w-full border-t border-gray-500"></div>
                                <div className="w-full border-t border-gray-500"></div>
                                <div className="w-full border-t border-gray-500"></div>
                            </div>
                            
                            {recentGrades.length > 0 ? recentGrades.map((grade, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2 group w-full max-w-[40px]">
                                    <div className="relative w-full">
                                        <div 
                                            className="w-full bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-lg transition-all duration-1000 group-hover:from-emerald-500 group-hover:to-teal-400"
                                            style={{ height: `${(grade / 100) * 160}px` }}
                                        ></div>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-blue-900 text-[10px] font-black px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap">
                                            {grade.toFixed(1)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Act {idx + 1}</span>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center w-full h-full text-gray-600 italic text-sm">
                                    Nenhuma atividade registrada para gerar o gráfico.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
                                <Star size={20} className="text-amber-400" />
                                Aula da Semana
                            </h3>
                        </div>

                        {scheduledClasses
                            .filter(c => c.status === 'SCHEDULED' && new Date(c.classDate + 'T00:00:00') >= new Date(new Date().setHours(0,0,0,0)))
                            .sort((a,b) => (a.classDate + a.startTime).localeCompare(b.classDate + b.startTime))
                            .slice(0, 1)
                            .map(c => (
                            <div key={c.id} className="relative overflow-hidden bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] group hover:border-emerald-500/50 transition-all shadow-2xl">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform">
                                    <Star size={100} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-lg border border-amber-500/20">
                                            Destaque da Semana
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20">
                                            {format(new Date(c.classDate + 'T12:00:00'), 'EEEE', { locale: ptBR })}
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-2 uppercase">{disciplines.find(d => d.id === c.disciplineId)?.name || 'Aula Particular'}</h2>
                                    <div className="flex flex-wrap items-center gap-6 text-gray-400">
                                        <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-slate-800">
                                            <CalendarIcon size={16} className="text-emerald-500" />
                                            <span className="text-sm font-bold">{new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-slate-800">
                                            <Clock size={16} className="text-emerald-500" />
                                            <span className="text-sm font-bold uppercase">{c.startTime}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-slate-800">
                                            <UserAvatar name={c.teacherName || ''} size="xs" />
                                            <span className="text-sm font-bold">Prof. {c.teacherName}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onNavigate('CALENDAR')}
                                        className="mt-8 flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] group/btn"
                                    >
                                        Ver Detalhes na Agenda 
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {scheduledClasses.filter(c => c.status === 'SCHEDULED' && new Date(c.classDate + 'T00:00:00') >= new Date(new Date().setHours(0,0,0,0))).length === 0 && (
                            <div className="bg-[#0f172a] border border-gray-800 border-dashed p-10 rounded-[2rem] text-center">
                                <p className="text-xs text-gray-500 font-bold uppercase italic">Nenhuma aula agendada para esta semana.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Quick Actions & Highlights */}
                <div className="space-y-6">
                    <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6">
                        <h3 className="font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight text-sm">
                            <Activity size={18} className="text-emerald-400" />
                            Status de Atividades
                        </h3>
                        {simuladoAttempts.length > 0 ? (
                            <div className="space-y-4">
                                {simuladoAttempts.slice(0, 3).map((a, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">{a.simuladoTitle || 'Simulado'}</span>
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${a.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {a.status === 'COMPLETED' ? 'Finalizado' : 'Em aberto'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${a.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                                style={{ width: `${a.status === 'COMPLETED' ? 100 : 40}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] text-gray-500 font-bold italic uppercase">Sem atividades recentes.</p>
                        )}
                        <button onClick={() => onNavigate('SIMULADOS')} className="w-full mt-6 py-2.5 text-[10px] font-black text-white uppercase border border-slate-700 hover:bg-slate-800 rounded-xl transition-all tracking-widest">
                            Ver Todas Atividades
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
