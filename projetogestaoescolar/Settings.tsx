import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from './services/storageService';
import { SupabaseService } from './services/supabaseService';
import { Lock, Save, ImageIcon, Upload, Trash2, DollarSign, Edit2 } from 'lucide-react';
import { UserRole, BankAccount } from './types';

interface SettingsProps {
    userEmail: string;
    userRole: UserRole;
    onShowToast: (msg: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ userEmail, userRole, onShowToast }) => {
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const [logoUrl, setLogoUrl] = useState('');
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountImage, setNewAccountImage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bankFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadLogo();
        loadBankAccounts();
    }, []);

    const loadLogo = async () => {
        // Check local first for speed
        const cachedLogo = localStorage.getItem('educontrol_school_logo');
        if (cachedLogo) setLogoUrl(cachedLogo);

        // Sync with Supabase
        const dbLogo = await SupabaseService.getSetting('school_logo');
        if (dbLogo && dbLogo !== cachedLogo) {
            setLogoUrl(dbLogo);
            localStorage.setItem('educontrol_school_logo', dbLogo);
        }
    };

    const loadBankAccounts = async () => {
        try {
            const data = await SupabaseService.getBankAccounts();
            setBankAccounts(data);
        } catch (error) {
            console.error('Error loading bank accounts:', error);
        }
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPass !== confirmPass) {
            onShowToast("As novas senhas não coincidem!");
            return;
        }

        if (newPass.length < 3) {
            onShowToast("A senha deve ter pelo menos 3 caracteres.");
            return;
        }

        const isValid = StorageService.validateLogin(userEmail, currentPass);
        if (!isValid) {
            onShowToast("Senha atual incorreta.");
            return;
        }

        const success = StorageService.changePassword(userEmail, newPass);
        if (success) {
            onShowToast("Senha alterada com sucesso!");
            setCurrentPass('');
            setNewPass('');
            setConfirmPass('');
        } else {
            onShowToast("Erro ao alterar senha.");
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoUrl(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveLogo = async () => {
        localStorage.setItem('educontrol_school_logo', logoUrl);
        const success = await SupabaseService.updateSetting('school_logo', logoUrl);
        if (success) {
            onShowToast("Logomarca escolar salva globalmente!");
        } else {
            onShowToast("Logomarca salva localmente (erro ao sincronizar).");
        }
    };

    const handleRemoveLogo = async () => {
        localStorage.removeItem('educontrol_school_logo');
        await SupabaseService.updateSetting('school_logo', '');
        setLogoUrl('');
        onShowToast("Logomarca removida globalmente.");
    };

    const handleAddBankAccount = async () => {
        if (!newAccountName) {
            onShowToast("Informe o nome da conta.");
            return;
        }
        const success = await SupabaseService.saveBankAccount({
            id: editingAccount?.id,
            name: newAccountName,
            imageUrl: newAccountImage
        });
        if (success) {
            onShowToast(editingAccount ? "Conta atualizada!" : "Conta cadastrada com sucesso!");
            setNewAccountName('');
            setNewAccountImage('');
            setEditingAccount(null);
            loadBankAccounts();
        } else {
            onShowToast("Erro ao salvar conta.");
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm("Excluir esta conta?")) return;
        const success = await SupabaseService.deleteBankAccount(id);
        if (success) {
            onShowToast("Conta removida.");
            if (editingAccount?.id === id) {
                setEditingAccount(null);
                setNewAccountName('');
                setNewAccountImage('');
            }
            loadBankAccounts();
        }
    };

    const handleBankImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const publicUrl = await SupabaseService.uploadPhoto(file, 'banks');
            if (publicUrl) {
                setNewAccountImage(publicUrl);
                onShowToast("Logomarca do banco carregada.");
            } else {
                onShowToast("Erro ao carregar imagem do banco.");
            }
        }
    };

    const startEditAccount = (account: BankAccount) => {
        setEditingAccount(account);
        setNewAccountName(account.name);
        setNewAccountImage(account.imageUrl || '');
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Change Password Block */}
            <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-8 shadow-lg h-fit">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Alterar Senha</h2>
                        <p className="text-xs text-gray-400">Mantenha sua conta segura</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Senha Atual</label>
                        <input
                            type="password"
                            value={currentPass}
                            onChange={e => setCurrentPass(e.target.value)}
                            className="w-full bg-[#1e293b] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="border-t border-gray-800 pt-2"></div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nova Senha</label>
                        <input
                            type="password"
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            className="w-full bg-[#1e293b] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            className="w-full bg-[#1e293b] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-[#0f172a] font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <Save size={18} />
                        Atualizar Senha
                    </button>
                </form>
            </div>

            {/* Application Settings (Coordinator Only) */}
            {userRole === UserRole.COORDINATOR && (
                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-8 shadow-lg h-fit">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Logomarca da Instituição</h2>
                            <p className="text-xs text-gray-400">Visível no cabeçalho dos Relatórios e FOA</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center w-full">
                            {logoUrl ? (
                                <div className="relative group w-full flex flex-col items-center gap-4">
                                    <div className="w-full max-w-[200px] bg-white rounded-lg p-4 border border-gray-700 flex justify-center shadow-inner">
                                        <img src={logoUrl} alt="Logo Preview" className="max-h-24 object-contain" />
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <button
                                            onClick={handleRemoveLogo}
                                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition-colors border border-red-500/30"
                                        >
                                            <Trash2 size={16} /> Remover
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 bg-[#1e293b] hover:bg-gray-700 text-white font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition-colors border border-gray-600"
                                        >
                                            Altetar Imagem
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-32 border-2 border-dashed border-gray-700 hover:border-blue-500 bg-[#1e293b]/50 hover:bg-[#1e293b] rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-400 transition-all cursor-pointer"
                                >
                                    <Upload size={28} />
                                    <span className="text-sm font-bold">Clique para carregar a Logomarca</span>
                                    <span className="text-xs font-normal opacity-70">(Recomendado fundo transparente - PNG)</span>
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLogoUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        {logoUrl && (
                            <button
                                onClick={handleSaveLogo}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Save size={18} />
                                Salvar Configuração
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Bank Accounts Section (Coordinator and Teacher) */}
            {(userRole === UserRole.COORDINATOR || userRole === UserRole.TEACHER) && (
                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-8 shadow-lg col-span-1 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Gestão de Contas Bancárias</h2>
                            <p className="text-xs text-gray-400">Contas disponíveis para recebimento de aulas</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Add Account Form */}
                        <div className="space-y-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">
                                {editingAccount ? 'Editar Conta' : 'Nova Conta'}
                            </h3>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Nome da Conta / Banco</label>
                                <input
                                    type="text"
                                    value={newAccountName}
                                    onChange={e => setNewAccountName(e.target.value)}
                                    className="w-full bg-[#1e293b] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 text-sm"
                                    placeholder="Ex: Banco Itaú, Pix CNPJ, etc"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Imagem / Logo do Banco</label>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => bankFileInputRef.current?.click()}
                                        className="w-16 h-16 bg-white/5 border border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all overflow-hidden"
                                    >
                                        {newAccountImage ? (
                                            <img src={newAccountImage} className="w-full h-full object-contain" alt="" />
                                        ) : (
                                            <Upload size={20} />
                                        )}
                                    </button>
                                    <p className="text-[10px] text-gray-500 font-medium leading-tight">Sugestão: Use logos <br/>quadradas (1:1)</p>
                                </div>
                                <input type="file" ref={bankFileInputRef} onChange={handleBankImageUpload} className="hidden" accept="image/*" />
                            </div>
                            <div className="flex gap-2">
                                {editingAccount && (
                                    <button
                                        onClick={() => {
                                            setEditingAccount(null);
                                            setNewAccountName('');
                                            setNewAccountImage('');
                                        }}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    onClick={handleAddBankAccount}
                                    className={`flex-[2] ${editingAccount ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'} text-[#0f172a] font-bold py-3 rounded-xl transition-all shadow-lg`}
                                >
                                    {editingAccount ? 'Salvar Alterações' : 'Adicionar Conta'}
                                </button>
                            </div>
                        </div>

                        {/* List Accounts */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Contas Ativas</h3>
                            <div className="space-y-2">
                                {bankAccounts.map(account => (
                                    <div key={account.id} className="flex items-center justify-between p-4 bg-[#1e293b]/50 border border-gray-800 rounded-xl group hover:border-emerald-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/5">
                                                {account.imageUrl ? (
                                                    <img src={account.imageUrl} className="w-full h-full object-contain" alt="" />
                                                ) : (
                                                    <DollarSign size={16} className="text-gray-500" />
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-white uppercase tracking-tight">{account.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => startEditAccount(account)}
                                                className="p-2 text-gray-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteAccount(account.id)}
                                                className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {bankAccounts.length === 0 && (
                                    <div className="text-center py-10 opacity-20">
                                        <div className="w-12 h-12 border-2 border-dashed border-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <DollarSign size={20} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma conta cadastrada</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};