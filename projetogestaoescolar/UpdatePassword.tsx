import React, { useState } from 'react';
import { SupabaseService } from './services/supabaseService';
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';

interface UpdatePasswordProps {
    onComplete: () => void;
}

export const UpdatePassword: React.FC<UpdatePasswordProps> = ({ onComplete }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const result = await SupabaseService.updateUserPassword(password);
            if (result) {
                setSuccess(true);
            } else {
                setError('Erro ao atualizar a senha. Tente novamente.');
            }
        } catch (err) {
            setError('Sessão expirada ou link inválido. Solicite uma nova recuperação.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#1a2332] rounded-3xl p-8 border border-gray-800 text-center shadow-2xl animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <CheckCircle className="text-emerald-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Senha Atualizada!</h2>
                    <p className="text-gray-400 text-sm mb-8">
                        Sua senha foi alterada com sucesso. Você já pode acessar o sistema.
                    </p>
                    <button
                        onClick={onComplete}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        IR PARA O LOGIN
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1a2332] rounded-3xl p-8 border border-gray-800 shadow-2xl">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <img src="/coc-logo.png" alt="COC" className="w-10 h-10 object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Nova Senha</h2>
                    <p className="text-sm text-gray-400">Escolha uma senha segura para o seu acesso.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nova Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0f1621] border border-gray-700/50 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-600 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Mínimo 6 caracteres"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Confirmar Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#0f1621] border border-gray-700/50 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-600 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Repita a nova senha"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? <LoadingSpinner size="sm" text="ATUALIZANDO..." /> : 'DEFINIR NOVA SENHA'}
                    </button>
                </form>
            </div>
        </div>
    );
};
