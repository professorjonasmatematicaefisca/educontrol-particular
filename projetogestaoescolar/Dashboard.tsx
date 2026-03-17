import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  Trash2
} from 'lucide-react';
import { SupabaseService } from './services/supabaseService';
import { ScheduledClass, Student, UserRole } from './types';
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
    onNavigateToStudent?: (studentId: string) => void;
}

interface PaymentItem {
  studentName: string;
  amount: number;
  dueDate: Date;
  type: string;
}

export const Dashboard: React.FC<DashboardProps> = () => {
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
            
            // Faturamento do mês (gráfico)
            const startM = startOfMonth(baseDate);
            const endM = endOfMonth(baseDate);
            const daysInterval = eachDayOfInterval({ start: startM, end: endM });
            
            // Buscar todas as aulas para os cálculos
            // Para vencimentos, precisamos de uma janela maior (ex: desde o começo do mês passado até hoje)
            const startHistory = format(addWeeks(now, -4), 'yyyy-MM-dd');
            const [students, allSchedule] = await Promise.all([
                SupabaseService.getStudents(),
                SupabaseService.getScheduledClasses(startHistory)
            ]);

            // Gráfico diário (vínculo com baseDate selecionado no UI)
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

            // Estatísticas
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

            // Lógica de Vencimentos baseada em aulas COMPLETED e PENDING
            if (paymentFilter === 'WEEKLY') {
                // Aulas desta semana (selecionada pelo paymentRange)
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
                        dueDate: parseISO(c.classDate), // Vencimento é o dia da aula para este critério
                        type: 'Aula Ministrada'
                    }));
                setUpcomingPayments(weeklyPayments);
            } else {
                // OVERDUE: Aulas de semanas anteriores ainda pendentes
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

    const handleConfirmPayment = (payment: PaymentItem) => {
        // Lógica de confirmação aqui
        alert(`Pagamento de ${payment.studentName} confirmado!`);
    };

    if (loading) return <div className="text-white p-6 animate-pulse">Carregando painel de controle...</div>;

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white">Olá, Professor Jonas</h2>
                    <p className="text-gray-400 text-sm mt-1">Bem-vindo ao seu painel administrativo centralizado.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-500" />
                                Evolução Mensal - Faturamento (R$)
                            </h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Passe o mouse para ver os valores</p>
                        </div>
                        <div className="flex items-center gap-4 bg-[#0f172a] p-1.5 rounded-xl border border-gray-700">
                             <button 
                                onClick={() => setBaseDate(prev => addDays(startOfMonth(prev), -1))}
                                className="p-2 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-all"
                             >
                                <ChevronLeft size={18} />
                             </button>
                             <span className="text-xs font-black text-white min-w-[120px] text-center uppercase tracking-widest">
                                {format(baseDate, 'MMMM yyyy', { locale: ptBR })}
                             </span>
                             <button 
                                onClick={() => setBaseDate(prev => addDays(endOfMonth(prev), 1))}
                                className="p-2 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-all"
                             >
                                <ChevronRight size={18} />
                             </button>
                        </div>
                    </div>
                    <div className="h-64 w-full">
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

                {/* Agenda do Dia & Vencimentos */}
                <div className="space-y-6">
                  {/* Agenda de Hoje */}
                  <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-xl overflow-hidden relative">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Clock size={20} className="text-purple-500" />
                            Agenda de Hoje
                        </h3>
                        <span className="text-[10px] font-black text-purple-500 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20 uppercase">
                          {format(new Date(), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="space-y-3">
                          {upcomingClasses.map((c, idx) => {
                              const colors = [
                                'border-emerald-500/30 bg-emerald-500/5 text-emerald-500',
                                'border-sky-500/30 bg-sky-500/5 text-sky-500',
                                'border-violet-500/30 bg-violet-500/5 text-violet-500',
                                'border-amber-500/30 bg-amber-500/5 text-amber-500'
                              ];
                              const colorStyle = colors[idx % colors.length];

                              return (
                                <div key={c.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${c.status === 'IN_PROGRESS' ? 'bg-gradient-to-r from-orange-600/40 to-amber-500/10 border-orange-500/50 shadow-lg shadow-orange-500/20' : colorStyle}`}>
                                    <div className={`text-center min-w-[60px] border-r pr-4 ${c.status === 'IN_PROGRESS' ? 'border-white/20' : 'border-current/20'}`}>
                                        <p className={`text-xs font-black uppercase tracking-tighter ${c.status === 'IN_PROGRESS' ? 'text-white' : ''}`}>{c.startTime}</p>
                                        <div className={`w-1.5 h-1.5 mx-auto rounded-full mt-1 ${c.status === 'IN_PROGRESS' ? 'bg-white animate-pulse' : 'bg-current animate-pulse'}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-white truncate uppercase tracking-tight">{c.studentName}</p>
                                        <p className={`text-[9px] font-bold uppercase opacity-60 tracking-[0.2em] ${c.status === 'IN_PROGRESS' ? 'text-orange-200' : ''}`}>
                                          {c.status === 'IN_PROGRESS' ? 'AULA EM ANDAMENTO' : c.status}
                                        </p>
                                    </div>
                                </div>
                              );
                          })}
                          {upcomingClasses.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-2xl">
                              <CalendarIcon size={32} className="mx-auto mb-2 text-gray-700" />
                              <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Sem compromissos hoje</p>
                            </div>
                          )}
                      </div>
                  </div>

                  {/* Vencimentos & Filtros */}
                  <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-xl">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <DollarSign size={20} className="text-amber-500" />
                                Vencimentos
                            </h3>
                            <div className="flex gap-2 mt-3">
                                <button 
                                    onClick={() => setPaymentFilter('WEEKLY')}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${paymentFilter === 'WEEKLY' ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-gray-500 hover:text-gray-300'}`}
                                >
                                    Semana
                                </button>
                                <button 
                                    onClick={() => setPaymentFilter('OVERDUE')}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${paymentFilter === 'OVERDUE' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 text-gray-500 hover:text-gray-300'}`}
                                >
                                    Em Atraso
                                </button>
                            </div>
                        </div>
                        {paymentFilter === 'WEEKLY' && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setPaymentRange(prev => prev - 1)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => setPaymentRange(prev => prev + 1)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                      </div>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {upcomingPayments.map((p, idx) => (
                              <div key={idx} className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${paymentFilter === 'OVERDUE' ? 'bg-red-500/5 border-red-500/20' : 'bg-[#0f172a] border-gray-800'}`}>
                                  <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-lg ${paymentFilter === 'OVERDUE' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                              <CalendarIcon size={16} />
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-white">{p.studentName}</p>
                                              <p className={`text-[10px] font-black uppercase tracking-widest ${paymentFilter === 'OVERDUE' ? 'text-red-400' : 'text-amber-500/60'}`}>
                                                  Vence {format(p.dueDate, 'dd/MM')}
                                              </p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-sm font-black text-white">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                      </div>
                                  </div>
                                  
                                  <button 
                                    onClick={() => handleConfirmPayment(p)}
                                    className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${paymentFilter === 'OVERDUE' ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20'}`}
                                  >
                                      <Check size={14} />
                                      Confirmar Recebimento
                                  </button>
                              </div>
                          ))}
                          {upcomingPayments.length === 0 && (
                              <div className="text-center py-10">
                                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-600">
                                      <TrendingUp size={20} />
                                  </div>
                                  <p className="text-gray-500 italic text-sm">Nenhum pagamento encontrado</p>
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
    <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden group">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</p>
                <h4 className="text-2xl font-black text-white mt-1">{value}</h4>
                <p className={`text-[10px] font-bold mt-2 ${color} opacity-80 uppercase`}>{trend}</p>
            </div>
            <div className={`p-3 rounded-xl ${bgColor} ${color} transition-transform group-hover:scale-110 duration-300`}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);