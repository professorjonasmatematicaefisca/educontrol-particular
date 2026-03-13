import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Award,
  Clock
} from 'lucide-react';
import { SupabaseService } from './services/supabaseService';
import { ScheduledClass, Student, UserRole } from './types';

interface DashboardProps {
    onNavigateToStudent?: (studentId: string) => void;
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

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const startOfMonth = today.slice(0, 7) + '-01';
            
            const [students, allSchedule] = await Promise.all([
                SupabaseService.getStudents(),
                SupabaseService.getScheduledClasses(startOfMonth)
            ]);

            const completedThisMonth = allSchedule.filter(c => c.status === 'COMPLETED');
            const classesToday = allSchedule.filter(c => c.classDate === today);

            setStats({
                totalStudents: students.length,
                monthlyRevenue: completedThisMonth.reduce((acc, curr) => acc + (curr.totalValue || 0), 0),
                classesToday: classesToday.length,
                pendingSimulados: 2 // Mock
            });

            setUpcomingClasses(classesToday.filter(c => c.status === 'SCHEDULED' || c.status === 'COMPLETED').slice(0, 5));
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = [
        { name: 'Semana 1', valor: 400 },
        { name: 'Semana 2', valor: 700 },
        { name: 'Semana 3', valor: 1200 },
        { name: 'Semana 4', valor: stats.monthlyRevenue || 1500 },
    ];

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
                            Evolução Mensal (R$)
                        </h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="valor" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Agenda do Dia */}
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
                        <button className="w-full py-3 text-xs font-bold text-gray-400 hover:text-white transition-colors border border-dashed border-gray-700 rounded-xl mt-4">
                            Ver calendários completo
                        </button>
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