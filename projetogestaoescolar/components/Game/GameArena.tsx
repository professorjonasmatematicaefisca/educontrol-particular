import React, { useState, useEffect } from 'react';
import { UserRole } from '../../types';
import { TeacherControlPanel } from './TeacherControlPanel';
import { StudentPlayView } from './StudentPlayView';
import { supabase } from '../../supabaseClient';
import { Link as ExternalLink } from 'lucide-react';

interface GameArenaProps {
    userRole: UserRole;
    userName: string;
    onShowToast: (msg: string) => void;
}

const SESSION_STORAGE_KEY = 'wetwiquest_session_id';

export const GameArena: React.FC<GameArenaProps> = ({ userRole, userName, onShowToast }) => {
    const isTeacherOrCoordinator = userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR;
    const isGameStudent = userRole === UserRole.GAME_STUDENT;

    const [sessionId, setSessionId] = useState<string | null>(() =>
        localStorage.getItem(SESSION_STORAGE_KEY)
    );

    // Verifica se a sessão salva ainda é válida (não 'finished' ou inexistente)
    useEffect(() => {
        if (!sessionId) return;
        supabase
            .from('game_sessions')
            .select('id, status')
            .eq('id', sessionId)
            .single()
            .then(({ data, error }) => {
                if (error || !data || data.status === 'finished') {
                    localStorage.removeItem(SESSION_STORAGE_KEY);
                    setSessionId(null);
                }
            });
    }, []);

    const handleCreateSession = async () => {
        const { data, error } = await supabase
            .from('game_sessions')
            .insert({ teacher_name: userName, status: 'active', current_question_index: -1 })
            .select()
            .single();
        if (error || !data) {
            onShowToast('Erro ao criar sessão. Tente novamente.');
            return;
        }
        localStorage.setItem(SESSION_STORAGE_KEY, data.id);
        setSessionId(data.id);
        onShowToast('Sessão criada! Alunos entram com email @cocpaulinia.com.br + senha 123.');
    };

    // ---- Professores / Coordenadores ----
    if (isTeacherOrCoordinator) {
        return (
            <div className="min-h-full">
                {sessionId && (
                    <div className="mb-4 bg-[#8bc34a]/10 border border-[#8bc34a]/20 rounded-xl px-5 py-3 flex items-center gap-3 flex-wrap">
                        <ExternalLink size={16} className="text-[#8bc34a] shrink-0" />
                        <p className="text-sm text-gray-300 flex-1">
                            Alunos entram com <span className="font-mono text-[#8bc34a]">joaogomes@cocpaulinia.com.br</span> + senha <b>123</b> e acessam a aba <span className="text-[#8bc34a] font-bold">Game</span>.
                        </p>
                    </div>
                )}
                <TeacherControlPanel
                    teacherName={userName}
                    sessionId={sessionId}
                    onCreateSession={handleCreateSession}
                />
            </div>
        );
    }

    // ---- Alunos do Game e outros roles ----
    return <ActiveStudentGame preAuthName={isGameStudent ? userName : undefined} />;
};

interface SessionInfo {
    id: string;
    teacher_name: string;
    status: string;
    current_question_index: number;
    created_at: string;
}

