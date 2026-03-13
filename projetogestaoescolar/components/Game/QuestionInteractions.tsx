import React, { useState, useRef } from 'react';
import { Question } from './gameData';
import { MathText } from './MathText';

interface InteractionProps {
    question: Question;
    onAnswerChange: (answer: string | number) => void;
    currentAnswer: string | number;
    disabled?: boolean;
}

// ---- Combo Match (2 colunas) ----
export const InteractionComboMatch: React.FC<InteractionProps> = ({ question, onAnswerChange, currentAnswer, disabled }) => {
    const [stateA, setStateA] = useState('');
    const [stateB, setStateB] = useState('');

    const select = (col: 'A' | 'B', id: string) => {
        if (disabled) return;
        const newA = col === 'A' ? id : stateA;
        const newB = col === 'B' ? id : stateB;
        if (col === 'A') setStateA(id); else setStateB(id);
        onAnswerChange(`${newA}-${newB}`);
    };

    return (
        <div className="grid grid-cols-2 gap-3 w-full">
            <div>
                <div className="text-center text-[#8bc34a] font-bold mb-2 text-sm border-b border-[#8bc34a]/40 pb-1">Equação Isolada</div>
                {question.optsA?.map(o => (
                    <button key={o.id} onClick={() => select('A', o.id)} disabled={disabled}
                        className={`w-full mb-2 px-2 py-3 rounded-lg text-sm text-center transition-all border cursor-pointer ${stateA === o.id ? 'bg-[#8bc34a] text-black font-bold border-[#8bc34a]' : 'bg-[#8bc34a]/10 text-white border-[#8bc34a]/30 hover:bg-[#8bc34a]/30'}`}>
                        <MathText text={o.val} />
                    </button>
                ))}
            </div>
            <div>
                <div className="text-center text-[#8bc34a] font-bold mb-2 text-sm border-b border-[#8bc34a]/40 pb-1">Resultado</div>
                {question.optsB?.map(o => (
                    <button key={o.id} onClick={() => select('B', o.id)} disabled={disabled}
                        className={`w-full mb-2 px-2 py-3 rounded-lg text-sm text-center transition-all border cursor-pointer ${stateB === o.id ? 'bg-[#8bc34a] text-black font-bold border-[#8bc34a]' : 'bg-[#8bc34a]/10 text-white border-[#8bc34a]/30 hover:bg-[#8bc34a]/30'}`}>
                        <MathText text={o.val} />
                    </button>
                ))}
            </div>
        </div>
    );
};

