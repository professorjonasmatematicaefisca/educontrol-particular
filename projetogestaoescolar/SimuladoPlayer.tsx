import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Send, 
  AlertCircle,
  CheckCircle2,
  Timer,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Simulado, SimuladoAttempt } from './types';
import { SupabaseService } from './services/supabaseService';

interface SimuladoPlayerProps {
  simulado: Simulado;
  assignmentId?: string;
  studentId: string;
  onComplete: (score: number) => void;
  onCancel: () => void;
  initialAnswers?: { questionId: string; selectedOption: string; }[];
  initialMode?: 'PLAYING' | 'RESULT' | 'REVIEW';
}

export const SimuladoPlayer: React.FC<SimuladoPlayerProps> = ({ 
  simulado, 
  assignmentId, 
  studentId,
  onComplete,
  onCancel,
  initialAnswers = [],
  initialMode = 'PLAYING'
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any[]>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState((simulado.durationMinutes || 60) * 60);
  const [isFinishing, setIsFinishing] = useState(false);
  const [mode, setMode] = useState<'PLAYING' | 'RESULT' | 'REVIEW'>(initialMode);
  const [score, setScore] = useState(0);

  // Timer para rastrear tempo total
  const [startTime] = useState(() => Date.now());

  // Iniciar tentativa no banco
  useEffect(() => {
    if (initialMode !== 'PLAYING') {
      setScore(calculateScore());
      return;
    }
    const startAttempt = async () => {
      try {
        await SupabaseService.createSimuladoAttempt({
          simuladoId: simulado.id,
          studentId: studentId,
          assignmentId: assignmentId,
          startedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not save attempt start:', err);
      }
    };
    startAttempt();
  }, [simulado.id, studentId, assignmentId]);

  // Timer
  useEffect(() => {
    if (mode !== 'PLAYING') return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, mode]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (mode !== 'PLAYING') return;
    const newAnswers = [...answers];
    const existing = newAnswers.find(a => a.questionId === questionId);
    if (existing) {
      existing.selectedOption = optionId;
    } else {
      newAnswers.push({ questionId, selectedOption: optionId });
    }
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    let correct = 0;
    simulado.questions.forEach(q => {
      const ans = answers.find(a => a.questionId === q.id);
      const correctOpt = q.options.find((o: any) => o.isCorrect);
      if (ans && ans.selectedOption === correctOpt?.id) {
        correct++;
      }
    });
    return Math.round((correct / simulado.questions.length) * 100);
  };

  const handleAutoSubmit = () => {
    finishSimulado();
  };

  const finishSimulado = async () => {
    const calculatedScore = calculateScore();
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      if (assignmentId) {
        await SupabaseService.updateSimuladoAttempt(assignmentId, {
          score: calculatedScore,
          answers,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          timeSpentSeconds: timeSpent,
          assignmentId: assignmentId
        });
      }
    } catch (err) {
      console.warn('Could not save attempt completion:', err);
    }
    
    setScore(calculatedScore);
    setMode('RESULT');
    setIsFinishing(false);
  };

  const currentQuestion = simulado.questions[currentIdx];
  const selectedOption = answers.find(a => a.questionId === (currentQuestion?.id || ''))?.selectedOption;

  if (!currentQuestion && mode !== 'RESULT') return null;

  return (
    <div className="flex flex-col h-full bg-[#030712] text-white overflow-hidden animate-in fade-in duration-700">
      {/* Top Bar */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
           <div className="flex flex-col">
              <h2 className="text-lg font-black tracking-tight">{simulado.title}</h2>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-emerald-500 uppercase px-2 py-0.5 bg-emerald-500/10 rounded-full">{simulado.type}</span>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentIdx + 1} de {simulado.questions.length} Questões</span>
              </div>
           </div>
        </div>

        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all ${mode !== 'PLAYING' ? 'opacity-0' : timeLeft < 300 ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 animate-pulse' : 'bg-slate-900/50 border-white/10 text-emerald-500 shadow-lg shadow-emerald-500/5'}`}>
           <Timer size={20} />
           <span className="text-xl font-black font-mono">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'PLAYING' ? (
            <button 
              onClick={() => setIsFinishing(true)}
              className="px-8 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              Finalizar
            </button>
          ) : (mode === 'RESULT' || mode === 'REVIEW') && (
            <button 
              onClick={() => onComplete(score)}
              className="px-8 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              Sair
            </button>
          )}
          <button onClick={onCancel} className="p-3 text-slate-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12">
          {mode === 'RESULT' ? (
            <div className="max-w-3xl mx-auto space-y-12 py-10 animate-in zoom-in-95 duration-500">
               <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/20">
                     <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-4xl font-black">Simulado Concluído!</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em]">Seu desempenho final foi de:</p>
                  <div className="text-7xl font-black text-white bg-white/5 inline-block px-10 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
                     {score}<span className="text-2xl text-slate-500">%</span>
                  </div>
               </div>

               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Gabarito Rápido</h4>
                  <div className="flex flex-wrap justify-center gap-3">
                     {simulado.questions.map((q, idx) => {
                        const ans = answers.find(a => a.questionId === q.id);
                        const isCorrect = ans && q.options.find((o: any) => o.isCorrect)?.id === ans.selectedOption;
                        return (
                           <button
                              key={q.id}
                              onClick={() => {
                                 setCurrentIdx(idx);
                                 setMode('REVIEW');
                              }}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all hover:scale-110 ${
                                 isCorrect ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-rose-500 border-rose-500 text-white shadow-lg'
                              }`}
                           >
                              {idx + 1}
                           </button>
                        );
                     })}
                  </div>
               </div>

               <div className="flex gap-4 max-w-sm mx-auto">
                  <button 
                    onClick={() => setMode('REVIEW')}
                    className="flex-1 py-5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-sky-500/20"
                  >
                    Revisar
                  </button>
                  <button 
                    onClick={() => onComplete(score)}
                    className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400 transition-all shadow-xl"
                  >
                    Sair
                  </button>
               </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-12">
               <div className="space-y-6">
                  <div className="prose prose-invert prose-lg max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                       {currentQuestion.text}
                    </ReactMarkdown>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map((opt: any) => {
                     const isCorrect = opt.isCorrect;
                     const isSelected = selectedOption === opt.id;
                     
                     let style = 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-emerald-500/30 hover:bg-slate-900/60';
                     if (mode === 'PLAYING') {
                        if (isSelected) style = 'bg-emerald-500 border-emerald-500 text-white shadow-2xl shadow-emerald-500/20';
                     } else {
                        if (isCorrect) style = 'bg-emerald-500 border-emerald-500 text-white shadow-lg';
                        else if (isSelected && !isCorrect) style = 'bg-rose-500 border-rose-500 text-white shadow-lg';
                        else style = 'bg-slate-900/20 border-white/5 text-slate-600 opacity-60';
                     }

                     return (
                        <button 
                          key={opt.id}
                          disabled={mode !== 'PLAYING'}
                          onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                          className={`group flex items-center gap-4 p-4 rounded-3xl border transition-all text-left ${style}`}
                        >
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all flex-shrink-0 ${
                              isSelected ? 'bg-white text-emerald-600' : 'bg-slate-950 text-slate-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'
                           }`}>
                              {opt.id}
                           </div>
                           <div className="flex-1">
                              <div className="prose prose-invert prose-sm max-w-none -mt-0.5">
                                 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {opt.text}
                                 </ReactMarkdown>
                              </div>
                           </div>
                        </button>
                     );
                  })}
               </div>

               {mode === 'REVIEW' && currentQuestion.resolution && (
                  <div className="mt-12 p-8 bg-sky-500/5 border border-sky-500/20 rounded-[2.5rem] space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                     <div className="flex items-center gap-3 text-sky-400">
                        <CheckCircle2 size={24} />
                        <h4 className="text-sm font-black uppercase tracking-widest">Resolução Comentada</h4>
                     </div>
                     <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed italic">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                           {currentQuestion.resolution}
                        </ReactMarkdown>
                     </div>
                  </div>
               )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-white/5 p-8 bg-slate-950/20 backdrop-blur-sm hidden xl:block overflow-y-auto">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Mapa de Questões</h4>
           <div className="grid grid-cols-4 gap-2">
              {simulado.questions.map((q, idx) => {
                 const ans = answers.find(a => a.questionId === q.id);
                 const isAnswered = !!ans;
                 const isCurrent = currentIdx === idx;
                 
                 let statusStyle = 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20';
                 if (mode === 'PLAYING') {
                    if (isCurrent) statusStyle = 'bg-emerald-500 border-emerald-500 text-white shadow-lg';
                    else if (isAnswered) statusStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
                 } else {
                    const isCorrect = ans && q.options.find((o: any) => o.isCorrect)?.id === ans.selectedOption;
                    if (isCurrent) statusStyle = isCorrect ? 'bg-emerald-500 ring-4 ring-emerald-500/20 text-white' : 'bg-rose-500 ring-4 ring-rose-500/20 text-white';
                    else if (isCorrect) statusStyle = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
                    else statusStyle = 'bg-rose-500/20 border-rose-500/40 text-rose-400';
                 }

                 return (
                    <button 
                      key={q.id}
                      onClick={() => {
                        setCurrentIdx(idx);
                        if (mode === 'RESULT') setMode('REVIEW');
                      }}
                      className={`h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border ${statusStyle}`}
                    >
                       {idx + 1}
                    </button>
                 );
              })}
           </div>

           <div className="mt-12 p-6 bg-slate-900/50 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                 <AlertCircle size={16} />
                 <span className="text-[10px] font-bold uppercase">Ajuda</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed italic">
                 {mode === 'PLAYING' 
                  ? 'O cronômetro não para ao fechar a janela. Revise suas respostas antes de finalizar.' 
                  : 'Ao revisar, você pode ver a resolução detalhada (se disponível) para cada questão.'}
              </p>
           </div>
        </div>
      </div>

      {/* Footer Controls */}
      {mode !== 'RESULT' && (
      <div className="p-8 border-t border-white/5 bg-slate-950/80 backdrop-blur-md flex justify-between items-center shrink-0">
         <button 
           onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
           disabled={currentIdx === 0}
           className="flex items-center gap-3 px-8 py-3 text-slate-400 hover:text-white disabled:opacity-30 transition-all font-black uppercase text-[10px] tracking-[0.2em]"
         >
            <ChevronLeft size={20} /> Anterior
         </button>

         <div className="flex items-center gap-2">
            {simulado.questions.map((_, idx) => (
               <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${currentIdx === idx ? 'bg-emerald-500 w-4' : 'bg-slate-800'}`}></div>
            ))}
         </div>

         {currentIdx < simulado.questions.length - 1 ? (
            <button 
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="flex items-center gap-3 px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-500/20"
            >
               Próxima <ChevronRight size={20} />
            </button>
         ) : mode === 'PLAYING' ? (
            <button 
              onClick={() => setIsFinishing(true)}
              className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-white/10"
            >
               Finalizar <Send size={18} />
            </button>
         ) : (
            <button 
              onClick={() => onComplete(score)}
              className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-white/10"
            >
               Sair <CheckCircle2 size={18} />
            </button>
         )}
      </div>
      )}

      {/* Confirmation Modal */}
      {isFinishing && (
         <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6">
            <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] border border-white/10 p-12 text-center space-y-8 animate-in zoom-in-95 duration-300">
               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/20">
                  <AlertCircle size={40} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black">Finalizar Simulado?</h3>
                  <p className="text-slate-400 text-sm">Você respondeu {answers.length} de {simulado.questions.length} questões. Uma vez enviado, as respostas não poderão ser alteradas.</p>
               </div>
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={finishSimulado}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-500/20 transition-all"
                  >
                     Confirmar e Enviar
                  </button>
                  <button 
                    onClick={() => setIsFinishing(false)}
                    className="w-full py-5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all"
                  >
                     Voltar à Revisão
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
