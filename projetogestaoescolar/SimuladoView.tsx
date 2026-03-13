import React, { useState } from 'react';
import { 
  FileCheck, 
  Timer, 
  Award, 
  Play, 
  Plus, 
  Clock, 
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { UserRole } from './types';

interface SimuladoViewProps {
  onShowToast: (msg: string) => void;
  userEmail: string;
  userRole: UserRole;
  userName: string;
}

export const SimuladoView: React.FC<SimuladoViewProps> = ({ onShowToast, userRole, userName }) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE' | 'SOLVING'>('LIST');
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Mock de simulado para demonstração da UI
  const mockSimulado = {
    title: "Simulado de Matemática - Logaritmos e Funções",
    questions: [
      { id: 1, text: "Qual o valor de log10(100)?", options: ["1", "2", "3", "10"], timeLimit: 60 },
      { id: 2, text: "Se f(x) = 2x + 3, qual o valor de f(5)?", options: ["10", "13", "15", "8"], timeLimit: 45 }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Simulados</h1>
          <p className="text-gray-400">Avaliações Personalizadas para seus alunos</p>
        </div>
        {activeTab === 'LIST' && (userRole === UserRole.COORDINATOR || userRole === UserRole.TEACHER) && (
          <button 
            onClick={() => setActiveTab('CREATE')}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} />
            Novo Simulado
          </button>
        )}
      </div>

      {activeTab === 'LIST' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#1e293b] rounded-2xl border border-gray-700 p-6 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <FileCheck className="text-blue-500" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-800 px-2 py-1 rounded">2 Questões</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Matemática - Introdução</h3>
            <p className="text-gray-400 text-sm mb-6 line-clamp-2">Revisão inicial sobre conjuntos e lógica para nivelamento.</p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={14} /> 20 min
              </div>
              <button 
                onClick={() => setActiveTab('SOLVING')}
                className="text-xs font-bold text-emerald-500 flex items-center gap-1 hover:underline"
              >
                Começar <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SOLVING' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-[#1e293b] rounded-2xl border border-gray-700 p-8 shadow-2xl relative overflow-hidden">
            <div className="h-1 bg-gray-800 absolute top-0 left-0 w-full">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${((currentQuestion + 1) / mockSimulado.questions.length) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Questão {currentQuestion + 1} de {mockSimulado.questions.length}</span>
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold">
                <Timer size={14} />
                01:45
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-10 leading-relaxed">
              {mockSimulado.questions[currentQuestion].text}
            </h2>

            <div className="space-y-4 mb-10">
              {mockSimulado.questions[currentQuestion].options.map((opt, i) => (
                <button 
                  key={i}
                  className="w-full p-4 rounded-xl border border-gray-700 bg-[#0f172a] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-emerald-500/20 group-hover:text-emerald-500">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-gray-300 font-medium">{opt}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-800">
              <button 
                onClick={() => currentQuestion > 0 && setCurrentQuestion(q => q - 1)}
                className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors ${currentQuestion === 0 ? 'opacity-0 pointer-events-none' : ''}`}
              >
                <ChevronLeft size={20} /> Anterior
              </button>
              <button 
                onClick={() => {
                  if (currentQuestion < mockSimulado.questions.length - 1) {
                    setCurrentQuestion(q => q + 1);
                  } else {
                    onShowToast("Simulado finalizado com sucesso!");
                    setActiveTab('LIST');
                  }
                }}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-xl active:scale-95"
              >
                {currentQuestion < mockSimulado.questions.length - 1 ? 'Próxima' : 'Finalizar'} <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-yellow-500 shrink-0" size={20} />
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              <strong>Atenção:</strong> Você tem apenas uma chance para realizar este simulado. Se sair da página, o progresso será salvo e você não poderá refazer sem autorização do professor.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'CREATE' && (
        <div className="max-w-2xl mx-auto bg-[#1e293b] rounded-2xl border border-gray-700 shadow-2xl p-8 mb-20 animate-in fade-in slide-in-from-bottom-4">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white">Criar Novo Simulado</h2>
              <button onClick={() => setActiveTab('LIST')} className="text-gray-500 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
           </div>
           
           <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título do Simulado</label>
                <input 
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Teorema de Pitágoras - Nível Médio"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Instruções para o Aluno</label>
                <textarea 
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none h-24"
                  placeholder="Ex: Leia atentamente antes de responder..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Questões</h4>
                  <button className="flex items-center gap-1 text-xs font-bold text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-all">
                    <Plus size={14} /> Adicionar Questão
                  </button>
                </div>
                
                <div className="p-6 bg-[#0f172a] rounded-2xl border border-dashed border-gray-700 flex flex-col items-center justify-center text-center opacity-50">
                   <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon size={20} className="text-gray-500" />
                   </div>
                   <p className="text-sm text-gray-400">Adicione questões com textos, imagens e alternativas.</p>
                </div>
              </div>

              <div className="pt-6">
                <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-xl transition-all active:scale-95">
                  Salvar e Disponibilizar
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
