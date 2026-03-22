import React, { useState, useEffect } from 'react';
import { UserRole, FinanceAccount, FinanceTransaction } from './types';
import { SupabaseService } from './services/supabaseService';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Wallet, Landmark, CreditCard, ArrowRightLeft, Tag, Calendar as CalendarIcon, Trash2 } from 'lucide-react';

interface FinanceViewProps {
  userEmail: string;
  userRole: UserRole;
  onShowToast: (msg: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ userEmail, userRole, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'ACCOUNTS'>('TRANSACTIONS');
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  // Forms state
  const [newAccount, setNewAccount] = useState<Partial<FinanceAccount>>({ name: '', type: 'CHECKING', balance: 0 });
  const [newTransaction, setNewTransaction] = useState<Partial<FinanceTransaction>>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    type: 'EXPENSE',
    status: 'COMPLETED'
  });

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setIsLoading(true);
    try {
      const accs = await SupabaseService.getFinanceAccounts();
      const trans = await SupabaseService.getFinanceTransactions();
      setAccounts(accs);
      setTransactions(trans);
      if (accs.length > 0 && !newTransaction.accountId) {
        setNewTransaction(prev => ({ ...prev, accountId: accs[0].id }));
      }
    } catch (e) {
      onShowToast("Erro ao carregar dados financeiros.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalBalance = () => accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
  const calculateMonthlyIncome = () => {
    const currentMonth = new Date().getMonth();
    return transactions.filter(t => t.type === 'INCOME' && new Date(t.date).getMonth() === currentMonth)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  };
  const calculateMonthlyExpense = () => {
    const currentMonth = new Date().getMonth();
    return transactions.filter(t => t.type === 'EXPENSE' && new Date(t.date).getMonth() === currentMonth)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await SupabaseService.saveFinanceAccount(newAccount);
    if (success) {
      onShowToast("Conta cadastrada com sucesso!");
      setIsAccountModalOpen(false);
      setNewAccount({ name: '', type: 'CHECKING', balance: 0 });
      loadFinanceData();
    } else {
      onShowToast("Erro ao cadastrar conta.");
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.accountId) {
      onShowToast("Selecione uma conta válida.");
      return;
    }
    
    // Convert logic for visual inputs (despesa is practically negative towards balance, but saved as absolute amount)
    const transactionToSave = { ...newTransaction };
    
    const success = await SupabaseService.saveFinanceTransaction(transactionToSave);
    
    if (success) {
      // Update account balance (simplified local/remote logic)
      const account = accounts.find(a => a.id === transactionToSave.accountId);
      if (account) {
        const amountNum = Number(transactionToSave.amount);
        const newBalance = transactionToSave.type === 'INCOME' 
          ? Number(account.balance) + amountNum 
          : transactionToSave.type === 'EXPENSE' 
            ? Number(account.balance) - amountNum 
            : Number(account.balance); // Handle transfer logic properly later
            
        await SupabaseService.saveFinanceAccount({ ...account, balance: newBalance });
      }

      onShowToast("Lançamento registrado!");
      setIsTransactionModalOpen(false);
      setNewTransaction({
        accountId: accounts[0]?.id || '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        type: 'EXPENSE',
        status: 'COMPLETED'
      });
      loadFinanceData();
    } else {
      onShowToast("Erro ao registrar lançamento.");
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'WALLET': return <Wallet size={20} />;
      case 'SAVINGS': return <Landmark size={20} />;
      case 'CREDIT': return <CreditCard size={20} />;
      default: return <Landmark size={20} />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-hidden relative">
      <div className="p-6 pb-24 lg:pb-6 flex-1 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header & Dashboard */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="text-emerald-400" size={28} />
                  Finanças Pessoais
                </h2>
                <p className="text-gray-400 mt-1">Gestão de Lançamentos</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700 font-medium flex items-center gap-2"
                >
                  <Wallet size={18} /> Nova Conta
                </button>
                <button
                  onClick={() => setIsTransactionModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/20 font-medium flex items-center gap-2"
                >
                  <Plus size={18} /> Novo Lançamento
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1a1936] rounded-xl border border-gray-800 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Wallet size={16} />
                  <span className="text-sm font-semibold uppercase tracking-wider">Saldo Total (Contas)</span>
                </div>
                <span className="text-3xl font-bold text-white">{formatCurrency(calculateTotalBalance())}</span>
              </div>
              
              <div className="bg-[#1a1936] rounded-xl border border-gray-800 p-6 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4"></div>
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <ArrowUpRight size={16} />
                  <span className="text-sm font-semibold uppercase tracking-wider">Receitas (Mês)</span>
                </div>
                <span className="text-3xl font-bold text-emerald-400">{formatCurrency(calculateMonthlyIncome())}</span>
              </div>
              
              <div className="bg-[#1a1936] rounded-xl border border-gray-800 p-6 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full -mr-4 -mt-4"></div>
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <ArrowDownRight size={16} />
                  <span className="text-sm font-semibold uppercase tracking-wider">Despesas (Mês)</span>
                </div>
                <span className="text-3xl font-bold text-red-400">{formatCurrency(calculateMonthlyExpense())}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'TRANSACTIONS' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            >
              Lançamentos
            </button>
            <button
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'ACCOUNTS' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            >
              Minhas Contas
            </button>
          </div>

          {/* Content Area */}
          <div className="bg-[#1a1936] rounded-xl border border-gray-800 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : activeTab === 'TRANSACTIONS' ? (
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">Nenhum lançamento registrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                          <th className="pb-3 px-4 font-semibold">Data</th>
                          <th className="pb-3 px-4 font-semibold">Descrição</th>
                          <th className="pb-3 px-4 font-semibold">Categoria</th>
                          <th className="pb-3 px-4 font-semibold">Conta</th>
                          <th className="pb-3 px-4 font-semibold text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(t => {
                          const acc = accounts.find(a => a.id === t.accountId);
                          const isIncome = t.type === 'INCOME';
                          return (
                            <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group">
                              <td className="py-4 px-4 text-gray-300 text-sm">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                              <td className="py-4 px-4 text-white font-medium text-sm flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : t.type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {isIncome ? <ArrowUpRight size={16} /> : t.type === 'TRANSFER' ? <ArrowRightLeft size={16} /> : <ArrowDownRight size={16} />}
                                </div>
                                {t.description}
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                                  <Tag size={12} /> {t.category}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-gray-400 text-sm flex items-center gap-2">
                                {acc ? getAccountIcon(acc.type) : <Wallet size={16}/>}
                                {acc?.name || 'Desconhecida'}
                              </td>
                              <td className={`py-4 px-4 font-bold text-sm text-right ${isIncome ? 'text-emerald-400' : t.type === 'TRANSFER' ? 'text-blue-400' : 'text-red-400'}`}>
                                {isIncome ? '+ ' : t.type === 'EXPENSE' ? '- ' : ''}{formatCurrency(t.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-gray-500 text-sm">Nenhuma conta cadastrada.</div>
                ) : (
                  accounts.map(acc => (
                    <div key={acc.id} className="bg-[#111029] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            {getAccountIcon(acc.type)}
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{acc.name}</h3>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{acc.type}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-end">
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Saldo Atual</div>
                        <div className="text-2xl font-bold text-white">{formatCurrency(acc.balance)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1936] rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl overflow-hidden shadow-emerald-900/10">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="text-emerald-400" /> Nova Conta
              </h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-gray-400 hover:text-white"><Plus className="rotate-45" size={24} /></button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome da Conta</label>
                <input required type="text" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Ex: Nubank, Carteira..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tipo</label>
                <select required value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                  <option value="CHECKING">Conta Corrente</option>
                  <option value="WALLET">Carteira (Dinheiro)</option>
                  <option value="SAVINGS">Poupança</option>
                  <option value="CREDIT">Cartão de Crédito</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Saldo Inicial</label>
                <input required type="number" step="0.01" value={newAccount.balance || ''} onChange={e => setNewAccount({...newAccount, balance: Number(e.target.value)})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="0.00" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors">Salvar Conta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1936] rounded-2xl w-full max-w-lg border border-gray-800 shadow-2xl overflow-hidden shadow-emerald-900/10">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#111029]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="text-emerald-400" /> Novo Lançamento
              </h3>
              <button onClick={() => setIsTransactionModalOpen(false)} className="text-gray-400 hover:text-white"><Plus className="rotate-45" size={24} /></button>
            </div>
            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {accounts.length === 0 ? (
                <div className="text-amber-500 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-sm">
                  ⚠️ Crie uma Conta primeiro antes de registrar um lançamento.
                </div>
              ) : (
                <>
                  <div className="flex gap-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${newTransaction.type === 'INCOME' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold' : 'border-gray-800 text-gray-400 hover:border-gray-700'}`}>
                      <input type="radio" className="hidden" name="type" checked={newTransaction.type === 'INCOME'} onChange={() => setNewTransaction({...newTransaction, type: 'INCOME'})} />
                      <ArrowUpRight size={18} /> Receita
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${newTransaction.type === 'EXPENSE' ? 'border-red-500 bg-red-500/10 text-red-400 font-bold' : 'border-gray-800 text-gray-400 hover:border-gray-700'}`}>
                      <input type="radio" className="hidden" name="type" checked={newTransaction.type === 'EXPENSE'} onChange={() => setNewTransaction({...newTransaction, type: 'EXPENSE'})} />
                      <ArrowDownRight size={18} /> Despesa
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Valor</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                          <input required type="number" step="0.01" min="0" value={newTransaction.amount || ''} onChange={e => setNewTransaction({...newTransaction, amount: Number(e.target.value)})} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white font-bold text-lg focus:outline-none focus:border-emerald-500" placeholder="0,00" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Data</label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <input required type="date" value={newTransaction.date} onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]" />
                        </div>
                      </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descrição</label>
                    <input required type="text" value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Ex: Mercado, Uber, Salário..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categoria</label>
                        <div className="relative">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <input required type="text" value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500" placeholder="Alimentação..." />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Conta</label>
                        <div className="relative">
                          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <select required value={newTransaction.accountId} onChange={e => setNewTransaction({...newTransaction, accountId: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 appearance-none">
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                  </div>
                  
                  <div className="pt-4 flex gap-3 border-t border-gray-800">
                    <button type="button" onClick={() => setIsTransactionModalOpen(false)} className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors">Lançar</button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
