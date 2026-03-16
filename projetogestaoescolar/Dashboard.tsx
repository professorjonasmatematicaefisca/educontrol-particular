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
  Calendar as CalendarIcon
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

    useEffect(() => {
        loadDashboardData();
    }, [paymentRange]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const startM = startOfMonth(now);
            const endM = endOfMonth(now);
            
            const [students, allSchedule] = await Promise.all([
                SupabaseService.getStudents(),
                SupabaseService.getScheduledClasses(format(startM, 'yyyy-MM-dd'))
            ]);

            // Agregar faturamento diário para o gráfico
            const daysInterval = eachDayOfInterval({ start: startM, end: endM });
            const processedChartData = daysInterval.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayValue = allSchedule
                    .filter(c => c.classDate === dayStr && c.status === 'COMPLETED')
                    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
                
                return {
                    name: format(day, 'dd'),
                    valor: dayValue
                };
            });
            setDailyData(processedChartData);

            // Calcular faturamento total do mês
            const monthlyRevenue = allSchedule
                .filter(c => c.status === 'COMPLETED')
                .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

            const classesToday = allSchedule.filter(c => isSameDay(parseISO(c.classDate), now));

            setStats({
                totalStudents: students.length,
                monthlyRevenue: monthlyRevenue,
                classesToday: classesToday.length,
                pendingSimulados: 2
            });

            setUpcomingClasses(classesToday.filter(c => c.status === 'SCHEDULED' || c.status === 'COMPLETED').slice(0, 5));

            // Simular vencimentos baseados na configuração dos alunos
            // Na vida real, isso viria da nova lógica financeira
            const weekStart = startOfWeek(addWeeks(now, paymentRange), { weekStartsOn: 1 });
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

            const mockPayments: PaymentItem[] = students
                .filter(s => (s as any).billing_day)
                .map(s => {
                   const dueDate = new Date(now.getFullYear(), now.getMonth(), (s as any).billing_day);
                   return {
                     studentName: s.name,
                     amount: ((s as any).hourlyRate || s.hourly_rate || 0) * 4, // Exemplo
                     dueDate: dueDate,
                     type: (s as any).billing_period || 'MONTHLY'
                   };
                })
                .filter(p => p.dueDate >= weekStart && p.dueDate <= weekEnd);
            
            setUpcomingPayments(mockPayments);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <div className="text-white p-6 animate-pulse">Carregando painel de controle...</div>;

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white">Olá, Professor</h2>
                    <p className="text-gray-400 text-sm mt-1">Aqui está o resumo das suas atividades e faturamento.</p>
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
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-500" />
                            Evolução Mensal - Faturamento (R$)
                        </h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData} margin={{ top: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} hide />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                    formatter={(value: any) => [`R$ ${value}`, 'Faturamento']}
                                />
                                <Bar 
                                  dataKey="valor" 
                                  fill="#10b981" 
                                  radius={[6, 6, 0, 0]} 
                                  label={{ 
                                    position: 'top', 
                                    fill: '#10b981', 
                                    fontSize: 10, 
                                    fontWeight: 'bold',
                                    formatter: (val: any) => val > 0 ? `R$${val}` : ''
                                  }} 
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Agenda do Dia & Vencimentos */}
                <div className="space-y-6">
                  {/* Agenda de Hoje */}
                  <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-xl">
                      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                          <Clock size={20} className="text-purple-500" />
                          Agenda de Hoje
                      </h3>
                      <div className="space-y-4">
                          {upcomingClasses.map(c => (
                              <div key={c.id} className="flex items-center gap-4 p-3 bg-[#0f172a] rounded-xl border border-gray-800">
                                  <div className="text-center min-w-[50px]">
                                      <p className="text-[10px] font-black text-gray-500 uppercase">{c.startTime}</p>
                                      <div className={`w-1 h-4 mx-auto rounded-full mt-1 ${c.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                  </div>
                                  <div className="flex-1">
                                      <p className="text-sm font-bold text-white">{(c as any).studentName}</p>
                                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{c.status}</p>
                                  </div>
                              </div>
                          ))}
                          {upcomingClasses.length === 0 && (
                              <p className="text-center text-gray-500 py-10 italic text-sm">Nenhuma aula para hoje</p>
                          )}
                      </div>
                  </div>

                  {/* Próximos Vencimentos */}
                  <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-xl">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <DollarSign size={20} className="text-amber-500" />
                            Vencimentos
                        </h3>
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
                      </div>
                      <div className="space-y-4">
                          {upcomingPayments.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                                      <CalendarIcon size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-white">{p.studentName}</p>
                                      <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-widest">
                                        Vence {format(p.dueDate, 'dd/MM')} • {p.type === 'MONTHLY' ? 'Mensal' : p.type === 'BIWEEKLY' ? 'Quinzenal' : 'Semanal'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-black text-white">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                  </div>
                              </div>
                          ))}
                          {upcomingPayments.length === 0 && (
                              <p className="text-center text-gray-500 py-5 italic text-sm">Nenhum vencimento para este período</p>
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