// ---- Combo 3 colunas ----
export const InteractionCombo3: React.FC<InteractionProps> = ({ question, onAnswerChange, disabled }) => {
    const [stateA, setStateA] = useState('');
    const [stateB, setStateB] = useState('');
    const [stateC, setStateC] = useState('');

    const select = (col: 'A' | 'B' | 'C', id: string) => {
        if (disabled) return;
        const newA = col === 'A' ? id : stateA;
        const newB = col === 'B' ? id : stateB;
        const newC = col === 'C' ? id : stateC;
        if (col === 'A') setStateA(id);
        else if (col === 'B') setStateB(id);
        else setStateC(id);
        onAnswerChange(`${newA}-${newB}-${newC}`);
    };

    const cols = [
        { key: 'A' as const, title: 'F. Normal', opts: question.optsA },
        { key: 'B' as const, title: 'Fórmula', opts: question.optsB },
        { key: 'C' as const, title: 'F. Atrito', opts: question.optsC },
    ];
    const states = { A: stateA, B: stateB, C: stateC };

    return (
        <div className="grid grid-cols-3 gap-2 w-full">
            {cols.map(({ key, title, opts }) => (
                <div key={key}>
                    <div className="text-center text-[#8bc34a] font-bold mb-2 text-xs border-b border-[#8bc34a]/40 pb-1">{title}</div>
                    {opts?.map(o => (
                        <button key={o.id} onClick={() => select(key, o.id)} disabled={disabled}
                            className={`w-full mb-2 px-1 py-2 rounded-lg text-xs text-center transition-all border ${states[key] === o.id ? 'bg-[#8bc34a] text-black font-bold border-[#8bc34a]' : 'bg-[#8bc34a]/10 text-white border-[#8bc34a]/30 hover:bg-[#8bc34a]/30'}`}>
                            <MathText text={o.val} />
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
};

// ---- Slider ----
export const InteractionSlider: React.FC<InteractionProps> = ({ question, onAnswerChange, currentAnswer, disabled }) => {
    const max = question.id === 9 ? 10 : 150;
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <input type="range" min={0} max={max} step={1} value={Number(currentAnswer) || 0}
                onChange={e => onAnswerChange(Number(e.target.value))} disabled={disabled}
                className="w-4/5 accent-[#8bc34a] cursor-pointer h-3 rounded-full" />
            <span className="text-[#8bc34a] font-bold text-2xl">{currentAnswer || 0} {question.unit}</span>
        </div>
    );
};

// ---- Stepper ----
export const InteractionStepper: React.FC<InteractionProps> = ({ question, onAnswerChange, currentAnswer, disabled }) => {
    const val = Number(currentAnswer) || 0;
    const btn = (label: string, delta: number) => (
        <button onClick={() => onAnswerChange(val + delta)} disabled={disabled}
            className="bg-[#8bc34a]/20 text-white border border-[#8bc34a]/50 px-5 py-3 rounded-xl font-bold text-lg hover:bg-[#8bc34a]/40 transition disabled:opacity-50">
            {label}
        </button>
    );
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3">
                {btn('- 10', -10)}{btn('- 1', -1)}{btn('+ 1', 1)}{btn('+ 10', 10)}
            </div>
            <span className="text-[#8bc34a] font-bold text-3xl">{val} {question.unit}</span>
        </div>
    );
};

// ---- Keypad ----
export const InteractionKeypad: React.FC<InteractionProps> = ({ question, onAnswerChange, currentAnswer, disabled }) => {
    const val = String(currentAnswer);
    const append = (n: number) => { if (disabled) return; onAnswerChange(val + n); };
    const clear = () => onAnswerChange('');
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="text-[#8bc34a] font-bold text-2xl mb-2 bg-black/40 px-6 py-2 rounded-xl min-w-[120px] text-center border border-[#8bc34a]/40">
                {val || '—'} {question.unit}
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button key={n} onClick={() => append(n)} disabled={disabled}
                        className="w-14 h-14 bg-[#8bc34a]/15 border border-[#8bc34a]/30 rounded-xl text-white text-xl font-bold hover:bg-[#8bc34a]/35 transition">
                        {n}
                    </button>
                ))}
                <button onClick={clear} disabled={disabled}
                    className="w-14 h-14 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold hover:bg-red-500/40 transition">
                    C
                </button>
                <button onClick={() => append(0)} disabled={disabled}
                    className="w-14 h-14 bg-[#8bc34a]/15 border border-[#8bc34a]/30 rounded-xl text-white text-xl font-bold hover:bg-[#8bc34a]/35 transition">
                    0
                </button>
            </div>
        </div>
    );
};

// ---- Dial Lock ----
export const InteractionDialLock: React.FC<InteractionProps> = ({ question, onAnswerChange, disabled }) => {
    const digits = question.digits || 4;
    const [dials, setDials] = useState<number[]>(Array(digits).fill(0));
    const change = (i: number, dir: number) => {
        if (disabled) return;
        const next = [...dials];
        next[i] = (next[i] + dir + 10) % 10;
        setDials(next);
        onAnswerChange(next.join(''));
    };
    return (
        <div className="flex gap-4 justify-center">
            {dials.map((d, i) => (
                <div key={i} className="flex flex-col items-center bg-black/50 p-3 rounded-xl border border-[#8bc34a]/40 w-16">
                    <button onClick={() => change(i, 1)} disabled={disabled} className="text-[#8bc34a] text-2xl font-bold hover:text-white transition">▲</button>
                    <span className="text-[#8bc34a] text-3xl font-black my-2">{d}</span>
                    <button onClick={() => change(i, -1)} disabled={disabled} className="text-[#8bc34a] text-2xl font-bold hover:text-white transition">▼</button>
                </div>
            ))}
        </div>
    );
};

// ---- Stack (empilhar blocos) ----
export const InteractionStack: React.FC<InteractionProps> = ({ onAnswerChange, currentAnswer, disabled }) => {
    const count = Number(currentAnswer) || 0;
    const add = () => { if (disabled) return; onAnswerChange(count + 100); };
    const clear = () => onAnswerChange(0);
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3">
                <button onClick={add} disabled={disabled} className="bg-[#8bc34a] text-black font-bold px-5 py-3 rounded-xl hover:brightness-110 transition disabled:opacity-50">+ 100 N</button>
                <button onClick={clear} disabled={disabled} className="bg-red-600 text-white font-bold px-5 py-3 rounded-xl hover:brightness-110 transition disabled:opacity-50">Zerar</button>
            </div>
            <div className="flex flex-col-reverse gap-1 h-28 justify-start items-center">
                {Array.from({ length: Math.min(count / 100, 12) }).map((_, i) => (
                    <div key={i} className="w-28 h-4 rounded bg-gradient-to-r from-[#2e7d32] to-[#8bc34a]" />
                ))}
            </div>
            <span className="text-[#8bc34a] font-bold text-2xl">{count} N</span>
        </div>
    );
};

