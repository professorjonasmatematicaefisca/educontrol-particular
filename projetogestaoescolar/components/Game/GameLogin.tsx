import React, { useState } from 'react';
import { Gamepad2, Lock, Mail, LogIn } from 'lucide-react';

interface GameLoginProps {
    sessionId: string;
    onLogin: (email: string) => void;
    error?: string;
    loading?: boolean;
}

export const GameLogin: React.FC<GameLoginProps> = ({ sessionId, onLogin, error, loading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        const emailLower = email.trim().toLowerCase();
        if (!emailLower.endsWith('@cocpaulinia.com.br')) {
            setLocalError('Use seu email escolar: primeironome+sobrenome@cocpaulinia.com.br');
            return;
        }
        const localPart = emailLower.split('@')[0];
        if (!/^[a-záàãâéêíóôõúüç]+$/.test(localPart)) {
            setLocalError('Formato inválido. Ex: joaogomes@cocpaulinia.com.br');
            return;
        }
        if (password !== '123') {
            setLocalError('Senha incorreta. Tente novamente.');
            return;
        }

        onLogin(emailLower);
    };

    const displayError = error || localError;

    return (
        <div className="min-h-screen flex items-center justify-center"
            style={{ background: 'radial-gradient(ellipse at top, #0d2e14 0%, #0a1a0d 60%, #050d06 100%)' }}>
            {/* Blobs decorativos */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#8bc34a]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#2e7d32]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Cabeçalho */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2e7d32] to-[#8bc34a] shadow-[0_0_40px_rgba(139,195,74,0.3)] mb-4">
                        <Gamepad2 size={36} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">WetWit Quest</h1>
                    <p className="text-[#8bc34a] font-bold tracking-widest text-sm mt-1 uppercase">COC Paulínia • Competição ao Vivo</p>
                </div>

                {/* Card */}
                <div className="bg-black/40 backdrop-blur-xl border border-[#8bc34a]/20 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-1 text-center">Entrar na Competição</h2>
                    <p className="text-gray-500 text-xs text-center mb-6">Use seu email escolar e a senha do jogo</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-[#8bc34a] mb-2">
                                <Mail size={12} className="inline mr-1" />
                                Email Escolar
                            </label>
                            <input
                                type="text"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="joaogomes@cocpaulinia.com.br"
                                autoComplete="off"
                                className="w-full bg-black/60 border border-[#8bc34a]/30 text-white rounded-xl px-4 py-3 outline-none focus:border-[#8bc34a] focus:ring-1 focus:ring-[#8bc34a]/50 placeholder:text-gray-600 transition font-mono text-sm"
                                required
                            />
                            <p className="text-gray-600 text-xs mt-1.5">Formato: <span className="text-gray-500 font-mono">primeiro+segundo nome @cocpaulinia.com.br</span></p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#8bc34a] mb-2">
                                <Lock size={12} className="inline mr-1" />
                                Senha do Jogo
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••"
                                className="w-full bg-black/60 border border-[#8bc34a]/30 text-white rounded-xl px-4 py-3 outline-none focus:border-[#8bc34a] focus:ring-1 focus:ring-[#8bc34a]/50 placeholder:text-gray-600 transition"
                                required
                            />
                        </div>

                        {displayError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
                                {displayError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2e7d32] to-[#8bc34a] text-white font-black text-lg py-4 rounded-xl shadow-[0_4px_20px_rgba(139,195,74,0.3)] hover:brightness-110 transition disabled:opacity-50"
                        >
                            <LogIn size={20} />
                            {loading ? 'Verificando...' : 'Entrar na Competição'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
