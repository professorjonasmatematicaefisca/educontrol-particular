import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, FinanceAccount, FinanceTransaction, FinanceGoal } from './types';
import { SupabaseService } from './services/supabaseService';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Wallet, Landmark, CreditCard, ArrowRightLeft, Tag, Calendar as CalendarIcon, Target, PiggyBank, Briefcase, Plane, Heart, Home, GraduationCap, Link2, Edit2, Trash2, CheckCircle2, XCircle, X, Search, Filter, ChevronDown, ChevronUp, RefreshCw, Layers } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';

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
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [filterPeriod, setFilterPeriod] = useState<'THIS_MONTH' | 'LAST_3_MONTHS' | 'ALL'>('THIS_MONTH');
  const [showFilters, setShowFilters] = useState(false);

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTransferGoalModalOpen, setIsTransferGoalModalOpen] = useState(false);

  // Forms state
   const [newAccount, setNewAccount] = useState<Partial<FinanceAccount>>({ 
    name: '', type: 'CHECKING', balance: 0, initialBalance: 0, creditLimit: 0, dueDate: 1, closingDate: 1, logoUrl: '', status: 'ACTIVE' 
  });
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  const [newTransaction, setNewTransaction] = useState<Partial<FinanceTransaction>>({
    amount: undefined, 
    date: new Date().toISOString().split('T')[0], 
    subcategory: '', 
    beneficiary: '', 
    type: 'EXPENSE', 
    status: 'COMPLETED',
    isRecurring: false,
    recurringPeriod: 'MONTHLY',
    totalInstallments: 1
  });
  const [customCategory, setCustomCategory] = useState('');
  const [customSubcategory, setCustomSubcategory] = useState('');

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

const INCOME_CATEGORIES = [
  { name: 'Salário', subcategories: ['Mensal', 'Bônus', '13º Salário'] },
  { name: 'Investimentos', subcategories: ['Dividendos', 'Juros sobre Capital', 'Rendimento FII'] },
  { name: 'Vendas', subcategories: ['Produtos', 'Serviços', 'Desapego/Usados'] },
  { name: 'Empréstimos', subcategories: ['Recebimento de Empréstimo', 'Amortização'] },
  { name: 'Outros', subcategories: ['Presente', 'Reembolso', 'Prêmio', 'Ajuste'] }
];

const EXPENSE_CATEGORIES = [
  { name: 'Alimentação', subcategories: ['Supermercado', 'Restaurante', 'Lanches', 'Padaria', 'Feira'] },
  { name: 'Moradia', subcategories: ['Aluguel/Parcela Casa', 'Condomínio', 'Energia', 'Água', 'Gás', 'Internet', 'Seguro Residencia', 'Manutenção Casa'] },
  { name: 'Transporte', subcategories: ['Combustível', 'Estacionamento', 'Manutenção Veículo', 'Uber/Taxi', 'Seguro Veículo', 'IPVA/Licenciamento'] },
  { name: 'Lazer', subcategories: ['Viagem', 'Passeio', 'Streamings/Assinaturas', 'Cinema', 'Festas'] },
  { name: 'Saúde', subcategories: ['Medicamentos', 'Consultas', 'Plano de Saúde', 'Academia', 'Exames'] },
  { name: 'Educação', subcategories: ['Curso/Faculdade', 'Livros', 'Mensalidade Escolar', 'Material Escolar'] },
  { name: 'Financeiro', subcategories: ['Dívidas', 'Empréstimos Pagos', 'Multas/Juros', 'Tarifa Bancária', 'Impostos'] },
  { name: 'Compras/Pessoal', subcategories: ['Vestuário', 'Beleza/Higiene', 'Eletrônicos', 'Presentes', 'Pet Shop'] },
  { name: 'Outros', subcategories: ['Ajuste de Saldo', 'Diversos'] }
];

