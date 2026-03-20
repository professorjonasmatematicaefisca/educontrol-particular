import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Search, 
  Calendar as CalendarIcon, 
  Filter, 
  CheckCircle, 
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  BarChart3,
  List,
  ChevronLeft
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area, Cell, Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserRole, ScheduledClass, BankAccount } from './types';
import { SupabaseService } from './services/supabaseService';

interface FinancialViewProps {
  onShowToast: (msg: string) => void;
  userEmail: string;
  userRole: UserRole;
}

export const FinancialView: React.FC<FinancialViewProps> = ({ onShowToast }) => {
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterAccount, setFilterAccount] = useState('ALL');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showDailyDetailModal, setShowDailyDetailModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [selectedStudentClasses, setSelectedStudentClasses] = useState<ScheduledClass[]>([]);
  const [selectedDayData, setSelectedDayData] = useState<any[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [recebimentoTab, setRecebimentoTab] = useState<'OVERDUE' | 'THIS_WEEK' | 'NEXT_WEEK'>('THIS_WEEK');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [filterMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startOfMonth = `${filterMonth}-01`;
      const endOfMonth = `${filterMonth}-31`;
      const [classesData, accountsData] = await Promise.all([
        SupabaseService.getScheduledClasses(startOfMonth, endOfMonth),
        SupabaseService.getBankAccounts()
      ]);
      setClasses(classesData);
      setBankAccounts(accountsData);
    } catch (error) {
      onShowToast('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const completedClasses = classes.filter(c => c.status === 'COMPLETED');
  const pendingClasses = completedClasses.filter(c => c.paymentStatus === 'PENDING');
  const paidClasses = completedClasses.filter(c => 
    c.paymentStatus === 'PAID' && (filterAccount === 'ALL' || c.paymentAccountId === filterAccount)
  );

  const totalRevenue = paidClasses.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
  const pendingRevenue = pendingClasses.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  // Agrupamento para a tabela de recebimentos
  const groupedPending = pendingClasses.reduce((acc, curr) => {
    const key = `${curr.studentName}-${curr.totalValue}`;
    if (!acc[key]) {
      acc[key] = {
        studentName: curr.studentName,
        totalValue: 0,
        count: 0,
        classes: [],
        latestDate: curr.classDate
      };
    }
    acc[key].count += 1;
    acc[key].totalValue += (curr.totalValue || 0);
    acc[key].classes.push(curr);
    if (curr.classDate > acc[key].latestDate) acc[key].latestDate = curr.classDate;
    return acc;
  }, {} as Record<string, { studentName: string | undefined, totalValue: number, count: number, classes: ScheduledClass[], latestDate: string }>);

  // Lógica de Filtro por Abas
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const afterNextWeek = new Date(nextWeek);
  afterNextWeek.setDate(nextWeek.getDate() + 7);

  const filteredPendingList = Object.values(groupedPending).filter(item => {
    const itemDate = new Date(item.latestDate + 'T00:00:00');
    if (recebimentoTab === 'OVERDUE') return itemDate < today;
    if (recebimentoTab === 'THIS_WEEK') return itemDate >= today && itemDate < nextWeek;
    if (recebimentoTab === 'NEXT_WEEK') return itemDate >= nextWeek && itemDate < afterNextWeek;
    return true;
  }).sort((a, b) => a.latestDate.localeCompare(b.latestDate));

  // Paginação
  const cardsPerPage = 12;
  const totalPages = Math.ceil(filteredPendingList.length / cardsPerPage);
  const currentCards = filteredPendingList.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

  // Preparação de dados para os gráficos
  const monthDate = parseISO(filterMonth + '-01');
  const daysInMonth = eachDayOfInterval({ 
    start: startOfMonth(monthDate), 
    end: endOfMonth(monthDate) 
  });

  const chartData = daysInMonth.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const billed = completedClasses
      .filter(c => c.classDate === dayStr)
      .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
    
    // Recebido na data do PAGAMENTO (paidAt)
    const received = completedClasses
      .filter(c => c.paymentStatus === 'PAID' && c.paidAt?.startsWith(dayStr))
      .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

    return {
      name: format(day, 'dd'),
      fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
      faturamento: billed,
      recebido: received
    };
  });

  const handleConfirmPayment = async (accountId: string) => {
    if (!selectedClass) return;
    try {
      const success = await SupabaseService.confirmPayment(selectedClass.id, accountId, paymentDate);
      if (success) {
        onShowToast('Pagamento confirmado com sucesso');
        setShowPaymentModal(false);
        fetchData();
      }
    } catch (error) {
      onShowToast('Erro ao confirmar pagamento');
    }
  };

  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-800">
          <h3 className="text-xl font-black text-white mb-1">Confirmar Recebimento</h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Selecione a data e a conta de destino</p>
        </div>
        <div className="p-8 pb-0 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data de Recebimento</label>
            <input 
              type="date" 
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-white text-sm font-bold focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none"
            />
          </div>
        </div>
        <div className="p-8 space-y-4">
          {bankAccounts.length > 0 ? (
            bankAccounts.map(account => (
              <button
                key={account.id}
                onClick={() => handleConfirmPayment(account.id)}
                className="w-full p-4 bg-slate-800/40 hover:bg-emerald-500/10 border border-slate-700/50 hover:border-emerald-500/50 rounded-2xl flex items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                  {account.imageUrl ? (
                    <img src={account.imageUrl} className="w-full h-full object-contain" alt="" />
                  ) : (
                    <DollarSign size={20} className="text-slate-500" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-white font-black uppercase text-sm group-hover:text-emerald-400 transition-colors">{account.name}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-xs font-bold text-gray-500 uppercase italic">Nenhuma conta cadastrada nas configurações.</p>
            </div>
          )}
        </div>
        <div className="p-8 bg-slate-900/50 flex justify-end">
          <button onClick={() => setShowPaymentModal(false)} className="px-6 py-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Fechar</button>
        </div>
      </div>
    </div>
  );

  const StudentClassesModal = () => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f172a] w-full max-w-2xl rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Detalhamento de Aulas</h3>
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">{selectedStudentClasses[0]?.studentName}</p>
          </div>
          <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors"><XCircle size={24} /></button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                <th className="p-4 border-l-4 border-transparent">Data</th>
                <th className="p-4">Aula/Matéria</th>
                <th className="p-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {selectedStudentClasses.map(c => (
                <tr key={c.id} className="text-sm font-bold text-gray-300">
                  <td className="p-4 border-l-4 border-emerald-500/20">{new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 uppercase text-xs">
                    {c.disciplineName || 'Aula Particular'} 
                    <span className="block text-[9px] text-gray-500 font-normal">{c.startTime} - {c.endTime}</span>
                  </td>
                  <td className="p-4 text-right text-emerald-500">R$ {(c.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center">
          <p className="text-xs font-black text-gray-500 uppercase">Total: <span className="text-white ml-2">R$ {selectedStudentClasses.reduce((acc, c) => acc + (c.totalValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
          <button 
            onClick={() => {
              if (selectedStudentClasses.length > 1) {
                onShowToast('Selecione uma aula por vez para confirmar o recebimento individual.');
              } else {
                setSelectedClass(selectedStudentClasses[0]);
                setShowPaymentModal(true);
              }
            }}
            className="px-8 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20"
          >
            Confirmar Individual
          </button>
        </div>
      </div>
    </div>
  );

  const DailyDetailModal = () => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
      <div className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Recebimentos do Dia</h3>
          <button onClick={() => setShowDailyDetailModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors"><XCircle size={24} /></button>
        </div>
        <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
          {selectedDayData.length > 0 ? selectedDayData.map((d, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-slate-800/20 rounded-2xl border border-slate-700/30">
              <span className="text-white font-bold text-sm uppercase tracking-tight">{d.studentName}</span>
              <span className="text-emerald-500 font-black text-sm">R$ {d.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )) : (
            <p className="text-center text-xs text-gray-500 py-8 uppercase font-bold tracking-widest italic">Nenhum recebimento registrado.</p>
          )}
        </div>
        <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end">
          <p className="text-xs font-black text-gray-500 uppercase">Total do dia: <span className="text-emerald-500 ml-2 text-base">R$ {selectedDayData.reduce((acc, curr) => acc + curr.totalValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="text-emerald-500" size={20} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Gestão <span className="text-emerald-500">Financeira</span></h1>
          </div>
          <p className="text-xs text-gray-400 font-bold ml-10 uppercase tracking-widest">Controle de faturamento e recebimentos</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-2 px-3">
            <CalendarIcon size={16} className="text-emerald-500" />
            <input 
              type="month" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent border-none text-white text-sm font-bold focus:ring-0 outline-none"
            />
          </div>
          <div className="h-8 w-[1px] bg-slate-800 hidden md:block" />
          <div className="flex items-center gap-2 px-3">
            <Filter size={16} className="text-emerald-500" />
            <select 
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="bg-transparent border-none text-white text-sm font-bold focus:ring-0 outline-none"
            >
              <option value="ALL">Todas as Contas</option>
              {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="md:col-span-1 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
          <p className="text-emerald-500 font-black uppercase text-[9px] tracking-[0.2em] mb-1">Faturamento Recebido</p>
          <h4 className="text-2xl font-black text-white">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          <p className="text-[9px] text-gray-500 font-bold mt-2 uppercase tracking-widest">{paidClasses.length} aulas confirmadas</p>
        </div>

        <div className="md:col-span-1 bg-slate-900/20 border border-slate-800/50 p-5 rounded-3xl backdrop-blur-md relative overflow-hidden group opacity-80">
          <p className="text-amber-500/70 font-black uppercase text-[8px] tracking-[0.2em] mb-1">Aguardando Pagamento</p>
          <h4 className="text-lg font-black text-white">R$ {pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          <p className="text-[8px] text-gray-600 font-bold mt-1 uppercase tracking-widest">{pendingClasses.length} aulas pendentes</p>
        </div>

        <div className="md:col-span-2 bg-emerald-500 p-6 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.2)] relative overflow-hidden group h-full flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Search size={80} className="text-white" /></div>
          <p className="text-emerald-900 font-black uppercase text-[9px] tracking-[0.2em] mb-1">Total do Período</p>
          <h4 className="text-4xl font-black text-white">R$ {(totalRevenue + pendingRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          <p className="text-[9px] text-emerald-900/70 font-bold mt-2 uppercase tracking-widest">{completedClasses.length} aulas totais</p>
        </div>
      </div>

      {/* Seção de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
                <BarChart3 size={18} className="text-emerald-500" />
                Evolução Mensal
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Faturamento vs Valor Recebido</p>
            </div>
            <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest">
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Faturamento</div>
               <div className="flex items-center gap-2"><div className="w-3 h-[2px] bg-red-500"></div> Recebido</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}
                />
                <Bar dataKey="faturamento" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="recebido" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
          <div className="mb-8">
            <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
              <TrendingUp size={18} className="text-sky-500" />
              Fluxo de Caixa
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Fluxo diário de recebimentos (clique na coluna para ver detalhes)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    const dayStr = data.activePayload[0].payload.date;
                    const payments = completedClasses.filter(c => c.paymentStatus === 'PAID' && c.paidAt?.startsWith(dayStr));
                    setSelectedDayData(payments);
                    setShowDailyDetailModal(true);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="recebido" fill="#0ea5e9" radius={[4, 4, 0, 0]} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl pb-12">
        <div className="p-8 border-b border-slate-800 bg-slate-900/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tight">Confirmar Recebimentos</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gerencie os recebimentos pendentes por vencimento</p>
          </div>
          <div className="flex bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50">
            {[
              { id: 'OVERDUE', label: 'Atrasados' },
              { id: 'THIS_WEEK', label: 'Esta Semana' },
              { id: 'NEXT_WEEK', label: 'Próxima Semana' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setRecebimentoTab(tab.id as any); setCurrentPage(1); }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  recebimentoTab === tab.id 
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {currentCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentCards.map((g, idx) => (
                <div key={idx} className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl flex flex-col h-full group hover:border-amber-500/50 transition-all cursor-default">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-amber-500/10 p-2.5 rounded-xl">
                      <Clock size={18} className="text-amber-500" />
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Vencimento</p>
                      <p className="text-xs text-white font-black">{new Date(g.latestDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setSelectedStudentClasses(g.classes); setShowStudentModal(true); }}
                    className="group"
                  >
                    <h5 className="text-white font-black text-xs uppercase tracking-tight group-hover:text-amber-500 transition-colors flex items-center gap-1">
                      {g.studentName}
                      <ChevronRight size={12} className="opacity-40" />
                    </h5>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{g.count} aula(s) acumuladas</p>
                  </button>

                  <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                    <div>
                      <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Total</p>
                      <p className="text-base text-amber-500 font-black">R$ {(g.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (g.count > 1) {
                          onShowToast('Para confirmação em lote, visualize os detalhes primeiro.');
                          setSelectedStudentClasses(g.classes);
                          setShowStudentModal(true);
                        } else {
                          setSelectedClass(g.classes[0]);
                          setShowPaymentModal(true);
                        }
                      }}
                      className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all"
                    >
                      <CheckCircle size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center opacity-20">
              <CheckCircle size={64} className="mx-auto mb-6" />
              <p className="text-sm font-black uppercase tracking-widest">Nada pendente aqui</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-6">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-3 bg-slate-800/50 text-gray-400 rounded-xl hover:text-white transition-colors disabled:opacity-20"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${currentPage === i + 1 ? 'bg-amber-500 scale-125' : 'bg-slate-700'}`}
                  />
                ))}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-3 bg-slate-800/50 text-gray-400 rounded-xl hover:text-white transition-colors disabled:opacity-20"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && <PaymentModal />}
      {showStudentModal && <StudentClassesModal />}
      {showDailyDetailModal && <DailyDetailModal />}
    </div>
  );
};
