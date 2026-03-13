import React, { useState, useEffect, useRef } from 'react';
import { questions } from './gameData';
import { useGameSession } from './useGameSession';
import { QuestionInteraction } from './QuestionInteractions';
import { GameLogin } from './GameLogin';
import { LiveLeaderboard } from './LiveLeaderboard';
import { MathText } from './MathText';
import { supabase } from '../../supabaseClient';
import { Clock, Trophy, CheckCircle, XCircle, Loader, Wifi } from 'lucide-react';

interface StudentPlayViewProps {
    sessionId: string;
    preAuthName?: string; // nome do aluno já autenticado via login do EduControl
    onLeave?: () => void;
}

const QUESTION_DURATION = 180;

/**
 * Remove acentos e transforma em minúsculas para comparação normalizada.
 * Ex: "João" → "joao", "Cristina" → "cristina"
 */
function normalize(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '');
}

/**
 * Dado um email "joaogomes@cocpaulinia.com.br", extrai "joaogomes"
 * e tenta encontrar um aluno cujos dois primeiros nomes, normalizados e concatenados,
 * correspondam exatamente à parte local do email.
 */
function findStudentByEmail(email: string, students: { name: string }[]): { name: string } | null {
    const localPart = email.split('@')[0].toLowerCase();
    for (const student of students) {
        const parts = student.name.trim().split(/\s+/);
        if (parts.length < 2) continue;
        // tenta primeiro+segundo nome
        const combo2 = normalize(parts[0]) + normalize(parts[1]);
        if (combo2 === localPart) return student;
        // tenta primeiro nome + terceiro nome (ex: João da Silva → joaosilva)
        if (parts.length >= 3) {
            const combo13 = normalize(parts[0]) + normalize(parts[2]);
            if (combo13 === localPart) return student;
        }
    }
    return null;
}

