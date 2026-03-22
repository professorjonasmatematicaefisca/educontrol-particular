import React, { useState, useEffect } from 'react';
import { UserRole, FinanceAccount, FinanceTransaction, FinanceGoal } from './types';
import { SupabaseService } from './services/supabaseService';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Wallet, Landmark, CreditCard, ArrowRightLeft, Tag, Calendar as CalendarIcon, Target, PiggyBank, Briefcase, Plane, Heart, Home, GraduationCap, Link2, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

interface FinanceViewProps {
  userEmail: string;
  userRole: UserRole;
  userId: string;
  onShowToast: (msg: string) => void;
}

const UPLOAD_MAX_SIZE = 500 * 1024; // 500kb max para PNG base64

export const FinanceView: React.FC<FinanceViewProps> = ({ userEmail, userRole, userId, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'ACCOUNTS' | 'GOALS'>('TRANSACTIONS');
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTransferGoalModalOpen, setIsTransferGoalModalOpen] = useState(false);

  // Forms state
   const [newAccount, setNewAccount] = useState<Partial<FinanceAccount>>({ 
    name: '', type: 'CHECKING', balance: 0, creditLimit: 0, dueDate: 1, closingDate: 1, logoUrl: '', status: 'ACTIVE' 
  });
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  const [newTransaction, setNewTransaction] = useState<Partial<FinanceTransaction>>({
    amount: undefined, date: new Date().toISOString().split('T')[0], description: '', category: '', type: 'EXPENSE', status: 'COMPLETED'
  });

  const [newGoal, setNewGoal] = useState<Partial<FinanceGoal>>({
    name: '', targetAmount: undefined, currentAmount: 0, color: '#10b981', icon: 'Target', deadline: ''
  });

  const [goalTransfer, setGoalTransfer] = useState<{ goalId: string, accountId: string, amount: number | '', type: 'DEPOSIT' | 'WITHDRAW' }>({
    goalId: '', accountId: '', amount: '', type: 'DEPOSIT'
  });

  const [useCustomLogo, setUseCustomLogo] = useState(false);

  const GOAL_ICONS = [
    { id: 'Target', icon: <Target size={20} /> },
    { id: 'PiggyBank', icon: <PiggyBank size={20} /> },
    { id: 'Briefcase', icon: <Briefcase size={20} /> },
    { id: 'Plane', icon: <Plane size={20} /> },
    { id: 'Heart', icon: <Heart size={20} /> },
    { id: 'Home', icon: <Home size={20} /> },
    { id: 'GraduationCap', icon: <GraduationCap size={20} /> }
  ];

  const getGoalIconComponent = (iconId?: string) => {
    const defaultIcon = <Target size={20} />;
    if (!iconId) return defaultIcon;
    const found = GOAL_ICONS.find(g => g.id === iconId);
    return found ? found.icon : defaultIcon;
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setIsLoading(true);
    try {
      const [accs, trans, fetchedGoals] = await Promise.all([
        SupabaseService.getFinanceAccounts(userId),
        SupabaseService.getFinanceTransactions(undefined, userId),
        SupabaseService.getFinanceGoals(userId)
      ]);
      setAccounts(accs);
      setTransactions(trans);
      setGoals(fetchedGoals);
      
      if (accs.length > 0 && !newTransaction.accountId) {
        setNewTransaction(prev => ({ ...prev, accountId: accs[0].id }));
        setGoalTransfer(prev => ({ ...prev, accountId: accs.filter(a => a.type !== 'CREDIT')[0]?.id || accs[0].id }));
      }
    } catch (e) {
      console.error(e);
      onShowToast("Erro ao carregar dados. Verifique sua conexão ou migrations pendentes.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalBalance = () => {
    return accounts
      .filter(a => a.type !== 'CREDIT')
      .reduce((acc, curr) => acc + Number(curr.balance), 0);
  };

  const calculateTotalGoals = () => {
    return goals.reduce((acc, curr) => acc + Number(curr.currentAmount), 0);
  };

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
    const accountToSave = { ...newAccount };
    
    if (accountToSave.type !== 'CREDIT') {
      delete accountToSave.creditLimit;
      delete accountToSave.dueDate;
      delete accountToSave.closingDate;
    } else {
      accountToSave.balance = accountToSave.balance || 0;
    }

    try {
      const accountData = { ...accountToSave, userId };
      if (editingAccountId) {
        accountData.id = editingAccountId;
      }
      await SupabaseService.saveFinanceAccount(accountData, userId);
      onShowToast(editingAccountId ? "Conta atualizada!" : "Conta cadastrada!");
      setIsAccountModalOpen(false);
      setEditingAccountId(null);
      setNewAccount({ name: '', type: 'CHECKING', balance: 0, creditLimit: 0, dueDate: 1, closingDate: 1, logoUrl: '', status: 'ACTIVE' });
      setUseCustomLogo(false);
      loadFinanceData();
    } catch (err: any) {
      console.error(err);
      onShowToast(`Erro no Banco: ${err.message}. Você rodou o SQL V4 no Supabase?`);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > UPLOAD_MAX_SIZE) {
      onShowToast("Erro: A imagem da logo deve ter no máximo 500KB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewAccount({...newAccount, logoUrl: reader.result as string});
    };
    reader.readAsDataURL(file);
  };

  const handleEditAccount = (account: FinanceAccount) => {
    setEditingAccountId(account.id);
    setNewAccount({
      name: account.name,
      type: account.type,
      balance: account.balance,
      creditLimit: account.creditLimit || 0,
      dueDate: account.dueDate || 1,
      closingDate: account.closingDate || 1,
      logoUrl: account.logoUrl || '',
      status: account.status || 'ACTIVE'
    });
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta "${name}"? Todas as transações ligadas a ela poderão ser afetadas.`)) {
      const success = await SupabaseService.deleteFinanceAccount(id);
      if (success) {
        onShowToast("Conta excluída!");
        loadFinanceData();
      } else {
        onShowToast("Erro ao excluir conta.");
      }
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.accountId || !newTransaction.amount) {
      onShowToast("Preencha todos os campos obrigatórios.");
      return;
    }
    
    const transactionToSave = { ...newTransaction, userId };
    const success = await SupabaseService.saveFinanceTransaction(transactionToSave, userId);
    
    if (success) {
      const account = accounts.find(a => a.id === transactionToSave.accountId);
      if (account) {
        let newBalance = Number(account.balance);
        const amountNum = Number(transactionToSave.amount);

        if (account.type === 'CREDIT') {
          if (transactionToSave.type === 'EXPENSE') newBalance += amountNum;
          else if (transactionToSave.type === 'INCOME' || transactionToSave.type === 'TRANSFER') newBalance -= amountNum;
        } else {
          if (transactionToSave.type === 'INCOME') newBalance += amountNum;
          else if (transactionToSave.type === 'EXPENSE') newBalance -= amountNum;
        }
            
        await SupabaseService.saveFinanceAccount({ ...account, balance: newBalance }, userId);
      }

      onShowToast("Lançamento registrado!");
      setIsTransactionModalOpen(false);
      setNewTransaction({
        accountId: accounts[0]?.id || '', amount: undefined, date: new Date().toISOString().split('T')[0],
        description: '', category: '', type: 'EXPENSE', status: 'COMPLETED'
      });
      loadFinanceData();
    } else {
      onShowToast("Erro ao registrar lançamento.");
    }
  };

  const openTransferGoalModal = (goalId: string, type: 'DEPOSIT' | 'WITHDRAW') => {
    setGoalTransfer({ goalId, accountId: accounts.filter(a => a.type !== 'CREDIT')[0]?.id || '', amount: '', type });
    setIsTransferGoalModalOpen(true);
  };

  const executeGoalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTransfer.amount || Number(goalTransfer.amount) <= 0) {
      onShowToast("Digite um valor válido.");
      return;
    }
    
    const goal = goals.find(g => g.id === goalTransfer.goalId);
    const originAcc = accounts.find(a => a.id === goalTransfer.accountId);
    
    if (!goal || !originAcc) return;

    const amount = Number(goalTransfer.amount);

    if (goalTransfer.type === 'DEPOSIT') {
      if (originAcc.balance < amount) {
        onShowToast("Saldo insuficiente na conta de origem.");
        return;
      }
      
      await SupabaseService.saveFinanceAccount({ ...originAcc, balance: originAcc.balance - amount }, userId);
      await SupabaseService.saveFinanceTransaction({ accountId: originAcc.id, amount, date: new Date().toISOString(), description: `Guarda na Caixinha: ${goal.name}`, category: 'Investimento/Metas', type: 'EXPENSE', status: 'COMPLETED', userId }, userId);
      await SupabaseService.saveFinanceGoal({ ...goal, currentAmount: Number(goal.currentAmount) + amount }, userId);
      
      onShowToast("Dinheiro guardado na caixinha!");
    } else {
      if (goal.currentAmount < amount) {
        onShowToast("A caixinha não possui esse saldo.");
        return;
      }

      await SupabaseService.saveFinanceGoal({ ...goal, currentAmount: Number(goal.currentAmount) - amount }, userId);
      await SupabaseService.saveFinanceAccount({ ...originAcc, balance: originAcc.balance + amount }, userId);
      await SupabaseService.saveFinanceTransaction({ accountId: originAcc.id, amount, date: new Date().toISOString(), description: `Resgate da Caixinha: ${goal.name}`, category: 'Investimento/Metas', type: 'INCOME', status: 'COMPLETED', userId }, userId);

      onShowToast("Dinheiro resgatado com sucesso!");
    }

    setIsTransferGoalModalOpen(false);
    loadFinanceData();
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount) return;

    const goalToSave = { ...newGoal, targetAmount: Number(newGoal.targetAmount), userId };
    if (!goalToSave.deadline) delete goalToSave.deadline; 

    const success = await SupabaseService.saveFinanceGoal(goalToSave, userId);
    if (success) {
      onShowToast("Caixinha criada!");
      setIsGoalModalOpen(false);
      setNewGoal({ name: '', targetAmount: undefined, currentAmount: 0, color: '#10b981', icon: 'Target', deadline: '' });
      loadFinanceData();
    } else {
      onShowToast("Erro ao criar Caixinha.");
    }
  };

  const getAccountIcon = (acc: FinanceAccount) => {
    if (acc.logoUrl) {
      return <img src={acc.logoUrl} alt={acc.name} className="w-8 h-8 object-contain rounded-md" />;
    }
    switch (acc.type) {
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
                <p className="text-gray-400 mt-1">Gestão de Lançamentos e Metas</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsTransactionModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/20 font-medium flex items-center gap-2"
                >
                  <Plus size={18} /> Novo Lançamento
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1a1936] rounded-xl border border-gray-800 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Wallet size={16} />
                  <span className="text-sm font-semibold uppercase tracking-wider">Saldo em Contas</span>
                </div>
                <span className="text-3xl font-bold text-white">{formatCurrency(calculateTotalBalance())}</span>
              </div>
              
              <div className="bg-[#111029] rounded-xl border border-gray-800 p-6 flex flex-col justify-center relative shadow-inner overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -mr-4 -mt-4"></div>
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <PiggyBank size={16} />
                  <span className="text-sm font-semibold uppercase tracking-wider">Total em Caixinhas</span>
                </div>
                <span className="text-3xl font-bold text-purple-400">{formatCurrency(calculateTotalGoals())}</span>
              </div>
              
              <div className="bg-[#1a1936] rounded-xl border border-gray-800 p-6 flex flex-col justify-center relative overflow-hidden">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <ArrowUpRight size={16} />
                  <span className="text-sm font-semibold uppercase tracking-wider">Receitas (Mês)</span>
                </div>
                <span className="text-3xl font-bold text-emerald-400">{formatCurrency(calculateMonthlyIncome())}</span>
              </div>
              
              <div className="bg-[#1a1936] rounded-xl border border-gray-800 p-6 flex flex-col justify-center relative overflow-hidden">
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
            <button onClick={() => setActiveTab('TRANSACTIONS')} className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'TRANSACTIONS' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>Lançamentos</button>
            <button onClick={() => setActiveTab('ACCOUNTS')} className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'ACCOUNTS' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>Minhas Contas</button>
            <button onClick={() => setActiveTab('GOALS')} className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'GOALS' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>Caixinhas & Metas</button>
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
                          <th className="pb-3 px-4 font-semibold">Conta / Origem</th>
                          <th className="pb-3 px-4 font-semibold text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(t => {
                          const acc = accounts.find(a => a.id === t.accountId);
                          const isIncome = t.type === 'INCOME';
                          
                          const amountColor = isIncome ? 'text-emerald-400' : t.type === 'TRANSFER' ? 'text-blue-400' : 'text-red-400';
                          const prefixStr = isIncome ? '+ ' : t.type === 'EXPENSE' ? '- ' : '';

                          return (
                            <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group">
                              <td className="py-4 px-4 text-gray-300 text-sm">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                              <td className="py-4 px-4 text-white font-medium text-sm flex items-center gap-2">
                                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : t.type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {isIncome ? <ArrowUpRight size={16} /> : t.type === 'TRANSFER' ? <ArrowRightLeft size={16} /> : <ArrowDownRight size={16} />}
                                </div>
                                <span className="truncate max-w-[150px] md:max-w-none block">{t.description}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                                  <Tag size={12} /> {t.category}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-gray-400 text-sm flex items-center gap-2">
                                {acc ? getAccountIcon(acc) : <Wallet size={16}/>}
                                <span className="truncate max-w-[100px] block">{acc?.name || 'Caixinha Externa'}</span>
                              </td>
                              <td className={`py-4 px-4 font-bold text-sm text-right ${amountColor} whitespace-nowrap`}>
                                {prefixStr}{formatCurrency(t.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'ACCOUNTS' ? (
              <div className="space-y-6">
                <div className="flex justify-end">
                   <button onClick={() => setIsAccountModalOpen(true)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700 font-medium flex items-center gap-2 text-sm"><Wallet size={16} /> Nova Conta / Cartão</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500 text-sm">Nenhuma conta cadastrada.</div>
                  ) : (
                    accounts.map(acc => {
                      const isCreditCard = acc.type === 'CREDIT';
                      const usedPercentage = isCreditCard && acc.creditLimit ? Math.min((acc.balance / acc.creditLimit) * 100, 100) : 0;
                      
                      return (
                        <div key={acc.id} className={`bg-[#111029] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors relative overflow-hidden group ${acc.status === 'INACTIVE' ? 'opacity-60' : ''}`}>
                          {isCreditCard && (
                            <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)' }}>
                              <div className={`absolute bottom-0 w-full ${usedPercentage > 85 ? 'bg-red-500' : usedPercentage > 60 ? 'bg-amber-400' : 'bg-emerald-500'} transition-all`} style={{ height: `${usedPercentage}%` }}></div>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/5 rounded-lg text-gray-300 flex items-center justify-center overflow-hidden border border-gray-800/50">
                                {getAccountIcon(acc)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-white font-bold">{acc.name}</h3>
                                  {acc.status === 'INACTIVE' && <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/20 uppercase">Inativa</span>}
                                </div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{acc.type}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditAccount(acc)} className="p-2 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg border border-gray-700 shadow-lg" title="Editar Conta"><Edit2 size={14} /></button>
                              <button onClick={() => handleDeleteAccount(acc.id, acc.name)} className="p-2 bg-gray-800 hover:bg-red-900/30 text-red-400 rounded-lg border border-gray-700 shadow-lg" title="Excluir Conta"><Trash2 size={14} /></button>
                            </div>
                          </div>
                          {isCreditCard ? (
                            <>
                              <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-end">
                                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Fatura Atual</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(acc.balance)}</div>
                              </div>
                              <div className="mt-2 flex justify-between text-xs text-gray-500 mb-4">
                                <span>Limite: {formatCurrency(acc.creditLimit || 0)}</span>
                                <span>Venc: dia {acc.dueDate || '--'}</span>
                              </div>
                              <button onClick={() => { setNewTransaction({ ...newTransaction, type: 'INCOME', accountId: acc.id, description: 'Pagamento de Fatura', category: 'Fatura' }); setIsTransactionModalOpen(true); }} className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold rounded-lg transition-colors text-sm flex justify-center items-center gap-2">
                                <Wallet size={16} /> Pagar Fatura
                              </button>
                            </>
                          ) : (
                            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-end">
                              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Saldo Atual</div>
                              <div className="text-2xl font-bold text-white">{formatCurrency(acc.balance)}</div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              // GOALS (Caixinhas) VIEW
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-4 gap-4">
                  <p className="text-gray-400 text-sm max-w-xl">Reserve dinheiro de forma organizada. Crie metas para fundo de emergência, viagens, IPVA ou o que desejar.</p>
                  <button onClick={() => setIsGoalModalOpen(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-lg shadow-purple-900/20 font-medium flex items-center justify-center gap-2 text-sm w-full md:w-auto"><Plus size={16} /> Nova Caixinha</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {goals.length === 0 ? (
                    <div className="col-span-full py-10 bg-gray-900/50 rounded-2xl flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800">
                      <PiggyBank size={48} className="mb-4 opacity-50 text-purple-400" />
                      <p>Você não criou nenhuma caixinha ainda.</p>
                    </div>
                  ) : (
                    goals.map(goal => {
                      const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                      const isComplete = pct === 100;

                      return (
                        <div key={goal.id} className="bg-[#111029] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors flex flex-col">
                           <div className="p-5 flex-1 relative">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${goal.color || '#10b981'}20`, color: goal.color || '#10b981' }}>
                                    {getGoalIconComponent(goal.icon)}
                                 </div>
                                 {isComplete && <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Target size={12}/> Metida Atingida!</div>}
                              </div>
                              <h3 className="text-white font-bold text-lg">{goal.name}</h3>
                              <p className="text-xs text-gray-500 mt-1">{goal.deadline ? `Agendado para ${new Date(goal.deadline).toLocaleDateString('pt-BR')}` : 'Sem prazo definido'}</p>

                              <div className="mt-5">
                                 <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white font-bold">{formatCurrency(goal.currentAmount)}</span>
                                    <span className="text-gray-500">de {formatCurrency(goal.targetAmount)}</span>
                                 </div>
                                 <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden shadow-inner flex">
                                    <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${pct}%`, backgroundColor: goal.color || '#10b981' }}>
                                       <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex border-t border-gray-800 bg-[#161530]">
                              <button onClick={() => openTransferGoalModal(goal.id, 'WITHDRAW')} className="flex-1 py-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors border-r border-gray-800 flex items-center justify-center gap-2">Resgatar</button>
                              <button onClick={() => openTransferGoalModal(goal.id, 'DEPOSIT')} className="flex-1 py-3 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-2">Guardar</button>
                           </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1936] rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl overflow-hidden shadow-emerald-900/10 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className={editingAccountId ? "text-blue-400" : "text-emerald-400"} /> 
                {editingAccountId ? "Editar Conta" : "Nova Conta"}
              </h3>
              <button onClick={() => { setIsAccountModalOpen(false); setEditingAccountId(null); setNewAccount({ name: '', type: 'CHECKING', balance: 0, creditLimit: 0, dueDate: 1, closingDate: 1, logoUrl: '', status: 'ACTIVE' }); }} className="text-gray-400 hover:text-white"><Plus className="rotate-45" size={24} /></button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              <form id="accountForm" onSubmit={handleSaveAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome da Conta / Cartão</label>
                  <input required type="text" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Ex: Nubank, Inter..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tipo</label>
                  <select required value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value as any})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                    <option value="CHECKING">Conta Corrente</option>
                    <option value="WALLET">Carteira (Dinheiro)</option>
                    <option value="SAVINGS">Poupança</option>
                    <option value="BROKERAGE">Investimentos / Corretora</option>
                    <option value="CREDIT">Cartão de Crédito</option>
                  </select>
                </div>

                {/* STATUS TOGGLE */}
                {editingAccountId && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status da Conta</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setNewAccount({...newAccount, status: 'ACTIVE'})} className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newAccount.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-gray-900/50 border-gray-800 text-gray-500'}`}>
                        <CheckCircle2 size={18} /> Ativa
                      </button>
                      <button type="button" onClick={() => setNewAccount({...newAccount, status: 'INACTIVE'})} className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newAccount.status === 'INACTIVE' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-gray-900/50 border-gray-800 text-gray-500'}`}>
                        <XCircle size={18} /> Inativa
                      </button>
                    </div>
                  </div>
                )}

                {/* LOGO UPLOADER */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Logo do Banco (Opcional)</label>
                  <div className="flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-xl p-3">
                    {newAccount.logoUrl ? (
                      <div className="relative group">
                        <img src={newAccount.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-white shrink-0 shadow-lg" />
                        <button type="button" onClick={() => setNewAccount({...newAccount, logoUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Remover Logo"><Plus className="rotate-45" size={14}/></button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 border border-dashed border-gray-700">
                         <Link2 size={20} className="text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-colors border border-gray-700">
                        <Plus size={14} /> Selecionar Imagem PNG/JPG
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <p className="text-[10px] text-gray-500 mt-1">Máx 500KB.</p>
                    </div>
                  </div>
                </div>

                {newAccount.type === 'CREDIT' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Limite Total (R$)</label>
                      <input required type="number" step="0.01" value={newAccount.creditLimit || ''} onChange={e => setNewAccount({...newAccount, creditLimit: Number(e.target.value)})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="5000.00" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vencimento</label>
                         <input required type="number" min="1" max="31" value={newAccount.dueDate || ''} onChange={e => setNewAccount({...newAccount, dueDate: Number(e.target.value)})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fechamento</label>
                         <input required type="number" min="1" max="31" value={newAccount.closingDate || ''} onChange={e => setNewAccount({...newAccount, closingDate: Number(e.target.value)})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                       </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fatura Inicial</label>
                      <input type="number" step="0.01" value={newAccount.balance || ''} onChange={e => setNewAccount({...newAccount, balance: Number(e.target.value)})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="0.00" />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Saldo Inicial</label>
                    <input required type="number" step="0.01" value={newAccount.balance || ''} onChange={e => setNewAccount({...newAccount, balance: Number(e.target.value)})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="0.00" />
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => setIsAccountModalOpen(false)} className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
              <button type="submit" form="accountForm" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors">Salvar Conta</button>
            </div>

          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1936] rounded-2xl w-full max-w-lg border border-gray-800 shadow-2xl overflow-hidden shadow-emerald-900/10">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#111029]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Plus className="text-emerald-400" /> Novo Lançamento</h3>
              <button onClick={() => setIsTransactionModalOpen(false)} className="text-gray-400 hover:text-white"><Plus className="rotate-45" size={24} /></button>
            </div>
            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {accounts.length === 0 ? (
                <div className="text-amber-500 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-sm">Crie uma Conta primeiro.</div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <input required type="text" value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Ex: Mercado..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categoria</label>
                        <div className="relative">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <input required type="text" value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500" placeholder="Alimentação..." />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Conta</label>
                        <hr className="hidden" />
                        <select required value={newTransaction.accountId} onChange={e => setNewTransaction({...newTransaction, accountId: e.target.value})} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 appearance-none">
                          <option value="">Selecionar Conta</option>
                          {accounts.filter(a => a.status !== 'INACTIVE').map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                          ))}
                        </select>
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

      {/* Goal Modal (Nova Caixinha) */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1936] rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl overflow-hidden shadow-purple-900/10">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#111029]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><PiggyBank className="text-purple-400" /> Nova Caixinha</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-gray-400 hover:text-white"><Plus className="rotate-45" size={24} /></button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto w-full">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome do Objetivo</label>
                <input required type="text" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="Ex: Reserva de Emergência, IPVA..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Valor Alvo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                      <input required type="number" step="0.01" value={newGoal.targetAmount || ''} onChange={e => setNewGoal({...newGoal, targetAmount: Number(e.target.value)})} className="w-full pl-11 pr-3 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500" placeholder="1000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prazo (Opcional)</label>
                    <input type="date" value={newGoal.deadline || ''} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]" />
                  </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cor de Destaque</label>
                <div className="flex gap-3">
                   {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'].map(color => (
                     <button key={color} type="button" onClick={() => setNewGoal({...newGoal, color})} className={`w-8 h-8 rounded-full border-2 transition-transform ${newGoal.color === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                   ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ícone</label>
                <div className="flex flex-wrap gap-3">
                   {GOAL_ICONS.map(i => (
                     <button key={i.id} type="button" onClick={() => setNewGoal({...newGoal, icon: i.id})} className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-colors ${newGoal.icon === i.id ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-gray-800 bg-gray-900/50 text-gray-400'}`}>
                       {i.icon}
                     </button>
                   ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-800">
                <button type="button" onClick={() => setIsGoalModalOpen(false)} className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors">Criar Caixinha</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Transfer Modal (Guardar / Resgatar) */}
      {isTransferGoalModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1936] rounded-2xl w-full max-w-sm border border-gray-800 shadow-2xl overflow-hidden shadow-purple-900/10">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#111029]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {goalTransfer.type === 'DEPOSIT' ? <ArrowRightLeft className="text-purple-400" /> : <ArrowRightLeft className="text-emerald-400" />}
                {goalTransfer.type === 'DEPOSIT' ? 'Guardar' : 'Resgatar'}
              </h3>
              <button onClick={() => setIsTransferGoalModalOpen(false)} className="text-gray-400 hover:text-white"><Plus className="rotate-45" size={24} /></button>
            </div>
            <form onSubmit={executeGoalTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">De qual conta corrente?</label>
                <select required value={goalTransfer.accountId} onChange={e => setGoalTransfer({...goalTransfer, accountId: e.target.value})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                  <option value="" disabled>Selecione uma conta...</option>
                  {accounts.filter(a => a.type !== 'CREDIT' && a.status !== 'INACTIVE').map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                  <input required type="number" step="0.01" min="0" value={goalTransfer.amount} onChange={e => setGoalTransfer({...goalTransfer, amount: Number(e.target.value)})} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white font-bold text-lg focus:outline-none focus:border-purple-500" placeholder="0,00" />
                </div>
              </div>
              <div className="pt-4 flex gap-3 border-t border-gray-800">
                <button type="button" onClick={() => setIsTransferGoalModalOpen(false)} className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className={`flex-1 py-3 font-bold rounded-xl transition-colors text-white ${goalTransfer.type === 'DEPOSIT' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
