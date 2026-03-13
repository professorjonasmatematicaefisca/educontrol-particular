import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Search, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { UserRole, ScheduledClass, Student } from './types';
import { SupabaseService } from './services/supabaseService';

interface FinancialViewProps {
  onShowToast: (msg: string) => void;
  userEmail: string;
  userRole: UserRole;
}

export const FinancialView: React.FC<FinancialViewProps> = ({ onShowToast }) => {
  const [completedClasses, setCompletedClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchFinancialData();
  }, [filterMonth]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const startOfMonth = `${filterMonth}-01`;
      const endOfMonth = `${filterMonth}-31`; // Simplified
      const data = await SupabaseService.getScheduledClasses(startOfMonth, endOfMonth);
      setCompletedClasses(data.filter(c => c.status === 'COMPLETED'));
    } catch (error) {
      onShowToast('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = completedClasses.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
  const totalClasses = completedClasses.length;
  
  // Group by student for a summary
  const studentSummary = completedClasses.reduce((acc: any, curr) => {
    const studentName = (curr as any).studentName || 'Desconhecido';
    if (!acc[studentName]) acc[studentName] = { total: 0, count: 0 };
    acc[studentName].total += (curr.totalValue || 0);
    acc[studentName].count += 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Financeiro</h1>
          <p className="text-gray-400">Controle de faturamento das aulas dadas</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Período:</label>
          <input 
            type="month" 
            className="bg-[#1e293b] border border-gray-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={80} />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="text-emerald-500" />
            </div>
            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Receita Total</h3>
          </div>
          <p className="text-3xl font-black text-white">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-emerald-500 text-xs mt-2 flex items-center gap-1 font-bold">
            + {totalClasses} aulas realizadas no mês
          </p>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <CalendarIcon className="text-blue-500" />
            </div>
            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Aulas no Período</h3>
          </div>
          <p className="text-3xl font-black text-white">{totalClasses}</p>
          <p className="text-blue-500 text-xs mt-2 font-bold">Média de {(totalRevenue / (totalClasses || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por aula</p>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <CreditCard className="text-purple-500" />
            </div>
            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Clientes Ativos</h3>
          </div>
          <p className="text-3xl font-black text-white">{Object.keys(studentSummary).length}</p>
          <p className="text-purple-500 text-xs mt-2 font-bold">Resumo por aluno abaixo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo por Aluno */}
        <div className="bg-[#1e293b] rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0f172a] border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Filter size={18} className="text-emerald-500" />
              Resumo por Aluno
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {Object.entries(studentSummary).map(([name, data]: [string, any]) => (
                <div key={name} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
                  <div>
                    <p className="font-bold text-white">{name}</p>
                    <p className="text-xs text-gray-500">{data.count} aulas dadas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-400">R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
              {Object.keys(studentSummary).length === 0 && (
                <p className="text-center text-gray-500 py-10 italic">Nenhum dado financeiro para este período</p>
              )}
            </div>
          </div>
        </div>

        {/* Últimos Lançamentos */}
        <div className="bg-[#1e293b] rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0f172a] border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-white">Detalhamento de Aulas</h3>
          </div>
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-[#0f172a] z-10">
                <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                  <th className="p-4">Data</th>
                  <th className="p-4">Aluno</th>
                  <th className="p-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {completedClasses.slice().reverse().map(c => (
                  <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 text-xs text-gray-400">{new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 font-bold text-gray-300 text-sm">{(c as any).studentName}</td>
                    <td className="p-4 text-right font-black text-white text-sm">R$ {(c.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