const getGoalIconComponent = (iconId?: string) => {
    const defaultIcon = <Target size={20} />;
    if (!iconId) return defaultIcon;
    const found = GOAL_ICONS.find(g => g.id === iconId);
    return found ? found.icon : defaultIcon;
  };

  useEffect(() => {
    if (userId) {
      loadFinanceData();
    }
  }, [userId]);

  const loadFinanceData = async () => {
    setIsLoading(true);
    try {
      const [accs, trans, fetchedGoals, fetchedClasses] = await Promise.all([
        SupabaseService.getFinanceAccounts(userId),
        SupabaseService.getFinanceTransactions(undefined, userId),
        SupabaseService.getFinanceGoals(userId),
        SupabaseService.getScheduledClasses(undefined, undefined, undefined)
      ]);
      setAccounts(accs);
      setTransactions(trans);
      setGoals(fetchedGoals);
      setClasses(fetchedClasses);
      
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


  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.beneficiary?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
      const matchesAccount = filterAccount === 'ALL' || t.accountId === filterAccount;
      
      let matchesPeriod = true;
      if (filterPeriod === 'THIS_MONTH') {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        matchesPeriod = isWithinInterval(parseISO(t.date), { start, end });
      } else if (filterPeriod === 'LAST_3_MONTHS') {
        const start = startOfMonth(subMonths(new Date(), 2));
        const end = endOfMonth(new Date());
        matchesPeriod = isWithinInterval(parseISO(t.date), { start, end });
      }

      return matchesSearch && matchesCategory && matchesAccount && matchesPeriod;
    });
  }, [transactions, searchTerm, filterCategory, filterAccount, filterPeriod]);

  const chartDataDistribution = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'EXPENSE');
    const categories: Record<string, number> = {};
    expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const chartDataCashFlow = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a,b) => a.date.localeCompare(b.date));
    const daily: Record<string, { income: number, expense: number, balance: number }> = {};
    let runningBalance = 0;
    
    sorted.forEach(t => {
      const day = t.date.split('T')[0];
      if (!daily[day]) daily[day] = { income: 0, expense: 0, balance: 0 };
      if (t.type === 'INCOME') daily[day].income += t.amount;
      else if (t.type === 'EXPENSE') daily[day].expense += t.amount;
      else if (t.type === 'TRANSFER') {
        // Transfers don't change net worth unless it's to/from an untracked account
      }
    });

    return Object.entries(daily).map(([date, data]) => {
      runningBalance += (data.income - data.expense);
      return {
        date: format(parseISO(date), 'dd/MM'),
        income: data.income,
        expense: data.expense,
        balance: runningBalance
      };
    });
  }, [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof filteredTransactions> = {};
    const ungrouped: typeof filteredTransactions = [];

    filteredTransactions.forEach(t => {
      const isParticular = t.category.toLowerCase().includes('aula particular');
      if (isParticular && t.beneficiary && t.subcategory) {
        const dateKey = t.date.includes('T') ? t.date.split('T')[0] : t.date.split(' ')[0];
        const key = `${t.beneficiary}|${t.category}|${t.subcategory}|${dateKey}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      } else {
        ungrouped.push(t);
      }
    });

    const displayItems: any[] = [];
    
    // Add ungrouped items first (they will be sorted anyway)
    ungrouped.forEach(item => displayItems.push(item));

    Object.entries(groups).forEach(([key, items]) => {
      if (items.length > 1) {
        const sum = items.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        displayItems.push({
          isGroup: true,
          key,
          items,
          baseTransaction: items[0],
          totalAmount: sum
        });
      } else {
        displayItems.push(items[0]);
      }
    });

    return displayItems.sort((a, b) => {
      const DateA = a.isGroup ? a.baseTransaction.date : a.date;
      const DateB = b.isGroup ? b.baseTransaction.date : b.date;
      return new Date(DateB).getTime() - new Date(DateA).getTime();
    });
  }, [transactions]);

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
      setNewAccount({ name: '', type: 'CHECKING', balance: 0, initialBalance: 0, creditLimit: 0, dueDate: 1, closingDate: 1, logoUrl: '', status: 'ACTIVE' });
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
      initialBalance: account.initialBalance,
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
    
    const finalCategory = newTransaction.category === 'CUSTOM' ? customCategory : newTransaction.category;
    const finalSubcategory = newTransaction.subcategory === 'CUSTOM' ? customSubcategory : newTransaction.subcategory;

    const baseTransaction: Partial<FinanceTransaction> = {
      ...newTransaction,
      category: finalCategory || 'Outros',
      subcategory: finalSubcategory,
      description: newTransaction.description || finalCategory || 'Lançamento',
      userId
    };

    // Case 1: Transfer between accounts
    if (newTransaction.type === 'TRANSFER' && newTransaction.accountId && (newTransaction as any).destinationAccountId) {
      const destinationId = (newTransaction as any).destinationAccountId;
      const amount = Number(newTransaction.amount);

      // 1. Withdrawal from origin
      await SupabaseService.saveFinanceTransaction({
        ...baseTransaction,
        description: `Transferência p/ ${accounts.find(a => a.id === destinationId)?.name || 'Outra Conta'}`,
        type: 'EXPENSE',
        status: 'COMPLETED'
      }, userId);

      // 2. Deposit to destination
      await SupabaseService.saveFinanceTransaction({
        ...baseTransaction,
        accountId: destinationId,
        description: `Transferência de ${accounts.find(a => a.id === newTransaction.accountId)?.name || 'Outra Conta'}`,
        type: 'INCOME',
        status: 'COMPLETED'
      }, userId);

      // Update balances
      const origin = accounts.find(a => a.id === newTransaction.accountId);
      const dest = accounts.find(a => a.id === destinationId);
      if (origin) await SupabaseService.saveFinanceAccount({ ...origin, balance: Number(origin.balance) - amount }, userId);
      if (dest) await SupabaseService.saveFinanceAccount({ ...dest, balance: Number(dest.balance) + amount }, userId);

      onShowToast("Transferência realizada!");
    } 
    // Case 2: Installments
    else if (Number(newTransaction.totalInstallments) > 1) {
      const total = Number(newTransaction.totalInstallments);
      const installmentId = crypto.randomUUID();
      const amountPerInstallment = Number(newTransaction.amount) / total;
      const baseDate = parseISO(newTransaction.date!);

      for (let i = 0; i < total; i++) {
        const installmentDate = format(new Date(baseDate.getFullYear(), baseDate.getMonth() + i, baseDate.getDate()), 'yyyy-MM-dd');
        await SupabaseService.saveFinanceTransaction({
          ...baseTransaction,
          amount: amountPerInstallment,
          date: installmentDate,
          description: `${baseTransaction.description} (${i + 1}/${total})`,
          installmentId,
          installmentNumber: i + 1,
          totalInstallments: total,
          status: i === 0 ? 'COMPLETED' : 'PENDING'
        }, userId);
      }

      // Update balance for the first one only (or whatever logic user prefers)
      const account = accounts.find(a => a.id === newTransaction.accountId);
      if (account && account.type !== 'CREDIT') {
        await SupabaseService.saveFinanceAccount({ ...account, balance: Number(account.balance) - amountPerInstallment }, userId);
      } else if (account && account.type === 'CREDIT') {
         await SupabaseService.saveFinanceAccount({ ...account, balance: Number(account.balance) + amountPerInstallment }, userId);
      }

      onShowToast(`Parcelamento em ${total}x registrado!`);
    }
    // Case 3: Simple Transaction
    else {
      const success = await SupabaseService.saveFinanceTransaction(baseTransaction, userId);
      if (success) {
        const account = accounts.find(a => a.id === baseTransaction.accountId);
        if (account) {
          let newBalance = Number(account.balance);
          const amountNum = Number(baseTransaction.amount);
          if (account.type === 'CREDIT') {
            if (baseTransaction.type === 'EXPENSE') newBalance += amountNum;
            else if (baseTransaction.type === 'INCOME') newBalance -= amountNum;
          } else {
            if (baseTransaction.type === 'INCOME') newBalance += amountNum;
            else if (baseTransaction.type === 'EXPENSE') newBalance -= amountNum;
          }
          await SupabaseService.saveFinanceAccount({ ...account, balance: newBalance }, userId);
        }
        onShowToast("Lançamento registrado!");
      }
    }
    
    setIsTransactionModalOpen(false);
    setNewTransaction({
      accountId: accounts[0]?.id || '', amount: undefined, date: new Date().toISOString().split('T')[0],
      category: '', subcategory: '', beneficiary: '', type: 'EXPENSE', status: 'COMPLETED',
      totalInstallments: 1, isRecurring: false
    });
    setCustomCategory('');
    setCustomSubcategory('');
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

  const handleDeleteGoal = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a caixinha "${name}"?`)) {
      const success = await SupabaseService.deleteFinanceGoal(id);
      if (success) {
        onShowToast("Caixinha excluída!");
        loadFinanceData();
      } else {
        onShowToast("Erro ao excluir caixinha.");
      }
    }
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

            {/* Insights Section (NEW) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#111029] rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Distribuição de Gastos</h3>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartDataDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartDataDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[ '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899' ][index % 6]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a1936', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(val: number) => formatCurrency(val)}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#111029] rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Evolução de Saldo</h3>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataCashFlow}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a1936', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#10b981" fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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
                {/* Search and Filters Bar */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text"
                      placeholder="Buscar por descrição ou beneficiário..."
                      className="w-full bg-[#111029] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {(searchTerm || filterPeriod !== 'THIS_MONTH' || filterAccount !== 'ALL' || filterCategory !== 'ALL') && (
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setFilterPeriod('THIS_MONTH');
                        setFilterAccount('ALL');
                        setFilterCategory('ALL');
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-semibold whitespace-nowrap"
                    >
                      <X size={16} /> Limpar
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${showFilters ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-[#111029] border-gray-800 text-gray-400 hover:text-white'}`}
                  >
                    <Filter size={18} />
                    <span className="text-sm font-semibold">Filtros</span>
                  </button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#111029] rounded-xl border border-gray-800 mb-6 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Período</label>
                      <select 
                        className="w-full bg-[#1a1936] border border-gray-700 rounded-lg p-2 text-white text-sm"
                        value={filterPeriod}
                        onChange={(e: any) => setFilterPeriod(e.target.value)}
                      >
                        <option value="THIS_MONTH">Este Mês</option>
                        <option value="LAST_3_MONTHS">Últimos 3 Meses</option>
                        <option value="ALL">Todo o Histórico</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Conta</label>
                      <select 
                        className="w-full bg-[#1a1936] border border-gray-700 rounded-lg p-2 text-white text-sm"
                        value={filterAccount}
                        onChange={(e) => setFilterAccount(e.target.value)}
                      >
                        <option value="ALL">Todas as Contas</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Categoria</label>
                      <select 
                        className="w-full bg-[#1a1936] border border-gray-700 rounded-lg p-2 text-white text-sm"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="ALL">Todas as Categorias</option>
                        {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(cat => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Recebido (Mês)</div>
                    <div className="text-xl font-black text-white">
                      {formatCurrency(transactions.filter(t => t.type === 'INCOME' && t.status === 'COMPLETED').reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                    </div>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Previsão de Recebimento (Pendente)</div>
                    <div className="text-xl font-black text-white">
                      {(() => {
                        const pendingFromTransactions = transactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').reduce((acc, curr) => acc + (curr.amount || 0), 0);
                        const pendingFromClasses = classes.filter(c => c.status === 'COMPLETED' && c.paymentStatus === 'PENDING' && !transactions.some(t => t.classId === c.id)).reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
                        return formatCurrency(pendingFromTransactions + pendingFromClasses);
                      })()}
                    </div>
                  </div>
                </div>
                {transactions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">Nenhum lançamento registrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                          <th className="pb-3 px-4 font-semibold">Data</th>
                          <th className="pb-3 px-4 font-semibold">Descrição / Beneficiário</th>
                          <th className="pb-3 px-4 font-semibold">Categoria</th>
                          <th className="pb-3 px-4 font-semibold">Conta</th>
                          <th className="pb-3 px-4 font-semibold text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedTransactions.map((item: any) => {
                          if (item.isGroup) {
                            const t = item.baseTransaction;
                            const isIncome = t.type === 'INCOME';
                            const amountColor = isIncome ? 'text-emerald-400' : 'text-red-400';
                            const prefixStr = isIncome ? '+ ' : '- ';
                            const isExpanded = expandedGroups[item.key];
                            
                            return (
                              <React.Fragment key={item.key}>
                                <tr onClick={() => setExpandedGroups({...expandedGroups, [item.key]: !isExpanded})} className="border-b border-gray-800/50 hover:bg-gray-800/40 bg-[#161530] transition-colors group cursor-pointer relative">
                                  <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className={`transition-transform duration-300 text-gray-500 scale-75 ${isExpanded ? 'rotate-90' : ''}`}><ArrowUpRight size={16} /></div>
                                      {new Date((t.date.includes('T') ? t.date.split('T')[0] : t.date.split(' ')[0]) + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        <ArrowRightLeft size={16} />
                                      </div>
                                      <div>
                                        <div className="text-white font-medium text-sm flex items-center gap-2">
                                          {item.items.length} Recebimentos Agrupados
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{isIncome ? 'De:' : 'Para:'} {t.beneficiary}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex flex-col gap-1.5">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 w-fit">
                                        <Tag size={12} /> {t.category}
                                      </span>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit ${
                                        t.subcategory.toLowerCase().includes('matemática') ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : t.subcategory.toLowerCase().includes('física') ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      }`}>
                                        {t.subcategory}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 text-gray-500 text-sm italic">
                                    Várias contas
                                  </td>
                                  <td className={`py-4 px-4 font-bold text-sm text-right ${amountColor} whitespace-nowrap`}>
                                    {prefixStr}{formatCurrency(item.totalAmount)}
                                  </td>
                                </tr>
                                {isExpanded && item.items.map((child: any) => {
                                  const childAcc = accounts.find(a => a.id === child.accountId);
                                  return (
                                    <tr key={child.id} className="border-b border-gray-800/20 bg-black/20 hover:bg-gray-800/30 transition-colors">
                                      <td className="py-3 px-4 pl-8 text-gray-500 text-xs whitespace-nowrap flex items-center gap-2"><div className="w-4 border-b border-l h-4 rounded-bl border-gray-700 -mt-2"></div> {new Date((child.date.includes('T') ? child.date.split('T')[0] : child.date.split(' ')[0]) + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                      <td className="py-3 px-4 text-gray-400 text-xs">
                                        <div className="flex items-center gap-2">
                                          {child.description}
                                          {child.status === 'PENDING' && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase rounded border border-amber-500/20">A Receber</span>}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-gray-500 text-xs">-</td>
                                      <td className="py-3 px-4 text-gray-500 text-xs text-left">
                                        <div className="flex items-center gap-2">
                                          {childAcc ? getAccountIcon(childAcc) : <Wallet size={12}/>}
                                          <span className="truncate max-w-[80px] md:max-w-none block">{childAcc?.name || 'Caixinha'}</span>
                                        </div>
                                      </td>
                                      <td className={`py-3 px-4 font-bold text-xs text-right ${amountColor} whitespace-nowrap opacity-80`}>
                                        {prefixStr}{formatCurrency(child.amount)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          }

                          const t = item;
                          const acc = accounts.find(a => a.id === t.accountId);
                          const isIncome = t.type === 'INCOME';
                          
                          const amountColor = isIncome ? 'text-emerald-400' : t.type === 'TRANSFER' ? 'text-blue-400' : 'text-red-400';
                          const prefixStr = isIncome ? '+ ' : t.type === 'EXPENSE' ? '- ' : '';

                          return (
                            <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group">
                              <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{new Date((t.date.includes('T') ? t.date.split('T')[0] : t.date.split(' ')[0]) + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : t.type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {isIncome ? <ArrowUpRight size={16} /> : t.type === 'TRANSFER' ? <ArrowRightLeft size={16} /> : <ArrowDownRight size={16} />}
                                  </div>
                                  <div>
                                    <div className="text-white font-medium text-sm flex items-center gap-2 flex-wrap">
                                      {t.description}
                                      {t.status === 'PENDING' && (
                                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase rounded border border-amber-500/20 whitespace-nowrap">A Receber</span>
                                      )}
                                      {t.isRecurring && (
                                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase rounded border border-blue-500/20 whitespace-nowrap flex items-center gap-1"><RefreshCw size={8} /> Fixo</span>
                                      )}
                                      {t.totalInstallments && t.totalInstallments > 1 && (
                                        <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-black uppercase rounded border border-purple-500/20 whitespace-nowrap">Parc. {t.installmentNumber}/{t.totalInstallments}</span>
                                      )}
                                    </div>
                                    {t.beneficiary && <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{isIncome ? 'De:' : 'Para:'} {t.beneficiary}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                  <div className="flex flex-col gap-1.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 w-fit">
                                      <Tag size={12} /> {t.category}
                                    </span>
                                    {t.subcategory && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit ${
                                        t.subcategory.toLowerCase().includes('matemática') 
                                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                                          : t.subcategory.toLowerCase().includes('física')
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      }`}>
                                        {t.subcategory}
                                      </span>
                                    )}
                                  </div>
                              </td>
                              <td className="py-4 px-4 text-gray-400 text-sm">
                                <div className="flex items-center gap-2">
                                  {acc ? getAccountIcon(acc) : <Wallet size={16}/>}
                                  <span className="truncate max-w-[80px] md:max-w-none block">{acc?.name || 'Caixinha'}</span>
                                </div>
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
                            <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 uppercase tracking-wider font-semibold">Mensal/Inicial</span>
                                <span className="text-gray-400 font-bold">{formatCurrency(acc.initialBalance)}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                <div className="text-xs text-emerald-500 uppercase tracking-wider font-black mb-1">Saldo Atual</div>
                                <div className="text-2xl font-black text-white">{formatCurrency(acc.balance)}</div>
                              </div>
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
                                 <div className="flex items-center gap-2">
                                   {isComplete && <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Target size={12}/> Meta Atingida!</div>}
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id, goal.name); }}
                                     className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                     title="Excluir Caixinha"
                                   >
                                     <Trash2 size={16} />
                                   </button>
                                 </div>
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
              <button onClick={() => { setIsAccountModalOpen(false); setEditingAccountId(null); setNewAccount({ name: '', type: 'CHECKING', balance: 0, initialBalance: 0, creditLimit: 0, dueDate: 1, closingDate: 1, logoUrl: '', status: 'ACTIVE' }); }} className="text-gray-400 hover:text-white"><Plus className="rotate-45" size={24} /></button>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Saldo Inicial</label>
                      <input required type="number" step="0.01" value={newAccount.initialBalance || ''} onChange={e => {
                        const val = Number(e.target.value);
                        // Se for nova conta, o saldo atual acompanha o inicial
                        if (!editingAccountId) {
                          setNewAccount({...newAccount, initialBalance: val, balance: val});
                        } else {
                          setNewAccount({...newAccount, initialBalance: val});
                        }
                      }} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Saldo Atual</label>
                      <input required type="number" step="0.01" value={newAccount.balance || ''} onChange={e => setNewAccount({...newAccount, balance: Number(e.target.value)})} className="w-full bg-gray-900/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-bold" placeholder="0.00" />
                    </div>
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
                  <div className="flex gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${newTransaction.type === 'INCOME' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}>
                      <input type="radio" className="hidden" name="type" checked={newTransaction.type === 'INCOME'} onChange={() => setNewTransaction({...newTransaction, type: 'INCOME'})} />
                      <ArrowUpRight size={16} /> Receita
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${newTransaction.type === 'EXPENSE' ? 'border-red-500 bg-red-500/10 text-red-400 font-bold' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}>
                      <input type="radio" className="hidden" name="type" checked={newTransaction.type === 'EXPENSE'} onChange={() => setNewTransaction({...newTransaction, type: 'EXPENSE'})} />
                      <ArrowDownRight size={16} /> Despesa
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${newTransaction.type === 'TRANSFER' ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}>
                      <input type="radio" className="hidden" name="type" checked={newTransaction.type === 'TRANSFER'} onChange={() => setNewTransaction({...newTransaction, type: 'TRANSFER', category: 'Transferência', subcategory: 'Transferência entre Contas'})} />
                      <ArrowRightLeft size={16} /> Transf.
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descrição</label>
                    <input type="text" value={newTransaction.description || ''} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Ex: Aluguel, Supermercado..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Valor Total</label>
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
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{newTransaction.type === 'INCOME' ? 'Recebido de' : 'Pagamento para (Beneficiário)'}</label>
                    <input type="text" value={newTransaction.beneficiary || ''} onChange={e => setNewTransaction({...newTransaction, beneficiary: e.target.value})} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Ex: Mercado, Cliente X..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categoria</label>
                        <select required value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value, subcategory: ''})} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 appearance-none">
                          <option value="">Selecionar...</option>
                          {(newTransaction.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                          ))}
                          <option value="CUSTOM">+ Outra (Personalizada)</option>
                        </select>
                        {newTransaction.category === 'CUSTOM' && (
                          <input required type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="w-full mt-2 bg-gray-900/50 border border-emerald-500/50 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="Digite a nova categoria..." />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subcategoria</label>
                        <select value={newTransaction.subcategory} onChange={e => setNewTransaction({...newTransaction, subcategory: e.target.value})} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 appearance-none disabled:opacity-50" disabled={!newTransaction.category}>
                          <option value="">Padrão / Outros</option>
                          {newTransaction.category !== 'CUSTOM' && (newTransaction.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
                            .find(c => c.name === newTransaction.category)?.subcategories.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                          <option value="CUSTOM">+ Outra (Personalizada)</option>
                        </select>
                        {newTransaction.subcategory === 'CUSTOM' && (
                          <input required type="text" value={customSubcategory} onChange={e => setCustomSubcategory(e.target.value)} className="w-full mt-2 bg-gray-900/50 border border-emerald-500/50 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="Digite a subcategoria..." />
                        )}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {newTransaction.type === 'TRANSFER' ? 'Conta de Origem' : 'Conta / Carteira'}
                      </label>
                      <select required value={newTransaction.accountId} onChange={e => setNewTransaction({...newTransaction, accountId: e.target.value})} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 appearance-none">
                        <option value="">Selecionar...</option>
                        {accounts.filter(a => a.status !== 'INACTIVE').map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                        ))}
                      </select>
                    </div>

                    {newTransaction.type === 'TRANSFER' && (
                      <div>
                        <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Conta de Destino</label>
                        <select required value={(newTransaction as any).destinationAccountId} onChange={e => setNewTransaction({...newTransaction, destinationAccountId: e.target.value} as any)} className="w-full px-4 py-3 bg-gray-900/50 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-500 appearance-none">
                          <option value="">Selecionar...</option>
                          {accounts.filter(a => a.status !== 'INACTIVE' && a.id !== newTransaction.accountId).map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {newTransaction.type === 'EXPENSE' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Parcelas</label>
                        <select value={newTransaction.totalInstallments || 1} onChange={e => setNewTransaction({...newTransaction, totalInstallments: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 appearance-none">
                          {[1,2,3,4,5,6,7,8,9,10,12,15,18,24,36,48].map(n => (
                            <option key={n} value={n}>{n === 1 ? 'À vista' : `${n} parcelas`}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-[#111029] rounded-xl border border-gray-800">
                    <input 
                      type="checkbox" 
                      id="isRecurring" 
                      className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                      checked={newTransaction.isRecurring}
                      onChange={e => setNewTransaction({...newTransaction, isRecurring: e.target.checked})}
                    />
                    <label htmlFor="isRecurring" className="text-sm font-semibold text-gray-300 cursor-pointer">Lançamento Fixo / Recorrente (Mensal)</label>
                  </div>

                  <div className="pt-4 flex gap-3 border-t border-gray-800">
                    <button type="button" onClick={() => setIsTransactionModalOpen(false)} className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors">Confirmar Lançamento</button>
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
