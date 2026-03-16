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
  ChevronDown
} from 'lucide-react';
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
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={100} /></div>
          <p className="text-emerald-500 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Faturamento Recebido</p>
          <h4 className="text-4xl font-black text-white">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          <p className="text-[10px] text-gray-500 font-bold mt-4 uppercase tracking-widest">{paidClasses.length} aulas confirmadas</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Clock size={100} /></div>
          <p className="text-amber-500 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Aguardando Pagamento</p>
          <h4 className="text-4xl font-black text-white">R$ {pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          <p className="text-[10px] text-gray-500 font-bold mt-4 uppercase tracking-widest">{pendingClasses.length} aulas pendentes</p>
        </div>

        <div className="bg-emerald-500 p-8 rounded-[2.5rem] shadow-[0_0_30px_rgba(16,185,129,0.2)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20"><Search size={100} className="text-white" /></div>
          <p className="text-emerald-900 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Total do Período</p>
          <h4 className="text-4xl font-black text-white">R$ {(totalRevenue + pendingRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          <p className="text-[10px] text-emerald-900/70 font-bold mt-4 uppercase tracking-widest">{completedClasses.length} aulas totais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Pendentes */}
        <div className="lg:col-span-12">
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="p-8 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tight">Confirmar Recebimentos</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Clique para atribuir o pagamento a uma conta</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-900/20">
                    <th className="p-6">Data</th>
                    <th className="p-6">Aluno</th>
                    <th className="p-6">Valor</th>
                    <th className="p-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {pendingClasses.map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-all group">
                      <td className="p-6 text-gray-400 font-bold text-sm">
                        {new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-6">
                        <span className="text-white font-black text-sm uppercase tracking-tight">{(c as any).studentName}</span>
                      </td>
                      <td className="p-6">
                        <span className="text-amber-500 font-black text-sm">R$ {(c.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => { setSelectedClass(c); setShowPaymentModal(true); }}
                          className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
                        >
                          Confirmar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingClasses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <div className="opacity-20 flex flex-col items-center">
                          <CheckCircle size={48} className="mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma aula pendente de pagamento</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Histórico Confirmado */}
        <div className="lg:col-span-12">
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="p-8 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tight">Fluxo de Caixa Confirmado</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Histórico de entradas por conta bancária</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-900/20">
                    <th className="p-6">Data</th>
                    <th className="p-6">Aluno</th>
                    <th className="p-6">Conta Destino</th>
                    <th className="p-6 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {paidClasses.sort((a,b) => b.classDate.localeCompare(a.classDate)).map(c => {
                    const account = bankAccounts.find(acc => acc.id === c.paymentAccountId);
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-all border-l-4 border-transparent hover:border-emerald-500/50">
                        <td className="p-6 text-gray-400 font-bold text-sm">
                          {new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-6">
                          <span className="text-white font-black text-sm uppercase tracking-tight">{(c as any).studentName}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            {account?.imageUrl && <img src={account.imageUrl} className="w-6 h-6 object-contain" alt="" />}
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg">
                              {account?.name || 'Conta Excluída'}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <span className="text-white font-black text-sm">R$ {(c.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {paidClasses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-20 italic">Sem registros de entradas confirmadas</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && <PaymentModal />}
    </div>
  );
};
