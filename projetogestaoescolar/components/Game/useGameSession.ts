import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

export interface GameSession {
    id: string;
    status: 'waiting' | 'active' | 'finished';
    current_question_index: number;
    question_start_time: string | null;
    teacher_id: string | null;
    teacher_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface GameParticipant {
    id: string;
    session_id: string;
    student_name: string;
    score: number;
    correct_answers: number;
    answered_current: boolean;
    last_seen: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

interface UseGameSessionReturn {
    session: GameSession | null;
    participants: GameParticipant[];
    myParticipant: GameParticipant | null;
    timeLeft: number;
    loading: boolean;
    error: string | null;
    // Teacher actions
    createSession: (teacherName: string) => Promise<GameSession | null>;
    startNextQuestion: () => Promise<void>;
    finishGame: () => Promise<void>;
    approveParticipant: (id: string) => Promise<void>;
    rejectParticipant: (id: string) => Promise<void>;
    // Student actions
    joinSession: (sessionId: string, studentName: string) => Promise<GameParticipant | null>;
    submitAnswer: (isCorrect: boolean, pointsEarned: number) => Promise<void>;
}

const QUESTION_DURATION = 180;

export function useGameSession(
    sessionId: string | null,
    participantId: string | null
): UseGameSessionReturn {
    const [session, setSession] = useState<GameSession | null>(null);
    const [participants, setParticipants] = useState<GameParticipant[]>([]);
    const [myParticipant, setMyParticipant] = useState<GameParticipant | null>(null);
    const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const skewOffsetRef = useRef<number>(0);
    const lastQuestionIndexRef = useRef<number>(-100);

    // Calcula o tempo restante compensando o fuso horário (clock skew) entre professor e alunos
    const recalcTimer = useCallback((questionStartTime: string | null, status: string, questionIndex: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!questionStartTime || status !== 'active' || questionIndex < 0) {
            setTimeLeft(QUESTION_DURATION);
            return;
        }

        const dateStr = questionStartTime.endsWith('Z') || questionStartTime.includes('+') || (questionStartTime.includes('-') && questionStartTime.lastIndexOf('-') > 10) 
            ? questionStartTime 
            : `${questionStartTime}Z`;
        const startMs = new Date(dateStr).getTime();

        if (questionIndex !== lastQuestionIndexRef.current) {
            // Calcula o desvio entre Date.now() local e o tempo de início do professor
            skewOffsetRef.current = Date.now() - startMs;
            lastQuestionIndexRef.current = questionIndex;
        }

        const tick = () => {
            const adjustedStart = startMs + skewOffsetRef.current;
            const elapsed = Math.floor((Date.now() - adjustedStart) / 1000);
            setTimeLeft(Math.max(0, Math.min(QUESTION_DURATION, QUESTION_DURATION - elapsed)));
        };
        tick();
        timerRef.current = setInterval(tick, 1000);
    }, []);

    useEffect(() => {
        if (!sessionId) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [sessionRes, participantsRes] = await Promise.all([
                    supabase.from('game_sessions').select('*').eq('id', sessionId).single(),
                    supabase.from('game_participants').select('*').eq('session_id', sessionId).order('score', { ascending: false }),
                ]);
                if (!isMounted) return;
                if (sessionRes.error) throw sessionRes.error;

                const loadedSession = sessionRes.data as GameSession;
                setSession(loadedSession);
                setParticipants((participantsRes.data as GameParticipant[]) ?? []);

                if (participantId) {
                    const mine = (participantsRes.data ?? []).find((p: GameParticipant) => p.id === participantId) ?? null;
                    setMyParticipant(mine);
                }
                recalcTimer(loadedSession.question_start_time, loadedSession.status, loadedSession.current_question_index);
            } catch (err: any) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadInitialData();

        // ─── Realtime: game_sessions (postgres_changes) ───
        const sessionChannel = supabase
            .channel(`session:${sessionId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
                (payload) => {
                    if (!isMounted) return;
                    const updated = payload.new as GameSession;
                    setSession(updated);
                    recalcTimer(updated.question_start_time, updated.status, updated.current_question_index);
                }
            )
            .subscribe();

        // Polling contínuo adicional como garantia contra falhas silenciosas do Realtime (ex: RLS bloqueando eventos)
        const pollInterval = setInterval(async () => {
            if (!isMounted) return;
            // Busca sessão
            const { data: sData } = await supabase.from('game_sessions').select('*').eq('id', sessionId).single();
            if (sData) {
                const s = sData as GameSession;
                setSession(prev => {
                    if (prev?.current_question_index !== s.current_question_index || prev?.status !== s.status) {
                        recalcTimer(s.question_start_time, s.status, s.current_question_index);
                        return s;
                    }
                    return prev;
                });
            }
            // Busca participantes
            const { data: pData } = await supabase.from('game_participants').select('*').eq('session_id', sessionId).order('score', { ascending: false });
            if (pData) {
                setParticipants(pData as GameParticipant[]);
            }
        }, 3000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            supabase.removeChannel(sessionChannel);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sessionId, participantId, recalcTimer]);

    // O myParticipant é derivado do estado de participants para nunca dessincronizar com o realtime
    useEffect(() => {
        if (participantId && participants.length > 0) {
            const mine = participants.find(p => p.id === participantId);
            if (mine) setMyParticipant(mine);
        }
    }, [participants, participantId]);

    // ─── Ações do Professor ───

    const createSession = async (teacherName: string): Promise<GameSession | null> => {
        const { data, error } = await supabase
            .from('game_sessions')
            .insert({ teacher_name: teacherName, status: 'active', current_question_index: -1 })
            .select()
            .single();
        if (error) { setError(error.message); return null; }
        return data as GameSession;
    };

    const startNextQuestion = async () => {
        if (!session) return;
        const nextIndex = session.current_question_index + 1;

        // Reseta Flag de resposta de todos os participantes PRIMEIRO
        // Assim, quando a nova questão for exibida (via realtime de session), o participant já está "limpo" no banco
        const { error: partErr } = await supabase
            .from('game_participants')
            .update({ answered_current: false })
            .eq('session_id', session.id);

        if (!partErr) {
            // Atualiza sessão → dispara o Realtime para todos recarregarem a questão visível
            await supabase
                .from('game_sessions')
                .update({
                    current_question_index: nextIndex,
                    question_start_time: new Date().toISOString(),
                    status: 'active',
                })
                .eq('id', session.id);
        }
    };

    /**
     * Encerra o game:
     * 1. Marca sessão como finished
     * 2. Deleta TODOS os participantes da sessão
     * → Professores voltam à tela "Criar Nova Sessão"
     */
    const finishGame = async () => {
        if (!session) return;

        // 1. Marca finished (Realtime vai notificar alunos)
        await supabase
            .from('game_sessions')
            .update({ status: 'finished' })
            .eq('id', session.id);

        // 2. Remove o ID da sessão do localStorage (professor volta ao início)
        localStorage.removeItem('wetwiquest_session_id');

        // 3. Recarrega a página para resetar o estado local do professor
        //    (estado React vai ser resetado automaticamente junto com sessionId)
        window.location.reload();
    };

    const approveParticipant = async (id: string) => {
        await supabase.from('game_participants').update({ status: 'approved' }).eq('id', id);
    };

    const rejectParticipant = async (id: string) => {
        await supabase.from('game_participants').update({ status: 'rejected' }).eq('id', id);
    };

    // ─── Ações do Aluno ───

    const joinSession = async (sid: string, studentName: string): Promise<GameParticipant | null> => {
        const { data, error } = await supabase
            .from('game_participants')
            .insert({ session_id: sid, student_name: studentName, score: 0, status: 'pending', answered_current: false, correct_answers: 0 })
            .select()
            .single();
        if (error) { setError(error.message); return null; }
        return data as GameParticipant;
    };

    const submitAnswer = async (isCorrect: boolean, pointsEarned: number) => {
        if (!myParticipant || myParticipant.answered_current) return;
        const newScore = myParticipant.score + (isCorrect ? pointsEarned : 0);
        const newCorrectAnswers = myParticipant.correct_answers + (isCorrect ? 1 : 0);
        await supabase
            .from('game_participants')
            .update({ 
                 score: newScore, 
                 correct_answers: newCorrectAnswers,
                 answered_current: true, 
                 last_seen: new Date().toISOString() 
            })
            .eq('id', myParticipant.id);
    };

    return {
        session, participants, myParticipant, timeLeft, loading, error,
        createSession, startNextQuestion, finishGame, approveParticipant, rejectParticipant, joinSession, submitAnswer,
    };
}
