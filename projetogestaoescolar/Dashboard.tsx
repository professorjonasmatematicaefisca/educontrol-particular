import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  UserPlus, Users, School, BookOpen, X, Plus, Camera, Lock, Trash2, GraduationCap, Edit2, RefreshCw, Mail, AlertCircle, CalendarRange, DollarSign, TrendingUp, CreditCard, Search, Calendar as CalendarIcon, Filter, CheckCircle, XCircle, Clock, ChevronDown, ImageIcon, Upload, Save, Banknote, Settings, FileText, CloudOff, Share2, Copy, Check, MessageCircle, Award, ChevronLeft, ChevronRight
} from 'lucide-react';
import { SupabaseService } from './services/supabaseService';
import { ScheduledClass } from './types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  startOfWeek,
  endOfWeek,
  addDays,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  onNavigateToStudent: (id: string) => void;
  userName?: string;
}

interface PaymentItem {
  studentName: string;
  amount: number;
  dueDate: Date;
  type: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToStudent, userName = 'Professor Jonas' }) => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        monthlyRevenue: 0,
        classesToday: 0,
        pendingSimulados: 0
    });
    const [upcomingClasses, setUpcomingClasses] = useState<ScheduledClass[]>([]);
    const [loading, setLoading] = useState(true);

    const [dailyData, setDailyData] = useState<{name: string, valor: number}[]>([]);
    const [upcomingPayments, setUpcomingPayments] = useState<PaymentItem[]>([]);
    const [paymentRange, setPaymentRange] = useState(0); // 0 = esta semana, 1 = próxima, etc.
    const [baseDate, setBaseDate] = useState(new Date());
    const [paymentFilter, setPaymentFilter] = useState<'WEEKLY' | 'OVERDUE'>('WEEKLY');

    useEffect(() => {
        loadDashboardData();
    }, [paymentRange, baseDate, paymentFilter]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const startOfWeekNow = startOfWeek(now, { weekStartsOn: 1 });

            const startM = startOfMonth(baseDate);
            const endM = endOfMonth(baseDate);
            const daysInterval = eachDayOfInterval({ start: startM, end: endM });

            const startHistory = format(addWeeks(now, -4), 'yyyy-MM-dd');
            const [students, allSchedule] = await Promise.all([
                SupabaseService.getStudents(),
                SupabaseService.getScheduledClasses(startHistory)
            ]);

            const processedChartData = daysInterval.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayValue = allSchedule
                    .filter(c => c.classDate === dayStr && c.status === 'COMPLETED')
                    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

                return {
                    name: format(day, 'dd'),
                    valor: dayValue,
                    fullDate: format(day, "dd 'de' MMMM", { locale: ptBR })
                };
            });
            setDailyData(processedChartData);

            const monthlyRevenue = allSchedule
                .filter(c => {
                    const d = parseISO(c.classDate);
                    return d >= startM && d <= endM && c.status === 'COMPLETED';
                })
                .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

            const classesToday = allSchedule
                .filter(c => isSameDay(parseISO(c.classDate), now))
                .sort((a,b) => a.startTime.localeCompare(b.startTime));

            setUpcomingClasses(classesToday);

            setStats({
                totalStudents: students.length,
                monthlyRevenue: monthlyRevenue,
                classesToday: classesToday.length,
                pendingSimulados: 0
            });

            if (paymentFilter === 'WEEKLY') {
                const weekOffsetStart = startOfWeek(addWeeks(now, paymentRange), { weekStartsOn: 1 });
                const weekOffsetEnd = endOfWeek(weekOffsetStart, { weekStartsOn: 1 });

                const weeklyPayments: PaymentItem[] = allSchedule
                    .filter(c => {
                        const d = parseISO(c.classDate);
                        return d >= weekOffsetStart && d <= weekOffsetEnd &&
                               c.status === 'COMPLETED' &&
                               c.paymentStatus !== 'PAID';
                    })
                    .map(c => ({
                        studentName: c.studentName || 'Aluno',
                        amount: c.totalValue || 0,
                        dueDate: parseISO(c.classDate),
                        type: 'Aula Ministrada'
                    }));
                setUpcomingPayments(weeklyPayments);
            } else {
                const overduePayments: PaymentItem[] = allSchedule
                    .filter(c => {
                        const d = parseISO(c.classDate);
                        return d < startOfWeekNow &&
                               c.status === 'COMPLETED' &&
                               c.paymentStatus !== 'PAID';
                    })
                    .map(c => ({
                        studentName: c.studentName || 'Aluno',
                        amount: c.totalValue || 0,
                        dueDate: parseISO(c.classDate),
                        type: 'Atrasado'
                    }));
                setUpcomingPayments(overduePayments);
            }

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppMessage = (phone: string, studentName: string, startTime: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const message = encodeURIComponent(`Olá! Aqui é o ${userName}. Passando para lembrar da nossa aula de hoje às ${startTime}.`);
        window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
    };

    const handleSendWeeklySchedule = async (studentId: string, studentName: string, phone?: string, classDate?: string) => {
        if (!phone) {
            alert(`Telefone não cadastrado para ${studentName}.`);
            return;
        }

        const dateRef = classDate ? parseISO(classDate) : new Date();
        const start = format(dateRef, 'yyyy-MM-dd');
        const end = format(endOfWeek(dateRef, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        
        try {
            const weekClasses = await SupabaseService.getWeeklyScheduleForWhatsApp(start, end, studentId);
            
            if (weekClasses.length === 0) {
                alert('Nenhuma aula encontrada para o restante da semana.');
                return;
            }

            let messageText = `Olá! Segue a agenda de aulas de *${studentName}* para o restante da semana:\n\n`;
            
            weekClasses.forEach(c => {
                const dateObj = parseISO(c.classDate);
                const weekDay = format(dateObj, 'EEEE', { locale: ptBR });
                const dayMonth = format(dateObj, 'dd/MM');
                messageText += `*${weekDay} (${dayMonth})* as *${c.startTime}*\n`;
            });

            messageText += `\nQualquer dúvida, estou à disposição!`;
            
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
        } catch (error) {
            console.error('Error sending weekly schedule:', error);
            alert('Erro ao buscar agenda semanal.');
        }
    };

    const handleBulkSendWeeklySchedules = async (list: ScheduledClass[]) => {
        const studentsInList = Array.from(new Set(list.map(c => c.studentId)));
        
        if (studentsInList.length === 0) {
            alert('Nenhum aluno na lista para enviar.');
            return;
        }

        if (!confirm(`Deseja abrir as janelas de WhatsApp para os ${studentsInList.length} alunos da lista (agenda semanal)?`)) return;

        for (const sId of studentsInList) {
            const studentClass = list.find(c => c.studentId === sId);
            if (studentClass && (studentClass.studentPhone || studentClass.parentPhone)) {
                await handleSendWeeklySchedule(sId, studentClass.studentName || 'Aluno', studentClass.studentPhone || studentClass.parentPhone, studentClass.classDate);
            }
        }
    };

    const handleConfirmPayment = async (payment: any) => {
        alert(`Pagamento de ${payment.studentName} confirmado!`);
    };

    if (loading) return <div className="text-white p-6 animate-pulse">Carregando painel de controle...</div>;

    return (
        <div className="max-w-[1600px] mx-auto space-y-4 pb-4">
            {/* Header Fixo com Degradê Moderna */}
            {/* Header Fixo com Degradê Moderna */}
            <div className="sticky top-0 z-30 -mx-6 px-6 py-4 bg-gradient-to-b from-[#0f172a] via-[#0f172a]/95 to-transparent backdrop-blur-md mb-2">
                <h2 className="text-2xl font-black text-white">Olá, {userName}</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Painel administrativo centralizado</p>
            </div>

            {/* KPI Cards Reduzidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard 
                    icon={Users} 
                    label="Alunos Ativos" 
                    value={stats.totalStudents.toString()} 
                    trend="+2 este mês"
                    color="text-blue-400"
                    bgColor="bg-blue-500/10"
                />
                <KPICard 
                    icon={DollarSign} 
                    label="Receita (Mês)" 
                    value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    trend="Meta: R$ 5.000"
                    color="text-emerald-400"
                    bgColor="bg-emerald-500/10"
                />
                <KPICard 
                    icon={CalendarIcon} 
                    label="Aulas Hoje" 
                    value={stats.classesToday.toString()} 
                    trend="Próxima às 14:00"
                    color="text-purple-400"
                    bgColor="bg-purple-500/10"
                />
                <KPICard 
                    icon={Award} 
                    label="Simulados" 
                    value={stats.pendingSimulados.toString()} 
                    trend="3 pendentes de correção"
                    color="text-orange-400"
                    bgColor="bg-orange-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna da Esquerda: Gráfico + Vencimentos (Horizontal) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-[#1e293b]/40 p-5 rounded-2xl border border-gray-800 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-tight">
                                    <TrendingUp size={16} className="text-emerald-500" />
                                    Evolução Mensal
                                </h3>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Faturamento em Reais (R$)</p>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-950/50 p-1 rounded-xl border border-gray-800">
                                 <button 
                                    onClick={() => setBaseDate(prev => addDays(startOfMonth(prev), -1))}
                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-all"
                                 >
                                    <ChevronLeft size={16} />
                                 </button>
                                 <span className="text-[10px] font-black text-white min-w-[100px] text-center uppercase tracking-widest">
                                    {format(baseDate, 'MMM yyyy', { locale: ptBR })}
                                 </span>
                                 <button 
                                    onClick={() => setBaseDate(prev => addDays(endOfMonth(prev), 1))}
                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-all"
                                 >
                                    <ChevronRight size={16} />
                                 </button>
                            </div>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData} margin={{ top: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} hide />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}
                                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}
                                        formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
                                        labelFormatter={(label, items) => items[0]?.payload?.fullDate || label}
                                    />
                                    <Bar 
                                      dataKey="valor" 
                                      fill="#10b981" 
                                      radius={[6, 6, 0, 0]} 
                                      animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Vencimentos Horizontal - Agrupado por Aluno */}
                    <div className="bg-[#1e293b]/40 p-5 rounded-2xl border border-gray-800 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-tight">
                                    <DollarSign size={16} className="text-amber-500" />
                                    Vencimentos por Aluno
                                </h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setPaymentFilter('WEEKLY')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${paymentFilter === 'WEEKLY' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'bg-slate-900 text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Semana
                                    </button>
                                    <button 
                                        onClick={() => setPaymentFilter('OVERDUE')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${paymentFilter === 'OVERDUE' ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-900 text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Atraso
                                    </button>
                                </div>
                            </div>
                            {paymentFilter === 'WEEKLY' && (
                                <div className="flex gap-2">
                                    <button onClick={() => setPaymentRange(prev => prev - 1)} className="p-1 bg-slate-950/50 hover:bg-slate-800 text-gray-400 rounded-lg"><ChevronLeft size={14} /></button>
                                    <button onClick={() => setPaymentRange(prev => prev + 1)} className="p-1 bg-slate-950/50 hover:bg-slate-800 text-gray-400 rounded-lg"><ChevronRight size={14} /></button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(() => {
                                const grouped: Record<string, { total: number, count: number, latest: Date }> = {};
                                upcomingPayments.forEach(p => {
                                    if (!grouped[p.studentName]) {
                                        grouped[p.studentName] = { total: 0, count: 0, latest: p.dueDate };
                                    }
                                    grouped[p.studentName].total += p.amount;
                                    grouped[p.studentName].count += 1;
                                    if (p.dueDate > grouped[p.studentName].latest) grouped[p.studentName].latest = p.dueDate;
                                });

                                const groupedArray = Object.entries(grouped);
                                if (groupedArray.length === 0) {
                                    return <div className="col-span-3 text-center py-6 text-gray-600 font-bold text-[10px] uppercase tracking-widest">Nenhum pagamento pendente</div>;
                                }

                                return groupedArray.slice(0, 6).map(([name, data]) => (
                                    <div key={name} className={`p-3 rounded-xl border ${paymentFilter === 'OVERDUE' ? 'bg-red-500/5 border-red-500/10' : 'bg-slate-950/30 border-gray-800'} transition-all hover:border-emerald-500/30 group`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{name}</p>
                                                <p className="text-[9px] text-gray-500 font-bold">{data.count} aula(s)</p>
                                            </div>
                                            <p className="text-[11px] font-black text-emerald-400">R$ {data.total.toLocaleString('pt-BR')}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleConfirmPayment(upcomingPayments.find(p => p.studentName === name)!)}
                                            className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all flex items-center justify-center gap-1"
                                        >
                                            <Check size={10} /> Confirmar
                                        </button>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Agenda de Hoje */}
                <div className="space-y-4">
                  <div className="bg-[#1e293b]/40 p-5 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden h-full">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-tight">
                            <Clock size={16} className="text-purple-500" />
                            Agenda de Hoje
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-purple-500 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20 uppercase">
                            {format(new Date(), "dd MMM", { locale: ptBR })}
                          </span>
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleBulkSendWeeklySchedules(upcomingClasses);
                            }}
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/30"
                            title="Enviar agendas da semana para todos"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                          {upcomingClasses.map((c, idx) => {
                                const isStarted = c.status === 'IN_PROGRESS';
                                const isCompleted = c.status === 'COMPLETED';
                                const isScheduled = c.status === 'SCHEDULED';

                                let cardStyle = "bg-[#0f172a]/60 border-gray-800/50 hover:border-emerald-500/30";
                                if (isStarted) cardStyle = "bg-gradient-to-r from-orange-600/30 to-amber-500/10 border-orange-500/40 shadow-lg shadow-orange-500/10";
                                if (isScheduled) cardStyle = "bg-gradient-to-r from-sky-600/30 to-blue-500/10 border-sky-500/40 shadow-lg shadow-sky-500/10";
                                if (isCompleted) cardStyle = "bg-emerald-500/10 border-emerald-500/40 opacity-80";

                                return (
                                  <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] ${cardStyle}`}>
                                      <div className={`text-center min-w-[50px] border-r pr-3 ${isStarted ? 'border-orange-500/20' : isScheduled ? 'border-sky-500/20' : 'border-emerald-500/20'}`}>
                                          <p className={`text-[10px] font-black uppercase tracking-tighter ${isStarted ? 'text-white' : isScheduled ? 'text-sky-200' : 'text-emerald-200'}`}>{c.startTime}</p>
                                          <div className={`w-1.5 h-1.5 mx-auto rounded-full mt-1 ${isStarted ? 'bg-white animate-pulse' : isScheduled ? 'bg-sky-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-[12px] font-black text-white uppercase tracking-tight leading-none mb-1">
                                            {c.studentName}
                                          </p>
                                          
                                          <div className="flex items-center justify-between mt-1.5">
                                            <p className={`text-[8px] font-bold uppercase tracking-widest truncate ${isStarted ? 'text-orange-200/60' : isScheduled ? 'text-sky-200/60' : 'text-emerald-200/60'}`}>
                                                {isStarted ? 'EM ANDAMENTO' : isCompleted ? 'CONCLUÍDA' : 'AGENDADA'}
                                            </p>

                                            {c.studentPhone && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleWhatsAppMessage(c.studentPhone!, c.studentName || '', c.startTime);
                                                        }}
                                                        className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded transition-colors"
                                                        title="WhatsApp"
                                                    >
                                                        <MessageCircle size={12} fill="currentColor" className="opacity-80" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSendWeeklySchedule(c.studentId, c.studentName || '', c.studentPhone, c.classDate);
                                                        }}
                                                        className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                                        title="Agenda da Semana"
                                                    >
                                                        <Share2 size={12} className="opacity-80" />
                                                    </button>
                                                </div>
                                            )}
                                          </div>
                                      </div>
                                      {isCompleted && <Check size={14} className="text-emerald-500" />}
                                  </div>
                                );
                            })}
                          {upcomingClasses.length === 0 && (
                            <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl opacity-40">
                              <CalendarIcon size={24} className="mx-auto mb-2 text-gray-700" />
                              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Sem compromissos hoje</p>
                            </div>
                          )}
                      </div>
                  </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ icon: Icon, label, value, trend, color, bgColor }: any) => (
    <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-gray-800 shadow-lg relative overflow-hidden group">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
                <h4 className="text-xl font-black text-white mt-0.5">{value}</h4>
                <p className={`text-[8px] font-bold mt-1 ${color} opacity-80 uppercase tracking-wider`}>{trend}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${bgColor} ${color} transition-transform group-hover:scale-110 duration-300`}>
                <Icon size={18} />
            </div>
        </div>
    </div>
);