// Componente auxiliar: busca a sessão ativa para alunos
const ActiveStudentGame: React.FC<{ preAuthName?: string }> = ({ preAuthName }) => {
    // Se já tinha uma sessão selecionada e válida no storage
    const getSavedSessionId = () => {
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith('game_student_name_')) {
                return key.replace('game_student_name_', '');
            }
        }
        return null;
    };

    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(getSavedSessionId());
    const [availableSessions, setAvailableSessions] = useState<SessionInfo[]>([]);
    const [searching, setSearching] = useState(true);

    const fetchSessions = async (showLoading = true) => {
        if (showLoading) setSearching(true);
        // Calcula o timestamp de 12 horas atrás
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

        const { data } = await supabase
            .from('game_sessions')
            .select('id, teacher_name, status, current_question_index, created_at')
            .in('status', ['active'])
            .gte('created_at', twelveHoursAgo)
            .order('created_at', { ascending: false });

        // Filtra para manter apenas a sessão mais recente de cada professor
        const latestSessions: SessionInfo[] = [];
        const seenTeachers = new Set<string>();
        
        for (const sess of (data || [])) {
            if (!seenTeachers.has(sess.teacher_name)) {
                latestSessions.push(sess);
                seenTeachers.add(sess.teacher_name);
            }
        }

        setAvailableSessions(latestSessions);

        // Se temos um ID salvo, mas que não está mais aberto ou disponível
        if (selectedSessionId && data) {
            const stillExists = data.find(s => s.id === selectedSessionId) || true;
        }

        if (showLoading) setSearching(false);
    };

    useEffect(() => {
        if (selectedSessionId) {
            setSearching(false);
            return;
        }

        fetchSessions(true);

        const interval = setInterval(() => {
            fetchSessions(false);
        }, 3000);

        // Mantém a inscrição do realtime como auxiliar primário
        const channel = supabase
            .channel('public:game_sessions_lobby')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'game_sessions' },
                () => {
                    fetchSessions(false);
                }
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [selectedSessionId]);

    // Se tem uma sessão escolhida (seja auto restaurada ou clicada), vai pra view do jogo
    if (selectedSessionId) {
        return <StudentPlayView sessionId={selectedSessionId} preAuthName={preAuthName} onLeave={() => {
            setSelectedSessionId(null);
            fetchSessions();
        }} />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] py-10 gap-6 w-full max-w-2xl mx-auto px-4">
            <div className="text-center">
                <div className="text-6xl mb-4 text-[#8bc34a]">🎮</div>
                <h2 className="text-3xl font-black text-white mb-2">Desafios Disponíveis</h2>
                <p className="text-gray-400">Escolha a sala do seu professor para solicitar acesso.</p>
            </div>

            {searching ? (
                <div className="flex flex-col items-center py-10 gap-4">
                    <div className="w-10 h-10 border-4 border-[#8bc34a]/30 border-t-[#8bc34a] rounded-full animate-spin" />
                    <p className="text-gray-400 font-bold">Procurando salas...</p>
                </div>
            ) : availableSessions.length === 0 ? (
                <div className="bg-black/40 border border-[#8bc34a]/30 rounded-2xl p-8 w-full text-center">
                    <p className="text-gray-300 font-bold text-lg mb-4">Nenhuma competição aberta no momento.</p>
                    <button onClick={() => fetchSessions(true)} className="bg-white/5 hover:bg-white/10 text-[#8bc34a] border border-[#8bc34a]/30 px-6 py-3 rounded-xl transition font-bold">
                        Atualizar Lista
                    </button>
                </div>
            ) : (
                <div className="w-full flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Salas Encontradas ({availableSessions.length})</span>
                        <button onClick={() => fetchSessions(true)} className="text-[#8bc34a] text-sm hover:underline font-bold">Atualizar</button>
                    </div>
                    {availableSessions.map(sess => (
                        <div key={sess.id} className="bg-black/50 border border-[#8bc34a]/20 hover:border-[#8bc34a]/60 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition group">
                            <div>
                                <h3 className="text-white font-black text-lg group-hover:text-[#8bc34a] transition">Sala do Prof. {sess.teacher_name}</h3>
                                <p className="text-gray-400 text-sm">
                                    {sess.status === 'active' && sess.current_question_index < 0 ? '⏳ Aguardando jogadores' : '🔴 Em andamento'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSessionId(sess.id)}
                                className="bg-gradient-to-r from-[#2e7d32] to-[#8bc34a] text-white px-6 py-2.5 rounded-lg font-black hover:brightness-110 shadow-lg"
                            >
                                Entrar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
