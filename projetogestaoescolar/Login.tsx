import React, { useState } from 'react';
import { UserRole } from './types';
import { SupabaseService } from './services/supabaseService';
import { supabase } from './supabaseClient';
import { User, Lock, ArrowRight, Eye, EyeOff, Zap, TrendingUp, Rocket, Mail, ChevronLeft, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';

interface LoginProps {
    onLogin: (role: UserRole, email: string, name?: string, photoUrl?: string, id?: string) => void;
}

type LoginView = 'LOGIN' | 'FORGOT_PASSWORD' | 'SUCCESS_SENT';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [view, setView] = useState<LoginView>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // Load institutional logo
    React.useEffect(() => {
        const loadLogo = async () => {
            const cachedLogo = localStorage.getItem('educontrol_school_logo');
            if (cachedLogo) setLogoUrl(cachedLogo);

            const dbLogo = await SupabaseService.getSetting('school_logo');
            if (dbLogo && dbLogo !== cachedLogo) {
                setLogoUrl(dbLogo);
                localStorage.setItem('educontrol_school_logo', dbLogo);
            }
        };
        loadLogo();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userInput = email.trim().toLowerCase();
            const isEmail = userInput.includes('@');

            // ── Fluxo do Aluno (Novo ou Game): senha 2026 ──
            if (password === '2026') {
                const { data: students } = await supabase
                    .from('students')
                    .select('id, name');

                const normalize = (s: string) =>
                    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '');

                const identifier = isEmail ? userInput.split('@')[0] : userInput;
                let found: { id: string, name: string } | null = null;

                for (const student of (students || [])) {
                    const parts = student.name.trim().split(/\s+/);
                    if (parts.length < 2) continue;
                    
                    const firstSecond = normalize(parts[0]) + normalize(parts[1]);
                    
                    if (firstSecond === identifier) { 
                        found = { id: student.id, name: student.name }; 
                        break; 
                    }
                }

                if (found) {
                    onLogin(UserRole.STUDENT, found.id, found.name, undefined, found.id);
                    return;
                }
            }

            // ── Fluxo padrão (professores, coordenadores, etc.) ──
            const result = await SupabaseService.loginUser(email, password);

            if (result.success && result.role && result.email) {
                onLogin(result.role, result.email, result.name, result.photoUrl, (result as any).id);
            } else {
                // Fallback para as credenciais padrão se o login falhar
                if (email === 'coordenador@gmail.com' && password === '2026') {
                    onLogin(UserRole.COORDINATOR, email);
                } else if ((email === 'prof@edu.com' || email === 'mon@edu.com') && password === '2026') {
                    onLogin(email === 'prof@edu.com' ? UserRole.TEACHER : UserRole.MONITOR, email);
                } else {
                    setError('Credenciais inválidas ou usuário não encontrado.');
                }
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const success = await SupabaseService.resetPasswordForEmail(email);
            if (success) {
                setView('SUCCESS_SENT');
            } else {
                setError('Falha ao enviar e-mail de recuperação.');
            }
        } catch (err) {
            setError('Digite um e-mail válido cadastrado no sistema.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-6xl bg-[#1a2332] rounded-3xl shadow-2xl overflow-hidden border border-gray-800/50 grid md:grid-cols-2">
                {/* Left Side - Form Area */}
                <div className="p-8 md:p-12 flex flex-col justify-center min-h-[600px]">

                    {view === 'LOGIN' && (
                        <>
                            {/* Logo and Header */}
                            <div className="mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 bg-white/5 p-2 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
                                        <img src={logoUrl || "/coc-logo.png"} alt="School Logo" className="w-full h-full object-contain scale-110" />
                                    </div>
                                    <div>
                                        <h1 className="text-24 font-bold text-white tracking-tight uppercase">
                                            JF <span className="text-emerald-500">EduControl</span>
                                        </h1>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">EduControl - Aulas Particulares</p>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo</h2>
                                <p className="text-sm text-gray-400">Acesse o sistema com suas credenciais para continuar.</p>
                            </div>

                            {/* Login Form */}
                            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-700 delay-200">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">
                                        Usuário / E-mail
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-[#0f1621] border border-gray-700/50 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                            placeholder="Usuário ou E-mail"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-[#0f1621] border border-gray-700/50 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                            placeholder="••••••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-600 bg-[#0f1621] text-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                        <span className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors">Lembrar acesso</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setView('FORGOT_PASSWORD')}
                                        className="text-xs text-emerald-500 hover:text-emerald-400 font-bold transition-colors"
                                    >
                                        Esqueci a senha
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <LoadingSpinner size="sm" text="Autenticando..." />
                                    ) : (
                                        <>
                                            ENTRAR NO SISTEMA
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {view === 'FORGOT_PASSWORD' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <button
                                onClick={() => setView('LOGIN')}
                                className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-bold mb-8 transition-colors"
                            >
                                <ChevronLeft size={16} />
                                VOLTAR PARA O LOGIN
                            </button>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Recuperar Senha</h2>
                                <p className="text-sm text-gray-400">Insira seu e-mail cadastrado para receber instruções de redefinição.</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Seu E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-[#0f1621] border border-gray-700/50 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:border-emerald-500 outline-none"
                                            placeholder="exemplo@email.com"
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
                                    {loading ? 'ENVIANDO...' : 'ENVIAR LINK DE RECUPERAÇÃO'}
                                </button>
                            </form>
                        </div>
                    )}

                    {view === 'SUCCESS_SENT' && (
                        <div className="text-center animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle className="text-emerald-500" size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Email Enviado!</h2>
                            <p className="text-gray-400 text-sm mb-8 leading-relaxed px-4">
                                Enviamos um link de redefinição para <span className="text-white font-medium">{email}</span>.
                                Verifique sua caixa de entrada e spam.
                            </p>
                            <button
                                onClick={() => setView('LOGIN')}
                                className="w-full max-w-[200px] border border-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                VOLTAR AO LOGIN
                            </button>
                        </div>
                    )}

                    {/* Support Link */}
                    <div className="mt-8 text-center pt-8 border-t border-gray-800/30">
                        <p className="text-xs text-gray-500">
                            Suporte técnico: <a href="#" className="text-emerald-500 hover:underline">educontrol.online</a>
                        </p>
                    </div>
                </div>

                {/* Right Side - Branding */}
                <div className="hidden md:flex bg-gradient-to-br from-[#0f1e2e] via-[#1a2f3f] to-[#0f1e2e] p-12 flex-col items-center justify-center relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>

                    {/* Geometric Shapes */}
                    <div className="absolute top-20 right-20 w-20 h-20 border-2 border-emerald-500/20 rounded-2xl rotate-12 animate-pulse"></div>
                    <div className="absolute bottom-32 right-32 w-16 h-16 border-2 border-blue-500/20 rounded-full"></div>

                    {/* Main Content */}
                    <div className="relative z-10 text-center">
                        {/* COC Logo - Substituindo o círculo com "C" */}
                        <div className="w-64 h-64 bg-white/5 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto shadow-2xl border border-white/10 p-8 group transition-all duration-500 hover:scale-105">
                            <div className="w-full h-full relative">
                                <img src={logoUrl || "/coc-logo.png"} alt="Branding" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all scale-110" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-6xl font-black text-white mb-2 tracking-tight">
                            JF
                        </h1>
                        <h2 className="text-6xl font-black text-emerald-500 mb-6 drop-shadow-lg">
                            EduControl
                        </h2>

                        {/* Decorative Line */}
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <div className="h-1 w-16 bg-emerald-500 rounded-full"></div>
                            <div className="h-0.5 w-6 bg-blue-500/50 rounded-full"></div>
                            <div className="h-1 w-16 bg-emerald-500 rounded-full"></div>
                        </div>

                        {/* Subtitle */}
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-12">
                            EDUCONTROL ECOSYSTEM
                        </p>

                        {/* Feature Icons */}
                        <div className="flex items-center justify-center gap-6">
                            <div className="w-14 h-14 bg-[#1a2332] rounded-xl flex items-center justify-center border border-gray-700/50 hover:border-emerald-500/50 transition-all group shadow-lg">
                                <Zap className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <div className="w-14 h-14 bg-[#1a2332] rounded-xl flex items-center justify-center border border-gray-700/50 hover:border-emerald-500/50 transition-all group shadow-lg">
                                <TrendingUp className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <div className="w-14 h-14 bg-[#1a2332] rounded-xl flex items-center justify-center border border-gray-700/50 hover:border-emerald-500/50 transition-all group shadow-lg">
                                <Rocket className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
                        <div className="w-8 h-1 bg-emerald-500 rounded-full"></div>
                        <div className="w-2 h-1 bg-gray-700 rounded-full"></div>
                        <div className="w-2 h-1 bg-gray-700 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};