export const StudentPlayView: React.FC<StudentPlayViewProps> = ({ sessionId, preAuthName, onLeave }) => {
    // Se preAuthName foi fornecido (aluno logado via EduControl), usá-lo diretamente
    const [studentName, setStudentName] = useState<string>(() => {
        if (preAuthName) return preAuthName;
        return sessionStorage.getItem(`game_student_name_${sessionId}`) || '';
    });
    const [participantId, setParticipantId] = useState<string | null>(() =>
        sessionStorage.getItem(`game_participant_id_${sessionId}`) || null
    );
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Se chegou com preAuthName mas sem participantId, cria o participante automaticamente
    const [autoJoining, setAutoJoining] = useState(false);

    const { session, participants, myParticipant, timeLeft, loading, joinSession, submitAnswer } =
        useGameSession(sessionId, participantId);

    const [currentAnswer, setCurrentAnswer] = useState<string | number>('');
    const [hintUsed, setHintUsed] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [answered, setAnswered] = useState(false);
    const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [maxPoints, setMaxPoints] = useState(1000);
    const prevQuestionIndexRef = useRef(-100);

    // Não limpa sessionStorage automaticamente quando session === 'finished', 
    // mas sim somente no clique explícito do aluno ao sair.
    // Assim garantimos que o aluno sempre veja o ranking final.
    const handleLeaveSession = () => {
        sessionStorage.removeItem(`game_student_name_${sessionId}`);
        sessionStorage.removeItem(`game_participant_id_${sessionId}`);
        if (onLeave) {
            onLeave();
        } else {
            window.location.reload();
        }
    };

    // Mantém o local state atualizado de acordo com o servidor (útil ao reconectar ou ao transitar questões)
    useEffect(() => {
        if (myParticipant?.answered_current !== undefined) {
            setAnswered(myParticipant.answered_current);
        }
    }, [myParticipant?.answered_current]);

    // Reset ao mudar de questão
    useEffect(() => {
        if (!session) return;
        const newIdx = session.current_question_index;
        if (newIdx !== prevQuestionIndexRef.current) {
            const isInitialLoad = prevQuestionIndexRef.current === -100;
            prevQuestionIndexRef.current = newIdx;
            setCurrentAnswer('');
            setHintUsed(false);
            setShowHint(false);
            setWasCorrect(null); // O professor ainda não liberou a correção se atualizou, mas se já acabou, mostramos info genérica.
            setPointsEarned(0);
            setMaxPoints(1000);

            // Evita o piscar "RESPOSTA REGISTRADA" ao transitar para uma nova questão:
            // Força o 'answered' falso caso não seja a primeira carga. Se for a primeira carga da página, o effect de cima resgatará a real flag do banco.
            if (!isInitialLoad) {
                setAnswered(false);
            }
        }
    }, [session?.current_question_index]);

    // Decaimento de pontos
    useEffect(() => {
        setMaxPoints(Math.max(150, 1000 - (QUESTION_DURATION - timeLeft) * 5));
    }, [timeLeft]);

    // Removido auto-submit devido a problemas de fuso horário/sincronia de relógio nos dispositivos dos alunos.
    // O aluno agora simplesmente fará o envio manual ou sua resposta não será enviada quando o professor avançar.

    // Se chegou com preAuthName mas ainda não tem participantId, entra automaticamente na sessão
    useEffect(() => {
        if (!preAuthName || participantId || autoJoining) return;
        setAutoJoining(true);
        const autoJoin = async () => {
            // Verificar se já existe participante com esse nome
            const { data: existing } = await supabase
                .from('game_participants')
                .select('id')
                .eq('session_id', sessionId)
                .eq('student_name', preAuthName)
                .maybeSingle();

            let pid: string;
            if (existing) {
                pid = existing.id;
            } else {
                const participant = await joinSession(sessionId, preAuthName);
                if (!participant) return;
                pid = participant.id;
            }
            setParticipantId(pid);
            sessionStorage.setItem(`game_student_name_${sessionId}`, preAuthName);
            sessionStorage.setItem(`game_participant_id_${sessionId}`, pid);
            setAutoJoining(false);
        };
        autoJoin();
    }, [preAuthName, sessionId]);

    // ---- Login: valida email e busca nome cadastrado no banco ----
    const handleLogin = async (email: string) => {
        setLoginLoading(true);
        setLoginError('');
        try {
            // Busca todos os alunos para matching
            const { data: students, error } = await supabase
                .from('students')
                .select('name')
                .eq('status', 'ACTIVE');

            if (error) throw error;

            const found = findStudentByEmail(email, students || []);

            if (!found) {
                setLoginError(
                    'Email não encontrado. Verifique se digitou corretamente seu primeiro e segundo nome sem acentos. Ex: joaogomes@cocpaulinia.com.br'
                );
                setLoginLoading(false);
                return;
            }

            // Verifica se já existe um participante com esse nome nessa sessão
            const { data: existing } = await supabase
                .from('game_participants')
                .select('id')
                .eq('session_id', sessionId)
                .eq('student_name', found.name)
                .maybeSingle();

            let pid: string;
            if (existing) {
                // Aluno já entrou nesta sessão — retoma pela ID existente
                pid = existing.id;
            } else {
                const participant = await joinSession(sessionId, found.name);
                if (!participant) {
                    setLoginError('Erro ao entrar na sessão. Tente novamente.');
                    setLoginLoading(false);
                    return;
                }
                pid = participant.id;
            }

            setStudentName(found.name);
            setParticipantId(pid);
            sessionStorage.setItem(`game_student_name_${sessionId}`, found.name);
            sessionStorage.setItem(`game_participant_id_${sessionId}`, pid);
        } catch (err: any) {
            setLoginError('Erro de conexão. Verifique sua internet e tente novamente.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleSubmit = async (timeout = false) => {
        if (answered || !session) return;
        const q = questions[session.current_question_index];
        if (!q) return;
        const isCorrect = !timeout && String(currentAnswer) == String(q.correct);
        const pts = isCorrect ? Math.floor(maxPoints * (hintUsed ? 0.7 : 1)) : 0;
        setAnswered(true);
        setWasCorrect(isCorrect);
        setPointsEarned(pts);
        await submitAnswer(isCorrect, pts);
    };

    // ---- Tela de login: apenas se não há nome (nem via EduControl, nem via sessão) ----
    if (!studentName || (!participantId && !autoJoining && !preAuthName)) {
        return (
            <GameLogin
                sessionId={sessionId}
                onLogin={handleLogin}
                error={loginError}
                loading={loginLoading}
            />
        );
    }

    // Loading do auto-join ou da sessão
    if (loading || autoJoining) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0d' }}>
                <Loader size={40} className="text-[#8bc34a] animate-spin" />
            </div>
        );
    }

    if (!myParticipant) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader size={40} className="text-[#8bc34a] animate-spin" />
                <p className="text-gray-400 font-bold">Conectando à sessão...</p>
            </div>
        );
    }

    if (myParticipant.status === 'rejected') {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
                <div className="text-6xl">⛔</div>
                <h2 className="text-2xl font-black text-red-500">Entrada Não Autorizada</h2>
                <p className="text-gray-400 text-center max-w-sm mb-4">
                    O professor não autorizou sua entrada nesta sessão.
                </p>
                <button onClick={handleLeaveSession}
                    className="bg-gray-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-600 transition">
                    Voltar ao Início
                </button>
            </div>
        );
    }

    if (myParticipant.status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen py-20 gap-6 relative" >
                {/* Background da splash screen */}
                <div className="absolute inset-0 bg-[url('/splash-game.png')] bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-black/60"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <Loader size={50} className="text-amber-500 animate-spin mb-4" />
                    <h2 className="text-2xl font-black text-amber-500 mb-2">Aguardando Autorização</h2>
                    <p className="text-amber-400/90 text-center max-w-sm mb-6 text-lg">
                        O professor precisa autorizar sua entrada no painel de controle.
                    </p>
                    <button onClick={handleLeaveSession}
                        className="bg-gray-800 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-700 transition text-sm">
                        Cancelar Solicitação
                    </button>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a1a0d' }}>
                <Loader size={40} className="text-red-400" />
                <p className="text-red-400 font-bold">Sessão não encontrada.</p>
            </div>
        );
    }

    if (session.status === 'active' && session.current_question_index < 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen py-24 gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/splash-game.png')] bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-black/60"></div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,195,74,0.1)_0%,transparent_60%)] animate-pulse" />
                
                <div className="relative z-10 w-28 h-28 bg-gradient-to-br from-[#2e7d32] to-[#8bc34a] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(139,195,74,0.6)] border-4 border-[#8bc34a]/30">
                    <span className="text-5xl text-white font-black">{myParticipant?.student_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="text-center relative z-10 bg-black/40 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <h2 className="text-3xl font-black text-white mb-2">Entrada Autorizada!</h2>
                    <p className="text-[#8bc34a] font-bold text-xl mb-4">Você já está na sala.</p>
                    <p className="text-gray-300 flex items-center gap-3">
                        <Loader size={20} className="text-[#8bc34a] animate-spin" />
                        Aguardando o professor iniciar a competição...
                    </p>
                </div>
            </div>
        );
    }

    if (session.status === 'finished') {
        const myRank = [...participants].filter(p => p.status === 'approved').sort((a, b) => b.score - a.score).findIndex(p => p.id === participantId) + 1;
        return (
            <div className="flex flex-col items-center py-10 gap-6 animate-fade-in w-full max-w-2xl mx-auto min-h-screen">
                <div className="text-6xl animate-bounce">🏆</div>
                <h2 className="text-3xl font-black text-white text-center">Fim de Jogo!</h2>

                <p className="text-[#8bc34a] text-xl font-bold">
                    {myParticipant?.score?.toLocaleString() ?? 0} pontos — #{myRank}º lugar
                </p>

                <div className="w-full bg-black/40 border border-[#8bc34a]/30 rounded-2xl p-6 mb-6">
                    <h3 className="text-[#8bc34a] font-bold text-lg mb-4 flex items-center gap-2 justify-center">
                        <Trophy size={18} /> Ranking Final
                    </h3>
                    <LiveLeaderboard participants={participants.filter(p => p.status === 'approved')} myName={studentName} currentQuestionIndex={session?.current_question_index} />
                </div>

                <button onClick={handleLeaveSession}
                    className="bg-gradient-to-r from-red-600 to-red-500 text-white font-black px-8 py-4 rounded-xl shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:brightness-110 transition w-full sm:w-auto text-lg">
                    Sair e Voltar ao Início
                </button>
            </div>
        );
    }

    // ---- Questão ativa ----
    const qi = session.current_question_index;
    const q = questions[qi];

    if (!q || qi < 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a1a0d' }}>
                <div className="text-5xl animate-pulse">⏳</div>
                <p className="text-white font-bold text-xl">Aguardando próxima questão...</p>
            </div>
        );
    }

    const timerPct = (timeLeft / QUESTION_DURATION) * 100;
    const timerColor = timeLeft > 60 ? '#8bc34a' : timeLeft > 30 ? '#ffb300' : '#ff4b4b';

    return (
        <div className="min-h-screen flex flex-col"
            style={{ background: 'radial-gradient(ellipse at top, #0d2e14 0%, #050d06 100%)' }}>

            {/* HUD */}
            <div className="sticky top-0 z-30 bg-black/70 backdrop-blur-sm border-b border-[#8bc34a]/20 px-4 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Clock size={16} style={{ color: timerColor }} />
                    <span className="font-black text-xl tabular-nums" style={{ color: timerColor }}>
                        {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                    </span>
                </div>
                <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${timerPct}%`, background: timerColor }} />
                </div>
                {/* Número da questão */}
                <div className="bg-white/10 border border-white/10 px-3 py-1 rounded-lg text-xs font-bold text-gray-300 shrink-0">
                    Q {qi + 1}/{questions.length}
                </div>
                <div className="shrink-0 text-right">
                    <span className="text-[#8bc34a] font-black">{hintUsed ? Math.floor(maxPoints * 0.7) : maxPoints}</span>
                    <span className="text-gray-500 text-xs ml-1">pts</span>
                </div>
                <div className="flex flex-col text-right">
                   <div className="text-[#8bc34a] font-black text-sm">{myParticipant?.score?.toLocaleString() ?? 0} pts total</div>
                   <div className="text-gray-400 font-bold text-xs">{myParticipant?.correct_answers ?? 0}/{qi > 0 ? (answered ? qi + 1 : qi) : (answered ? 1 : 0)} acertos</div>
                </div>
            </div>

            <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
                {/* Banner */}
                <div className="h-28 rounded-2xl flex items-center justify-center text-6xl shadow-xl border border-[#8bc34a]/20"
                    style={{ background: q.banner }}>
                    {q.emoji}
                </div>

                <h2 className="text-[#8bc34a] font-black text-xl">{q.title}</h2>

                <div className="bg-black/60 border-l-4 border-[#8bc34a] px-5 py-4 rounded-xl text-gray-200 text-base leading-relaxed font-medium italic">
                    “<MathText text={q.text} />”
                </div>

                {/* Interação */}
                {!answered ? (
                    <div className="bg-white/3 border border-[#8bc34a]/20 rounded-2xl p-6 flex flex-col items-center gap-4 min-h-48">
                        <QuestionInteraction
                            question={q}
                            onAnswerChange={setCurrentAnswer}
                            currentAnswer={currentAnswer}
                            disabled={answered}
                        />
                    </div>
                ) : (
                    <div className="rounded-2xl p-6 border text-center bg-[#8bc34a]/10 border-[#8bc34a]/30">
                        <div className="text-5xl mb-3">✅</div>
                        <p className="text-2xl font-black mb-1 text-[#8bc34a]">
                            Resposta registrada!
                        </p>
                        <CheckCircle size={20} className="text-[#8bc34a] mx-auto" />
                        <p className="text-gray-400 text-sm mt-3">
                            Aguardando o professor liberar a próxima etapa...
                        </p>
                    </div>
                )}

                {/* Botões */}
                {!answered && (
                    <div className="flex gap-3">
                        <button onClick={() => { setHintUsed(true); setShowHint(true); }} disabled={hintUsed}
                            className="flex-shrink-0 px-4 py-3 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-sm hover:bg-amber-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed">
                            💡 Dica (-30%)
                        </button>
                        <button onClick={() => handleSubmit()} disabled={answered}
                            className="flex-1 py-3 bg-gradient-to-r from-[#2e7d32] to-[#8bc34a] text-white font-black text-lg rounded-xl shadow-lg hover:brightness-110 transition disabled:opacity-50">
                            Confirmar Resposta
                        </button>
                    </div>
                )}

                {showHint && (
                    <div className="bg-amber-500/10 border border-amber-500/20 px-5 py-4 rounded-xl flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-amber-400 font-black">
                            <span>💡</span>
                            <span>Dica</span>
                            <span className="ml-auto text-xs font-normal text-amber-500/70 italic">-30% nos pontos</span>
                        </div>
                        {/* Fórmula recomendada renderizada com KaTeX */}
                        <div className="bg-black/40 border border-amber-500/20 rounded-xl px-4 py-3 text-center">
                            <p className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">Fórmula</p>
                            <p className="text-amber-200 text-xl font-bold">
                                <MathText text={q.hint} />
                            </p>
                        </div>
                        {/* Orientação sem dar a resposta */}
                        <div className="text-amber-300/80 text-sm leading-relaxed">
                            <b className="text-amber-400">Como usar:</b> Identifique os valores do enunciado e substitua cada variável da fórmula. Calcule com atenção os expoentes e as operações. Lembre das unidades.
                        </div>
                        <p className="text-amber-500/60 text-xs italic text-center">
                            Os dados de que você precisa estão no enunciado acima.
                        </p>
                    </div>
                )}

                <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center text-gray-400 text-sm">
                    <b className="text-gray-300">Painel do Parque:</b> Gravidade (g) = 10 m/s² | Densidade = 1000 kg/m³ | 1 m/s = 3,6 km/h
                </div>

                {timeLeft === 0 && (
                    <div className="bg-black/30 border border-[#8bc34a]/10 rounded-2xl p-4">
                        <h3 className="text-[#8bc34a] font-bold text-sm mb-3 flex items-center gap-2">
                            <Trophy size={14} /> Sua Posição (Tempo Esgotado)
                        </h3>
                        <LiveLeaderboard participants={participants} myName={studentName} onlyMe compact currentQuestionIndex={session?.current_question_index} />
                    </div>
                )}
            </div>
        </div>
    );
};
