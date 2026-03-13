import React from 'react';
import {
    MessageSquare, Moon, Book,
    Zap, Save, RefreshCw, Check, X, Tag,
    Search, Bell, AlertCircle, ChevronDown, Calendar, FileText, Hand, Plus, Camera, Trash2, BookOpen, History, ArrowRight, Upload, Users
} from 'lucide-react';

// ============================================================================
// DUMMY DATA PARA DESIGN (Substitui o banco de dados)
// ============================================================================

const DUMMY_TEACHERS = [
    { id: 't1', name: 'Jonas Matemática' }
];

const DUMMY_CLASSES = [
    { id: 'c1', name: '1º Ano A', period: 'Matutino' }
];

const DUMMY_STUDENTS = [
    { id: 'std-1', name: 'Ana Silva', className: '1º Ano A', present: true, points: 10.0, counters: { talk: 0, bathroom: 0, sleep: 0, material: 1, activity: 3, homework: 1, participation: 0 }, justifiedAbsence: false, phoneConfiscated: false, notes: '' },
    { id: 'std-2', name: 'Carlos Santos', className: '1º Ano A', present: true, points: 8.5, counters: { talk: 1, bathroom: 0, sleep: 0, material: 1, activity: 2, homework: 1, participation: 1 }, justifiedAbsence: false, phoneConfiscated: true, notes: 'Estava jogando no celular' },
    { id: 'std-3', name: 'Beatriz Costa', className: '1º Ano A', present: false, points: 0.0, counters: { talk: 0, bathroom: 0, sleep: 0, material: 1, activity: 3, homework: 1, participation: 0 }, justifiedAbsence: true, phoneConfiscated: false, notes: '' },
    { id: 'std-4', name: 'Daniel Oliveira', className: '1º Ano A', present: true, points: 5.0, counters: { talk: 3, bathroom: 2, sleep: 1, material: 0, activity: 0, homework: 0, participation: 0 }, justifiedAbsence: false, phoneConfiscated: false, notes: '' },
];