// ---- Hold (segurar botão) ----
export const InteractionHold: React.FC<InteractionProps> = ({ question, onAnswerChange, currentAnswer, disabled }) => {
    const fillRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const val = Number(currentAnswer) || 0;
    const start = () => {
        if (disabled || val >= 100) return;
        fillRef.current = setInterval(() => {
            onAnswerChange(Math.min(val + 1, 100));
        }, 50);
    };
    const stop = () => { if (fillRef.current) clearInterval(fillRef.current); };
    return (
        <div className="flex flex-col items-center gap-4">
            <button onMouseDown={start} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchEnd={stop}
                disabled={disabled}
                className="w-44 h-14 bg-[#2e7d32] text-white font-black text-lg rounded-full hover:brightness-110 transition disabled:opacity-50 select-none">
                SEGURE
            </button>
            <div className="w-56 h-6 border-2 border-[#8bc34a] rounded-full overflow-hidden bg-black/50">
                <div style={{ width: `${val}%` }} className="h-full bg-gradient-to-r from-[#2e7d32] to-[#8bc34a] transition-all" />
            </div>
            <span className="text-[#8bc34a] font-bold text-xl">{val} {question.unit}</span>
        </div>
    );
};

// ---- Checkboxes ----
export const InteractionCheckboxes: React.FC<InteractionProps> = ({ onAnswerChange, currentAnswer, disabled }) => {
    const count = Number(currentAnswer) || 0;
    const [checked, setChecked] = useState<boolean[]>(Array(16).fill(false));
    const toggle = (i: number) => {
        if (disabled) return;
        const next = [...checked];
        next[i] = !next[i];
        setChecked(next);
        onAnswerChange(next.filter(Boolean).length);
    };
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="grid grid-cols-4 gap-3 bg-black/40 p-4 rounded-xl">
                {checked.map((c, i) => (
                    <input key={i} type="checkbox" checked={c} onChange={() => toggle(i)} disabled={disabled}
                        className="w-9 h-9 accent-[#8bc34a] cursor-pointer rounded" />
                ))}
            </div>
            <span className="text-[#8bc34a] font-bold text-2xl">{count} marcados</span>
        </div>
    );
};

// ---- Tilt (rampa inclinável) ----
export const InteractionTilt: React.FC<InteractionProps> = ({ question, onAnswerChange, currentAnswer, disabled }) => {
    const [angle, setAngle] = useState(0);
    const val = Number(currentAnswer) || 0;
    const tilt = (dir: number) => {
        if (disabled) return;
        setAngle(a => a + dir * 5);
        onAnswerChange(val + dir);
    };
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3">
                <button onClick={() => tilt(1)} disabled={disabled} className="bg-[#8bc34a]/20 text-white border border-[#8bc34a]/50 px-5 py-3 rounded-xl font-bold hover:bg-[#8bc34a]/40 transition">Inclinar ⬆</button>
                <button onClick={() => tilt(-1)} disabled={disabled} className="bg-[#8bc34a]/20 text-white border border-[#8bc34a]/50 px-5 py-3 rounded-xl font-bold hover:bg-[#8bc34a]/40 transition">Descer ⬇</button>
            </div>
            <div style={{ transform: `rotate(${angle}deg)`, transition: '0.3s transform' }}
                className="w-48 h-4 bg-gradient-to-r from-[#2e7d32] to-[#8bc34a] rounded-full" />
            <span className="text-[#8bc34a] font-bold text-2xl">{val} {question.unit}</span>
        </div>
    );
};

