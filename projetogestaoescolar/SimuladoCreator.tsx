import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Edit3, 
  Type, 
  Clock, 
  BookOpen, 
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sigma
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Simulado, Discipline } from './types';
import { SupabaseService } from './services/supabaseService';

interface SimuladoCreatorProps {
  disciplines: Discipline[];
  teacherEmail: string;
  editingSimulado?: Simulado | null; // Optional simulado for editing
  onSave: () => void;
  onCancel: () => void;
  onShowToast: (msg: string) => void;
}

export const SimuladoCreator: React.FC<SimuladoCreatorProps> = ({ 
  disciplines, 
  teacherEmail,
  editingSimulado,
  onSave, 
  onCancel,
  onShowToast 
}) => {
  const [step, setStep] = useState(1);
  const [simulado, setSimulado] = useState<Partial<Simulado>>(editingSimulado || {
    title: '',
    description: '',
    type: 'SIMULADO',
    disciplineId: '',
    contentTopic: '',
    durationMinutes: 60,
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    id: Math.random().toString(36).substring(7),
    text: '',
    options: [
      { id: 'A', text: '', isCorrect: false },
      { id: 'B', text: '', isCorrect: false },
      { id: 'C', text: '', isCorrect: false },
      { id: 'D', text: '', isCorrect: false },
      { id: 'E', text: '', isCorrect: false },
    ],
    explanation: '',
    resolution: ''
  });

  const [isPreview, setIsPreview] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [showSmartParser, setShowSmartParser] = useState(false);

  const parseSmartInput = () => {
    if (!smartInput.trim()) return;

    // Regex para capturar texto da questão, alternativas e alternativa correta
    const lines = smartInput.split('\n').map(l => l.trim()).filter(l => l);
    let questionTextLines: string[] = [];
    let options: { id: string; text: string; isCorrect: boolean }[] = [];
    let correctId = '';

    const optionRegex = /^([A-E])\)[\s:]*(.*)/i;
    const correctRegex = /(?:Alternativa correta|Gabarito|Resposta|CORRETA)[\s:]*([A-E])/i;
    const resolutionRegex = /(?:Resolução|Explicação|Comentário)[\s:]*([\s\S]*)/i;

    lines.forEach(line => {
      const optMatch = line.match(optionRegex);
      const correctMatch = line.match(correctRegex);

      if (optMatch) {
        options.push({
          id: optMatch[1].toUpperCase(),
          text: optMatch[2].trim(),
          isCorrect: false
        });
      } else if (correctMatch) {
        correctId = correctMatch[1].toUpperCase();
      } else {
        // Se ainda não temos alternativas, é parte do texto da questão
        if (options.length === 0) {
          questionTextLines.push(line);
        }
      }
    });

    if (correctId && options.length > 0) {
      options = options.map(opt => ({
        ...opt,
        isCorrect: opt.id === correctId
      }));
    }

    // Se não encontrou corretas pelo regex específico, tenta ver se a última linha tem apenas uma letra
    if (!correctId && lines.length > 0) {
       const lastLine = lines[lines.length - 1];
       if (/^[A-E]$/i.test(lastLine)) {
          correctId = lastLine.toUpperCase();
          options = options.map(opt => ({
            ...opt,
            isCorrect: opt.id === correctId
          }));
       }
    }

    // Função auxiliar para padronizar e envolver em LaTeX se necessário
    const formatLatex = (text: string) => {
      text = text.trim();
      // Se já tem $, apenas padroniza removendo espaços
      if (text.includes('$')) {
        return text.replace(/\$\s*(.+?)\s*\$/g, '$$$1$');
      }
      // Se parecer conteúdo matemático (números, sinais, frações simples, variáveis isoladas)
      // envolve em $ para manter a consistência visual moderna
      if (/^[\d.,+\-*/^()=<>a-zA-Z\s]+$/.test(text) && text.length > 0) {
        // Se parecer conteúdo matemático (números, sinais, frações simples, variáveis isoladas)
        // envolve em $ para manter a consistência visual moderna
        const isLikelyMath = text.split(' ').length <= 3 || /[\d+\-*/^=<>]+/.test(text);
        if (isLikelyMath) {
          // Escapa espaços para que o KaTeX os renderize corretamente em modo matemático
          const escapedText = text.replace(/ /g, '\\ ');
          return `$${escapedText}$`;
        }
      }
      return text;
    };

    const questionText = formatLatex(questionTextLines.join('\n'));

    // Tenta encontrar resolução no texto completo se houver a palavra chave
    let resolution = '';
    const resMatch = smartInput.match(resolutionRegex);
    if (resMatch) {
      resolution = formatLatex(resMatch[1].trim());
    }

    setCurrentQuestion({
      id: Math.random().toString(36).substring(7),
      text: questionText,
      options: options.length > 0 ? options.map(opt => ({
        ...opt,
        text: formatLatex(opt.text)
      })) : [
        { id: 'A', text: '', isCorrect: false },
        { id: 'B', text: '', isCorrect: false },
        { id: 'C', text: '', isCorrect: false },
        { id: 'D', text: '', isCorrect: false },
        { id: 'E', text: '', isCorrect: false },
      ],
      explanation: '',
      resolution: resolution
    });
    
    setSmartInput('');
    setShowSmartParser(false);
    onShowToast('Questão processada com sucesso!');
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text) {
      onShowToast('A primeira pergunta precisa de texto!');
      return;
    }
    setSimulado(prev => ({
      ...prev,
      questions: [...(prev.questions || []), currentQuestion]
    }));
    setCurrentQuestion({
      id: Math.random().toString(36).substring(7),
      text: '',
      options: [
        { id: 'A', text: '', isCorrect: false },
        { id: 'B', text: '', isCorrect: false },
        { id: 'C', text: '', isCorrect: false },
        { id: 'D', text: '', isCorrect: false },
        { id: 'E', text: '', isCorrect: false },
      ],
      explanation: '',
      resolution: ''
    });
  };

  const handleSave = async () => {
    if (!simulado.title || !simulado.disciplineId) {
      onShowToast('Título e Disciplina são obrigatórios!');
      return;
    }

    try {
      if (editingSimulado?.id) {
        await SupabaseService.updateSimulado(editingSimulado.id, simulado);
        onShowToast('Simulado/Lista atualizado com sucesso!');
      } else {
        await SupabaseService.createSimulado({
          ...simulado,
          teacherEmail: teacherEmail
        });
        onShowToast('Simulado/Lista criado com sucesso!');
      }
      onSave();
    } catch (error) {
      console.error(error);
      onShowToast('Erro ao salvar simulado.');
    }
  };

  const components = {
    // Custom renderers for LaTeX if needed, but rehypeKatex handles it
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white overflow-hidden rounded-[2.5rem] border border-slate-800">
      {/* Header */}
      <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
            <Plus size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black">{editingSimulado ? 'Editar' : 'Novo'} {simulado.type === 'SIMULADO' ? 'Simulado' : 'Lista de Exercícios'}</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{editingSimulado ? 'Atualizando' : 'Criação de'} Conteúdo Acadêmico</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="p-3 hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar Steps */}
        <div className="w-64 border-r border-slate-800 p-6 space-y-4 bg-slate-900/20">
          {[
            { id: 1, label: 'Informações Básicas', icon: BookOpen },
            { id: 2, label: 'Questões', icon: Layers },
            { id: 3, label: 'Revisão Final', icon: CheckCircle2 },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
                step === s.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:bg-white/5'
              }`}
            >
              <s.icon size={18} />
              <span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10">
          {step === 1 && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Atividade</label>
                  <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => setSimulado({...simulado, type: 'SIMULADO'})}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${simulado.type === 'SIMULADO' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      Simulado
                    </button>
                    <button 
                      onClick={() => setSimulado({...simulado, type: 'LISTA'})}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${simulado.type === 'LISTA' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      Lista
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Disciplina</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                    value={simulado.disciplineId}
                    onChange={(e) => setSimulado({...simulado, disciplineId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título da Atividade</label>
                <input 
                  type="text"
                  placeholder="Ex: Simulado Mensal - Cálculo 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  value={simulado.title}
                  onChange={(e) => setSimulado({...simulado, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conteúdo / Tópico</label>
                <input 
                  type="text"
                  placeholder="Ex: Funções, Limites e Derivadas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  value={simulado.contentTopic}
                  onChange={(e) => setSimulado({...simulado, contentTopic: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo Total (minutos)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-sm font-bold text-white"
                      value={simulado.durationMinutes}
                      onChange={(e) => setSimulado({...simulado, durationMinutes: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <button 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  Continuar para Questões <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex gap-10 h-full animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Question Editor */}
              <div className="flex-1 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest">Questão #{ (simulado.questions?.length || 0) + 1 }</h4>
                    <button 
                      onClick={() => setShowSmartParser(!showSmartParser)}
                      className="px-3 py-1.5 bg-sky-500/10 text-sky-500 rounded-lg text-[10px] font-black uppercase border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                    >
                      Wizard Parser ⚡
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsPreview(!isPreview)}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-white uppercase transition-all"
                  >
                    {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
                    {isPreview ? 'Editar' : 'Preview'}
                  </button>
                </div>

                {showSmartParser ? (
                  <div className="space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl space-y-2">
                       <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Smart Parser ⚡</p>
                       <p className="text-[9px] text-sky-400/60 leading-relaxed italic">Cole o texto completo (Enunciado + Alternativas A-E + Gabarito). O sistema tentará identificar tudo automaticamente.</p>
                    </div>
                    <textarea 
                      placeholder="Cole aqui. Exemplo:&#10;Sabendo que a matriz A é...&#10;A) -8&#10;B) 9&#10;...&#10;Alternativa correta: C"
                      className="w-full h-64 bg-slate-950 border border-sky-500/30 rounded-3xl p-6 text-sm font-medium text-white focus:ring-2 focus:ring-sky-500/20 transition-all resize-none shadow-[0_0_20px_rgba(14,165,233,0.1)]"
                      value={smartInput}
                      onChange={(e) => setSmartInput(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={parseSmartInput}
                        className="flex-1 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                      >
                        Processar e Preencher
                      </button>
                      <button 
                        onClick={() => setShowSmartParser(false)}
                        className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {isPreview ? (
                      <div className="w-full p-8 bg-slate-950/50 border border-slate-800 rounded-3xl min-h-[200px] prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                        >
                          {currentQuestion.text || '_Nenhum texto inserido..._'}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <textarea 
                          placeholder="Escreva a questão em Markdown... Use $ \frac{1}{2} $ para LaTeX"
                          className="w-full h-48 bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm font-medium text-white focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                          value={currentQuestion.text}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                        />
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setCurrentQuestion(prev => ({...prev, text: prev.text + ' $...$ '}))}
                             className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-black text-slate-300 rounded-lg transition-all"
                           >
                             <Sigma size={12} /> Inserir LaTeX
                           </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alternativas</label>
                  {currentQuestion.options.map((opt, idx) => (
                    <div key={opt.id} className="flex gap-3 group">
                      <button 
                        onClick={() => {
                          const newOpts = currentQuestion.options.map(o => ({...o, isCorrect: o.id === opt.id}));
                          setCurrentQuestion({...currentQuestion, options: newOpts});
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all border ${
                          opt.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-emerald-500/30'
                        }`}
                      >
                        {opt.id}
                      </button>
                      <input 
                        type="text"
                        placeholder={`Texto da alternativa ${opt.id}...`}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...currentQuestion.options];
                          newOpts[idx].text = e.target.value;
                          setCurrentQuestion({...currentQuestion, options: newOpts});
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolução / Explicação</label>
                  <textarea 
                    placeholder="Explique o passo a passo da resolução aqui..."
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-medium text-white focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                    value={currentQuestion.resolution}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, resolution: e.target.value})}
                  />
                  <p className="text-[9px] text-gray-500 italic">Este conteúdo aparecerá para o aluno após a conclusão do simulado.</p>
                </div>

                <button 
                  onClick={handleAddQuestion}
                  className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  <Plus size={16} className="inline mr-2 mb-0.5" /> Adicionar Questão à Lista
                </button>
              </div>

              {/* Added Questions List */}
              <div className="w-80 bg-slate-950/30 rounded-3xl border border-slate-800 p-6 flex flex-col">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Questões Salvas ({simulado.questions?.length})</h4>
                <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                  {simulado.questions?.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex justify-between items-center group">
                      <span className="text-xs font-bold text-white">#{idx + 1} - {q.text.substring(0, 20)}...</span>
                      <button 
                        onClick={() => setSimulado({...simulado, questions: simulado.questions?.filter(sq => sq.id !== q.id)})}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(!simulado.questions || simulado.questions.length === 0) && (
                    <div className="text-center py-10 opacity-20">
                      <Layers size={40} className="mx-auto mb-2" />
                      <p className="text-[8px] font-black uppercase tracking-widest">Nenhuma questão</p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!simulado.questions || simulado.questions.length === 0}
                  className="mt-6 w-full py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Revisar Simulado <ChevronRight size={16} className="inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total de Questões</p>
                  <h4 className="text-3xl font-black text-white">{simulado.questions?.length}</h4>
                </div>
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tempo Estipulado</p>
                  <h4 className="text-3xl font-black text-white">{simulado.durationMinutes} min</h4>
                </div>
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Média por Questão</p>
                  <h4 className="text-3xl font-black text-white">
                    {Math.round((simulado.durationMinutes || 0) / (simulado.questions?.length || 1))} min
                  </h4>
                </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest">Resumo Visual das Questões</h4>
                 <div className="space-y-6">
                   {simulado.questions?.map((q, idx) => (
                     <div key={q.id} className="p-8 bg-slate-950/30 border border-slate-800 rounded-[2rem] space-y-6">
                        <div className="flex justify-between items-center">
                           <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase">Questão #{idx + 1}</span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {q.text}
                          </ReactMarkdown>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                           {q.options.map((opt: any) => (
                             <div key={opt.id} className={`p-4 rounded-xl text-xs font-bold border transition-all flex items-start gap-3 ${opt.isCorrect ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}>
                                <span className="flex-shrink-0 font-black">{opt.id})</span>
                                <div className="prose prose-invert prose-sm max-w-none -mt-1">
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {opt.text}
                                  </ReactMarkdown>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="flex justify-between pt-10 pb-20">
                <button 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black transition-all"
                >
                  <ChevronLeft size={20} /> Voltar para Edição
                </button>
                 <button 
                   onClick={handleSave}
                   className="flex items-center gap-3 px-12 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl font-black transition-all shadow-[0_10px_40px_rgba(16,185,129,0.4)] active:scale-95"
                 >
                   <Save size={24} /> {editingSimulado ? 'Salvar Alterações' : 'Criar Repositório Final'}
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
