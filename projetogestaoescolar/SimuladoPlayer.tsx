import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Send, 
  AlertCircle,
  CheckCircle2,
  Timer
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
}

export const SimuladoPlayer: React.FC<SimuladoPlayerProps> = ({ 
  simulado, 
  assignmentId, 
  studentId,
  onComplete,
  onCancel 
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState((simulado.durationMinutes || 60) * 60);
  const [isFinishing, setIsFinishing] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Iniciar tentativa no banco
  useEffect(() => {
    const startAttempt = async () => {
      const attempt: Partial<SimuladoAttempt> = {
        simuladoId: simulado.id,
        studentId: studentId,
        assignmentId: assignmentId,
        startedAt: new Date().toISOString()
      };
      
      // Aqui precisaríamos de um método que retorne o ID criado, ou geramos um UUID
      // Por simplicidade para o protótipo, vamos assumir que o registro foi criado
      onShowToast('Simulado iniciado! Boa sorte.');
    };
    startAttempt();
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
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
    onShowToast('Tempo esgotado! Enviando respostas automaticamente.');
    finishSimulado();
  };

  const finishSimulado = async () => {
    const score = calculateScore();
    // Simular salvamento
    onComplete(score);
  };

  const onShowToast = (msg: string) => {
    // Implementar se necessário ou usar props
    console.log(msg);
  };

  const currentQuestion = simulado.questions[currentIdx];
  const selectedOption = answers.find(a => a.questionId === currentQuestion.id)?.selectedOption;

  return (
    <div className="flex flex-col h-full bg-[#030712] text-white overflow-hidden animate-in fade-in duration-700">
      {/* Top Bar - Focus Mode */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-6">
           <div className="flex flex-col">
              <h2 className="text-lg font-black tracking-tight">{simulado.title}</h2>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-emerald-500 uppercase px-2 py-0.5 bg-emerald-500/10 rounded-full">{simulado.type}</span>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentIdx + 1} de {simulado.questions.length} Questões</span>
              </div>
           </div>
        </div>

        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all ${timeLeft < 300 ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 animate-pulse' : 'bg-slate-900/50 border-white/10 text-emerald-500 shadow-lg shadow-emerald-500/5'}`}>
           <Timer size={20} />
           <span className="text-xl font-black font-mono">{formatTime(timeLeft)}</span>
        </div>

        <button 
          onClick={() => setIsFinishing(true)}
          className="px-8 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-white/5"
        >
          Finalizar
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 overflow-y-auto p-12 lg:p-20">
          <div className="max-w-3xl mx-auto space-y-12">
             <div className="space-y-6">
                <div className="prose prose-invert prose-lg max-w-none">
                   <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {currentQuestion.text}
                   </ReactMarkdown>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((opt: any) => (
                   <button 
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`group flex items-center gap-6 p-6 rounded-[2rem] border transition-all text-left ${
                       selectedOption === opt.id 
                       ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xl shadow-emerald-500/20 scale-[1.02]' 
                       : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-emerald-500/30 hover:bg-slate-900/60'
                    }`}
                   >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${
                         selectedOption === opt.id ? 'bg-white text-emerald-600' : 'bg-slate-950 text-slate-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'
                      }`}>
                         {opt.id}
                      </div>
                      <span className="flex-1 text-sm font-bold">{opt.text}</span>
                   </button>
                ))}
             </div>
          </div>
        </div>

        {/* Navigation Sidebar */}
        <div className="w-80 border-l border-white/5 p-8 bg-slate-950/20 backdrop-blur-sm hidden xl:block">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Mapa de Questões</h4>
           <div className="grid grid-cols-4 gap-3">
              {simulado.questions.map((q, idx) => {
                 const isAnswered = answers.some(a => a.questionId === q.id);
                 const isCurrent = currentIdx === idx;
                 return (
                    <button 
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-12 rounded-xl flex items-center justify-center text-xs font-black transition-all border ${
                         isCurrent ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 
                         isAnswered ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 
                         'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'
                      }`}
                    >
                       {idx + 1}
                    </button>
                 );
              })}
           </div>

           <div className="mt-12 p-6 bg-slate-900/50 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                 <AlertCircle size={16} />
                 <span className="text-[10px] font-bold uppercase">Lembrete</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                 Não esqueça de revisar as questões em dúvida antes de finalizar. O cronômetro não para ao fechar a janela.
              </p>
           </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-8 border-t border-white/5 bg-slate-950/80 backdrop-blur-md flex justify-between items-center">
         <button 
           onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
           disabled={currentIdx === 0}
           className="flex items-center gap-3 px-8 py-3 text-slate-400 hover:text-white disabled:opacity-30 transition-all font-black uppercase text-[10px] tracking-widest"
         >
            <ChevronLeft size={20} /> Questão Anterior
         </button>

         <div className="flex items-center gap-2">
            {simulado.questions.map((_, idx) => (
               <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${currentIdx === idx ? 'bg-emerald-500 w-4' : 'bg-slate-800'}`}></div>
            ))}
         </div>

         {currentIdx < simulado.questions.length - 1 ? (
            <button 
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="flex items-center gap-3 px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20"
            >
               Próxima Questão <ChevronRight size={20} />
            </button>
         ) : (
            <button 
              onClick={() => setIsFinishing(true)}
              className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-white/10"
            >
               Finalizar Simulado <Send size={20} />
            </button>
         )}
      </div>

      {/* Confirmation Modal */}
      {isFinishing && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
            <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] border border-white/10 p-12 text-center space-y-8 animate-in zoom-in-95">
               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                  <CheckCircle2 size={40} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black">Pronto para finalizar?</h3>
                  <p className="text-slate-400 text-sm">Você respondeu {answers.length} de {simulado.questions.length} questões.</p>
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