// ---- Number ----
export const InteractionNumber: React.FC<InteractionProps> = ({ question, onAnswerChange, currentAnswer, disabled }) => (
    <div className="flex flex-col items-center gap-3">
        <input type="number" value={String(currentAnswer)} onChange={e => onAnswerChange(Number(e.target.value))}
            disabled={disabled}
            className="w-40 text-center text-3xl font-bold text-[#8bc34a] bg-black/80 border-2 border-[#8bc34a] rounded-xl px-4 py-3 outline-none" />
        <span className="text-gray-400 text-sm">{question.unit}</span>
    </div>
);

// ---- Equation Builder ----
export const InteractionEquationBuilder: React.FC<InteractionProps> = ({ question, onAnswerChange, currentAnswer, disabled }) => {
    const val = String(currentAnswer);
    const append = (p: string) => { if (disabled) return; onAnswerChange(val + p); };
    const clear = () => onAnswerChange('');
    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="bg-black/60 border border-[#8bc34a]/40 rounded-xl px-6 py-3 text-[#8bc34a] font-mono text-xl min-h-[52px] w-full text-center">
                {val || '____'}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {question.pieces?.map(p => (
                    <button key={p} onClick={() => append(p)} disabled={disabled}
                        className="bg-white/10 border border-[#8bc34a]/40 text-white text-lg font-bold px-4 py-2 rounded-lg hover:bg-[#8bc34a]/30 transition disabled:opacity-50">
                        {p}
                    </button>
                ))}
            </div>
            <button onClick={clear} disabled={disabled}
                className="bg-red-600/80 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-red-600 transition">
                Limpar Equação
            </button>
        </div>
    );
};

// ---- Fraction Combo ----
export const InteractionFractionCombo: React.FC<InteractionProps> = ({ onAnswerChange, currentAnswer, disabled }) => {
    const parts = String(currentAnswer).split('/');
    const [num, setNum] = useState(parts[0] || '');
    const [den, setDen] = useState(parts[1] || '');
    const update = (n: string, d: string) => { setNum(n); setDen(d); onAnswerChange(`${n}/${d}`); };
    return (
        <div className="flex flex-col items-center gap-2">
            <input type="number" value={num} onChange={e => update(e.target.value, den)} disabled={disabled}
                placeholder="Ciclos"
                className="w-28 text-center text-3xl font-bold text-[#8bc34a] bg-black/80 border-b-0 border-2 border-[#8bc34a] rounded-t-xl px-4 py-3 outline-none" />
            <div className="w-32 h-1 bg-[#8bc34a] rounded" />
            <input type="number" value={den} onChange={e => update(num, e.target.value)} disabled={disabled}
                placeholder="Tempo"
                className="w-28 text-center text-3xl font-bold text-[#8bc34a] bg-black/80 border-t-0 border-2 border-[#8bc34a] rounded-b-xl px-4 py-3 outline-none" />
        </div>
    );
};

// ---- Factory: retorna o componente correto para cada tipo ----
export const QuestionInteraction: React.FC<InteractionProps> = (props) => {
    const { question } = props;
    switch (question.type) {
        case 'combo-match': return <InteractionComboMatch {...props} />;
        case 'combo-3': return <InteractionCombo3 {...props} />;
        case 'slider': return <InteractionSlider {...props} />;
        case 'stepper': return <InteractionStepper {...props} />;
        case 'keypad': return <InteractionKeypad {...props} />;
        case 'dial-lock': return <InteractionDialLock {...props} />;
        case 'stack': return <InteractionStack {...props} />;
        case 'hold': return <InteractionHold {...props} />;
        case 'checkboxes': return <InteractionCheckboxes {...props} />;
        case 'tilt': return <InteractionTilt {...props} />;
        case 'number': return <InteractionNumber {...props} />;
        case 'equation-builder': return <InteractionEquationBuilder {...props} />;
        case 'fraction-combo': return <InteractionFractionCombo {...props} />;
        default: return <div className="text-gray-400">Tipo de interação não suportado</div>;
    }
};
