import React, { useState } from 'react';
import { questions } from './gameData';
import { useGameSession } from './useGameSession';
import { LiveLeaderboard } from './LiveLeaderboard';
import { MathText } from './MathText';
import { Play, SkipForward, Square, Users, Trophy, Clock, AlertTriangle, Loader, BookOpen, BarChart3, CheckSquare, XSquare } from 'lucide-react';

interface TeacherControlPanelProps {
    teacherName: string;
    sessionId: string | null;
    onCreateSession: () => void;
}

type TabId = 'controle' | 'questao' | 'ranking';

export const TeacherControlPanel: React.FC<TeacherControlPanelProps> = ({
    teacherName, sessionId, onCreateSession,
}) => {
    const { session, participants, timeLeft, loading, startNextQuestion, finishGame, approveParticipant, rejectParticipant } =
        useGameSession(sessionId, null);
    const [confirming, setConfirming] = useState(false);
    const [tab, setTab] = useState<TabId>('controle');

    const qi = session?.current_question_index ?? -1;
    const isLast = qi >= questions.length - 1;
    const currentQ = qi >= 0 ? questions[qi] : null;
    const approvedParticipants = participants.filter(p => p.status === 'approved');
    const pendingParticipants = participants.filter(p => p.status === 'pending');

    const answeredCount = approvedParticipants.filter(p => p.answered_current).length;
    const timerPct = (timeLeft / 180) * 100;
    const timerColor = timeLeft > 60 ? '#8bc34a' : timeLeft > 30 ? '#ffb300' : '#ff4b4b';
    const timerExpired = timeLeft === 0 && session?.status === 'active';

    if (!sessionId) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 py-16">
                <div className="text-6xl">🎮</div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-white mb-2">WetWit Quest — Painel do Professor</h2>
                    <p className="text-gray-400">Crie uma nova sessão para iniciar a competição ao vivo.</p>
                </div>
                <button onClick={onCreateSession}
                    className="flex items-center gap-3 bg-gradient-to-r from-[#2e7d32] to-[#8bc34a] text-white font-black text-xl px-10 py-5 rounded-2xl shadow-[0_4px_30px_rgba(139,195,74,0.3)] hover:brightness-110 transition">
                    <Play size={24} /> Criar Nova Sessão
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader size={40} className="text-[#8bc34a] animate-spin" />
            </div>
        );
    }

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'controle', label: 'Controle', icon: <Play size={15} /> },
        { id: 'questao', label: `Questão ${qi >= 0 ? qi + 1 : '—'}`, icon: <BookOpen size={15} /> },
        { id: 'ranking', label: `Ranking (${approvedParticipants.length})`, icon: <BarChart3 size={15} /> },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="bg-black/40 border border-[#8bc34a]/20 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-white">🎮 WetWit Quest — Ao Vivo</h2>
                    <p className="text-gray-500 text-xs font-mono mt-0.5">{sessionId?.slice(0, 16)}...</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#8bc34a]/10 border border-[#8bc34a]/20 px-4 py-2 rounded-xl">
                        <Users size={16} className="text-[#8bc34a]" />
                        <span className="text-[#8bc34a] font-black text-lg">{approvedParticipants.length}</span>
                        {pendingParticipants.length > 0 && (
                            <span className="ml-1 text-amber-500 font-bold text-sm bg-amber-500/20 px-2 py-0.5 rounded-md">
                                +{pendingParticipants.length} pendentes
                            </span>
                        )}
                    </div>
                    {qi >= 0 && (
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-gray-300 font-bold text-sm">
                            Q {qi + 1} / {questions.length}
                        </div>
                    )}
                    <div className={`px-4 py-2 rounded-xl font-bold text-sm border ${session?.status === 'active' && qi < 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        session?.status === 'active' && qi >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            'bg-gray-500/10 border-gray-500/20 text-gray-400'
                        }`}>
                        {session?.status === 'active' && qi < 0 ? '⏳ Aguardando' :
                            session?.status === 'active' && qi >= 0 ? '🔴 Ao Vivo' : '✅ Encerrado'}
                    </div>
                </div>
            </div>

            {/* Abas */}
            <div className="flex gap-2 bg-black/30 p-1 rounded-xl border border-white/5">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition ${tab === t.id ? 'bg-[#8bc34a] text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ─── ABA CONTROLE ─── */}
            {tab === 'controle' && (
                <div className="flex flex-col gap-4">
                    {/* Timer (apenas quando ativo) */}
                    {session?.status === 'active' && qi >= 0 && (
                        <div className="bg-black/40 border border-[#8bc34a]/20 rounded-2xl p-5 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Timer da Questão {qi + 1}</span>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} style={{ color: timerColor }} />
                                    <span className="font-black text-3xl tabular-nums" style={{ color: timerColor }}>
                                        {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timerPct}%`, background: timerColor }} />
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${answeredCount === participants.length ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                                <span className="text-gray-400">
                                    <span className="text-white font-bold">{answeredCount}/{approvedParticipants.length}</span> já responderam
                                </span>
                            </div>
                            {timerExpired && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 font-bold text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} /> Tempo esgotado! Libere a próxima questão abaixo.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lista de Espera */}
                    {session?.status === 'active' && qi < 0 && pendingParticipants.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-2">
                            <div className="text-amber-400 font-black mb-3 flex items-center gap-2">
                                <AlertTriangle size={18} /> {pendingParticipants.length} aluno(s) aguardando liberação para entrar
                            </div>
                            <div className="flex flex-col gap-2">
                                {pendingParticipants.map(p => (
                                    <div key={p.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 py-3">
                                        <span className="text-white font-bold">{p.student_name}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => approveParticipant(p.id)} className="flex items-center gap-1 bg-[#8bc34a]/20 text-[#8bc34a] hover:bg-[#8bc34a]/40 px-3 py-1.5 rounded-lg border border-[#8bc34a]/30 transition font-bold text-sm">
                                                <CheckSquare size={16} /> Liberar
                                            </button>
                                            <button onClick={() => rejectParticipant(p.id)} className="flex items-center gap-1 bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-1.5 rounded-lg border border-red-500/30 transition font-bold text-sm">
                                                <XSquare size={16} /> Recusar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Controles */}
                    <div className="bg-black/40 border border-[#8bc34a]/20 rounded-2xl p-5">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">Controles da Competição</div>
                        <div className="flex flex-wrap gap-3">
                            {session?.status !== 'finished' && !isLast && (
                                <button onClick={startNextQuestion}
                                    className="flex items-center gap-2 bg-gradient-to-r from-[#2e7d32] to-[#8bc34a] text-white font-black px-6 py-3 rounded-xl hover:brightness-110 transition shadow-lg text-lg">
                                    <SkipForward size={20} />
                                    {session?.status === 'active' && qi < 0 ? '▶ Iniciar Questão 1' : timerExpired ? '▶ Liberar Próxima Questão' : '⏭ Pular para Próxima'}
                                </button>
                            )}
                            {session?.status !== 'finished' && (
                                !confirming ? (
                                    <button onClick={() => setConfirming(true)}
                                        className="flex items-center gap-2 bg-red-500/15 text-red-400 border border-red-500/30 font-bold px-6 py-3 rounded-xl hover:bg-red-500/25 transition">
                                        <Square size={18} /> Encerrar Jogo
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/40 px-4 py-3 rounded-xl">
                                        <AlertTriangle size={16} className="text-red-400" />
                                        <span className="text-red-300 text-sm font-bold">Confirmar encerramento?</span>
                                        <button onClick={() => { setConfirming(false); finishGame(); }}
                                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-red-500 transition">Sim</button>
                                        <button onClick={() => setConfirming(false)}
                                            className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-gray-600 transition">Não</button>
                                    </div>
                                )
                            )}
                        </div>
                        {isLast && session?.status === 'active' && (
                            <p className="text-amber-400 text-sm mt-3 flex items-center gap-2">
                                <AlertTriangle size={14} /> Esta é a última questão. Encerre após o tempo.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ─── ABA QUESTÃO ─── */}
            {tab === 'questao' && (
                <div className="bg-black/40 border border-[#8bc34a]/20 rounded-2xl p-5">
                    {!currentQ ? (
                        <div className="text-center py-10 text-gray-500">
                            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                            <p>Nenhuma questão ativa. Inicie a competição primeiro.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Questão {qi + 1} de {questions.length}</span>
                                <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#8bc34a] rounded-full transition-all" style={{ width: `${((qi + 1) / questions.length) * 100}%` }} />
                                </div>
                                <span className="text-4xl">{currentQ.emoji}</span>
                            </div>
                            <h3 className="text-[#8bc34a] font-black text-lg">{currentQ.title}</h3>
                            <div className="bg-black/60 border-l-4 border-[#8bc34a] px-5 py-4 rounded-xl text-gray-200 text-base leading-relaxed italic">
                                "{currentQ.text}"
                            </div>
                            {currentQ.optsA && (
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Opções A</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentQ.optsA.map(o => (
                                            <div key={o.id} className="bg-[#8bc34a]/5 border border-[#8bc34a]/20 rounded-lg px-3 py-2 text-sm text-gray-300">
                                                <MathText text={o.val} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">Resposta correta: </span>
                                <span className="text-white font-bold">{currentQ.correct}</span>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-300 text-sm">
                                <b className="block text-blue-400 mb-1">💡 Dica da questão:</b>
                                {currentQ.hint}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── ABA RANKING ─── */}
            {tab === 'ranking' && (
                <div className="bg-black/40 border border-[#8bc34a]/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy size={18} className="text-yellow-400" />
                        <h3 className="text-white font-black">Ranking Ao Vivo</h3>
                        <span className="ml-auto text-xs text-gray-500">{approvedParticipants.length} participante(s)</span>
                    </div>
                    <LiveLeaderboard participants={approvedParticipants} currentQuestionIndex={session?.current_question_index} />
                </div>
            )}
        </div>
    );
};