export const DummyClassroomMonitor: React.FC = () => {
    // --- Esta versão foi limpa de lógicas complexas para facilitar a vida da IA de Design ---
    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-48 lg:pb-24 bg-gray-900 min-h-screen text-gray-100 font-sans p-6 rounded-xl">
            {/* Top Header Filter Bar */}
            <div className="sticky top-0 z-20 bg-[#0f172a] p-4 rounded-xl border border-gray-800 flex flex-col xl:flex-row justify-between items-center gap-4 shadow-lg">
                <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto">
                    <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1">Data</label>
                        <div className="relative">
                            <input
                                type="date"
                                defaultValue="2026-03-01"
                                className="bg-[#1e293b] text-white text-sm border border-gray-700 rounded-lg p-2 pl-8 outline-none focus:border-emerald-500"
                            />
                            <Calendar size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1">Professor</label>
                        <select
                            className="bg-[#1e293b] text-white text-sm border border-gray-700 rounded-lg p-2 outline-none focus:border-emerald-500 min-w-[150px]"
                        >
                            {DUMMY_TEACHERS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1">Turma</label>
                        <select
                            className="bg-[#1e293b] text-white text-sm border border-gray-700 rounded-lg p-2 outline-none focus:border-emerald-500 w-[120px]"
                        >
                            {DUMMY_CLASSES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1">Disciplina</label>
                        <select
                            className="bg-[#1e293b] text-white text-sm border border-gray-700 rounded-lg p-2 outline-none focus:border-emerald-500 w-[130px]"
                        >
                            <option value="Matemática">Matemática</option>
                        </select>
                    </div>
                    <div className="flex flex-col relative">
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1">Horário(s)</label>
                        <button
                            className="bg-[#1e293b] text-white text-sm border border-gray-700 rounded-lg p-2 outline-none focus:border-emerald-500 min-w-[180px] flex justify-between items-center text-left"
                        >
                            <span className="truncate">07h00 - 08h30 (2 aulas)</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Busca rápida..."
                            className="w-full bg-[#1e293b] border border-gray-700 text-gray-200 text-sm rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <button className="relative p-2 text-gray-400 hover:text-white">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>
                    </button>
                </div>
            </div>

            {/* Grid of Students */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {DUMMY_STUDENTS.map(student => {
                    return (
                        <div
                            key={student.id}
                            className={`
                                relative rounded-xl border transition-all duration-200 overflow-hidden flex flex-col
                                ${student.present
                                    ? 'bg-[#0f172a] border-gray-700 hover:border-emerald-500/50'
                                    : 'bg-[#0f172a] border-gray-800 opacity-60'}
                            `}
                        >
                            {/* Card Header */}
                            <div className="p-4 flex items-center justify-between border-b border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f172a] ${student.present ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-100 text-sm">
                                            {student.name}
                                            {student.present && (
                                                <span className={`ml-2 font-black ${student.points <= 5 ? 'text-red-500' : 'text-emerald-400'}`}>
                                                    ({student.points.toFixed(1)})
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-500">RA: 4492</p>
                                    </div>
                                </div>
                                {/* Observation Button */}
                                <button
                                    className={`hover:bg-gray-700 p-1.5 rounded-full transition-colors ${student.notes ? 'text-emerald-500' : 'text-gray-500'}`}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {/* Status Toggles Row */}
                            <div className="px-4 py-3 grid grid-cols-2 gap-4 border-b border-gray-800/50">
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Presença</label>
                                    <div className="flex bg-[#1e293b] rounded-lg p-0.5">
                                        <button
                                            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${student.present ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            SIM
                                        </button>
                                        <button
                                            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${!student.present ? 'bg-red-500/20 text-red-500' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            NÃO
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Celular</label>
                                    <div className="flex bg-[#1e293b] rounded-lg p-0.5">
                                        <button
                                            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${!student.phoneConfiscated ? 'bg-emerald-900/40 text-emerald-500 border border-emerald-500/30' : 'text-gray-400'}`}
                                        >
                                            NÃO
                                        </button>
                                        <button
                                            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${student.phoneConfiscated ? 'bg-red-500 text-white' : 'text-gray-400'}`}
                                        >
                                            SIM
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-2 border-b border-gray-800/50 bg-blue-500/5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] text-blue-400 font-bold uppercase">Presença (2ª Chamada)</label>
                                    <div className="flex bg-[#1e293b] rounded-lg p-0.5 w-[100px]">
                                        <button
                                            className={`flex-1 text-[9px] font-bold py-1 rounded-md transition-colors bg-blue-500 text-white shadow-sm`}
                                        >
                                            SIM
                                        </button>
                                        <button
                                            className={`flex-1 text-[9px] font-bold py-1 rounded-md transition-colors text-gray-400 hover:text-gray-200`}
                                        >
                                            NÃO
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Counters Grid */}
                            <div className="p-4 space-y-3 relative">
                                {!student.present && (
                                    <div className="absolute inset-0 bg-[#0f172a]/90 z-10 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
                                        <span className="text-gray-400 font-bold text-lg tracking-widest italic mb-2">AUSENTE</span>

                                        <button
                                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${student.justifiedAbsence
                                                ? 'bg-emerald-500 text-[#0f172a] border-emerald-500'
                                                : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'
                                                }`}
                                        >
                                            {student.justifiedAbsence ? 'FALTA JUSTIFICADA' : 'JUSTIFICAR FALTA'}
                                        </button>
                                        {student.justifiedAbsence && <span className="text-[10px] text-emerald-400 mt-1">Nota ajustada para 5,0</span>}
                                    </div>
                                )}

                                {student.present && student.points === 0 && (
                                    <div className="absolute inset-x-0 top-0 h-full bg-red-900/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px] p-4 text-center">
                                        <div className="bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg border border-red-400 animate-pulse">
                                            ALUNO ZEROU ESTA AULA
                                        </div>
                                        <span className="text-red-200 text-[9px] uppercase font-bold mt-2 tracking-wider">Pontuação mínima atingida</span>
                                    </div>
                                )}

                                {/* DUMMY ROWS FOR VISUALIZATION */}
                                <div className="flex items-center justify-between text-sm group">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <MessageSquare size={16} />
                                        <span>Conversa</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center transition-colors">-</button>
                                        <span className={`w-4 text-center font-bold text-gray-400`}>{student.counters.talk}</span>
                                        <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center transition-colors">+</button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm group">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <AlertCircle size={16} />
                                        <span>Banheiro</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center transition-colors">-</button>
                                        <span className={`w-4 text-center font-bold text-gray-400`}>{student.counters.bathroom}</span>
                                        <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center transition-colors">+</button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-sm group">
                                        <div className="flex items-center gap-2 text-gray-300"><Book size={16} /><span>Material</span></div>
                                        <div className="flex items-center gap-3">
                                            <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700">-</button>
                                            <span className={`w-4 text-center font-bold ${student.counters.material === 0 ? 'text-red-500' : 'text-emerald-500'}`}>{student.counters.material}</span>
                                            <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700">+</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm group">
                                        <div className="flex items-center gap-2 text-gray-300"><FileText size={16} /><span>Tarefas</span></div>
                                        <div className="flex items-center gap-3">
                                            <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700">-</button>
                                            <span className={`w-4 text-center font-bold ${student.counters.homework === 0 ? 'text-red-500' : 'text-emerald-500'}`}>{student.counters.homework}</span>
                                            <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700">+</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-sm group">
                                        <div className="flex items-center gap-2 text-gray-300"><Zap size={16} /><span>Atividade</span></div>
                                        <div className="flex items-center gap-3">
                                            <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700">-</button>
                                            <span className={`w-4 text-center font-bold ${student.counters.activity < 3 ? 'text-orange-400' : 'text-emerald-400'}`}>{student.counters.activity}</span>
                                            <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700">+</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm group">
                                        <div className="flex items-center gap-2 text-gray-300"><Hand size={16} /><span>Participação</span></div>
                                        <div className="flex items-center gap-3">
                                            <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700">-</button>
                                            <span className={`w-4 text-center font-bold ${student.counters.participation > 0 ? 'text-blue-400' : 'text-gray-500'}`}>{student.counters.participation}</span>
                                            <button className="w-6 h-6 rounded bg-[#1e293b] text-gray-400 hover:text-white hover:bg-gray-700">+</button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div >

            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center sm:justify-end mt-8">
                <button
                    className="flex-1 sm:flex-none min-w-[140px] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Plus size={18} />
                    Registrar Conteúdo
                </button>

                <button
                    className="flex-1 sm:flex-none min-w-[140px] px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <History size={18} />
                    Carregar Anterior
                </button>
                <button
                    className="flex-1 sm:flex-none min-w-[140px] px-4 py-2.5 bg-transparent border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <RefreshCw size={18} />
                    Nova Aula
                </button>
                <button
                    className="flex-1 sm:flex-none min-w-[120px] px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-[#0f172a] rounded-lg font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
                >
                    <Save size={18} />
                    Salvar Aula
                </button>
            </div>
        </div >
    );
};
export default DummyClassroomMonitor;
