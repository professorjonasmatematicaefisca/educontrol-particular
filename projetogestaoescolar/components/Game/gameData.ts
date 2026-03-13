export type QuestionType =
  | 'combo-match'
  | 'combo-3'
  | 'slider'
  | 'stepper'
  | 'keypad'
  | 'dial-lock'
  | 'stack'
  | 'hold'
  | 'checkboxes'
  | 'tilt'
  | 'number'
  | 'equation-builder'
  | 'fraction-combo';

export interface ComboOption {
  id: string;
  val: string;
}

export interface Question {
  id: number;
  title: string;
  type: QuestionType;
  unit: string;
  init: string | number;
  banner: string;
  emoji: string;
  text: string;
  correct: string | number;
  hint: string;
  res: string;
  // combo-match and combo-3
  optsA?: ComboOption[];
  optsB?: ComboOption[];
  optsC?: ComboOption[];
  // dial-lock
  digits?: number;
  // equation-builder
  pieces?: string[];
}

export const questions: Question[] = [
  {
    id: 1,
    title: '1. O Vazio do Meteor (Queda Livre)',
    type: 'combo-match',
    unit: '',
    init: '',
    banner: 'linear-gradient(135deg, #2e7d32 0%, #8bc34a 100%)',
    emoji: '🚀⬇️',
    text: 'A gravidade (10 m/s²) me puxa. Minha queda livre dura 3 segundos. Qual a combinação correta da equação e da altura final?',
    optsA: [
      { id: 'a1', val: '\\( h = g \\cdot t \\)' },
      { id: 'a2', val: '\\( h = \\frac{g \\cdot t^2}{2} \\)' },
      { id: 'a3', val: '\\( h = \\frac{g^2 \\cdot t}{2} \\)' },
      { id: 'a4', val: '\\( h = 2g \\cdot t^2 \\)' },
    ],
    optsB: [
      { id: 'b1', val: '15 m' },
      { id: 'b2', val: '30 m' },
      { id: 'b3', val: '45 m' },
      { id: 'b4', val: '60 m' },
    ],
    correct: 'a2-b3',
    hint: '\\( h = \\frac{g \\cdot t^2}{2} \\)',
    res: '\\( h = \\frac{10 \\cdot 3^2}{2} = 45 \\text{ m} \\)',
  },
  {
    id: 2,
    title: '2. A Fúria do Kamikaze (Vel. Média)',
    type: 'stepper',
    unit: 'km/h',
    correct: 54,
    init: 0,
    banner: 'linear-gradient(135deg, #1b5e20 0%, #4caf50 100%)',
    emoji: '🎢⚡',
    text: 'Pista de 60m. Escorreguei em 4 segundos. Qual minha velocidade em km/h?',
    hint: '\\( V_m = \\frac{\\Delta S}{\\Delta t} \\times 3,6 \\)',
    res: '\\( V_m = \\frac{60}{4} = 15 \\text{ m/s} \\xrightarrow{\\times 3,6} 54 \\text{ km/h} \\)',
  },
  {
    id: 3,
    title: '3. Salto do Water Bomb (Lanç. Horizontal)',
    type: 'slider',
    unit: 'm',
    correct: 5,
    init: 0,
    banner: 'linear-gradient(135deg, #33691e 0%, #8bc34a 100%)',
    emoji: '💦🎯',
    text: 'Lançado a 5 m/s horizontalmente. Voei por 1 segundo. Qual a distância horizontal do impacto?',
    hint: '\\( d = v_x \\cdot t \\)',
    res: '\\( d = 5 \\cdot 1 = 5 \\text{ m} \\)',
  },
  {
    id: 4,
    title: '4. Arrancada do R4lly (Aceleração)',
    type: 'keypad',
    unit: 'm/s²',
    correct: 4,
    init: '',
    banner: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
    emoji: '🏁🏄‍♂️',
    text: 'Partindo do zero, atinjo 20 m/s em 5 segundos. Qual minha aceleração média?',
    hint: '\\( a = \\frac{\\Delta v}{\\Delta t} \\)',
    res: '\\( a = \\frac{20 - 0}{5} = 4 \\text{ m/s}^2 \\)',
  },
  {
    id: 5,
    title: '5. A Curva do Cyclone (Força Centrípeta)',
    type: 'dial-lock',
    unit: 'N',
    init: '0000',
    banner: 'linear-gradient(135deg, #004d40 0%, #cddc39 100%)',
    emoji: '🌀🔄',
    text: 'Looping de 4m de raio, massa 50kg, velocidade 10 m/s. Qual a Força Centrípeta? (Ajuste o cadeado)',
    digits: 4,
    correct: '1250',
    hint: '\\( F_{cp} = \\frac{m \\cdot v^2}{R} \\)',
    res: '\\( F_{cp} = \\frac{50 \\cdot 10^2}{4} = \\frac{5000}{4} = 1250 \\text{ N} \\)',
  },
  {
    id: 6,
    title: '6. Esmagamento do Vortex (Peso)',
    type: 'stack',
    unit: 'N',
    correct: 1200,
    init: 0,
    banner: 'linear-gradient(135deg, #1b5e20 0%, #81c784 100%)',
    emoji: '🌪️⚖️',
    text: 'Sinto 2 "g" de aceleração total no funil. Se tenho 60kg, qual meu peso aparente?',
    hint: '\\( P_{aparente} = m \\cdot (2 \\cdot g) \\)',
    res: '\\( P_{aparente} = 60 \\cdot 20 = 1200 \\text{ N} \\)',
  },
  {
    id: 7,
    title: '7. Balanço do Crazy Drop (Energia)',
    type: 'combo-match',
    unit: '',
    init: '',
    banner: 'linear-gradient(135deg, #2e7d32 0%, #9ccc65 100%)',
    emoji: '🛹📉',
    text: 'Caí de 12,8m de altura no half-pipe. Sem atrito, combine a fórmula isolada correta com a velocidade alcançada no fundo.',
    optsA: [
      { id: 'a1', val: '\\( v = \\frac{gh}{2} \\)' },
      { id: 'a2', val: '\\( v = g \\cdot h \\)' },
      { id: 'a3', val: '\\( v = \\sqrt{2gh} \\)' },
      { id: 'a4', val: '\\( v = \\sqrt{gh} \\)' },
    ],
    optsB: [
      { id: 'b1', val: '12.8 m/s' },
      { id: 'b2', val: '16 m/s' },
      { id: 'b3', val: '25.6 m/s' },
      { id: 'b4', val: '32 m/s' },
    ],
    correct: 'a3-b2',
    hint: '\\( E_p = E_c \\Rightarrow mgh = \\frac{mv^2}{2} \\)',
    res: '\\( 10 \\cdot 12,8 = \\frac{v^2}{2} \\Rightarrow v = \\sqrt{256} = 16 \\text{ m/s} \\)',
  },
  {
    id: 8,
    title: '8. Lazy River (Empuxo)',
    type: 'hold',
    unit: 'Litros',
    correct: 80,
    init: 0,
    banner: 'linear-gradient(135deg, #388e3c 0%, #aed581 100%)',
    emoji: '🍩🛶',
    text: 'Massa total de 80kg flutuando no rio. Qual o volume de água deslocado (em litros)?',
    hint: '\\( E = P \\Rightarrow d \\cdot V \\cdot g = m \\cdot g \\)',
    res: '\\( 1000 \\cdot V = 80 \\Rightarrow V = 0,08 \\text{ m}^3 = 80 \\text{ L} \\)',
  },
  {
    id: 9,
    title: '9. Wave Lagoon (Ondulatória)',
    type: 'slider',
    unit: 'm/s',
    correct: 3,
    init: 0,
    banner: 'linear-gradient(135deg, #43a047 0%, #d4e157 100%)',
    emoji: '🌊🏄‍♀️',
    text: 'Cristas a 6m de distância (comprimento). Pistão bate a 0,5 Hz. Qual a velocidade da onda?',
    hint: '\\( v = \\lambda \\cdot f \\)',
    res: '\\( v = 6 \\cdot 0,5 = 3 \\text{ m/s} \\)',
  },
  {
    id: 10,
    title: '10. Bubble Up (Atrito)',
    type: 'combo-3',
    unit: '',
    init: '',
    banner: 'linear-gradient(135deg, #2e7d32 0%, #cddc39 99%)',
    emoji: '🫧🧗‍♂️',
    text: 'Criança de 30kg no topo. Coeficiente de atrito 0,4. Combine a Força Normal, a Equação e a Força de Atrito final.',
    optsA: [
      { id: 'n1', val: 'N = 30 N' },
      { id: 'n2', val: 'N = 150 N' },
      { id: 'n3', val: 'N = 300 N' },
      { id: 'n4', val: 'N = 600 N' },
    ],
    optsB: [
      { id: 'eq1', val: '\\( F_{at} = \\mu + N \\)' },
      { id: 'eq2', val: '\\( F_{at} = \\mu \\cdot N \\)' },
      { id: 'eq3', val: '\\( F_{at} = \\frac{\\mu}{N} \\)' },
      { id: 'eq4', val: '\\( F_{at} = \\frac{N}{\\mu} \\)' },
    ],
    optsC: [
      { id: 'r1', val: 'Fat = 12 N' },
      { id: 'r2', val: 'Fat = 120 N' },
      { id: 'r3', val: 'Fat = 300 N' },
      { id: 'r4', val: 'Fat = 1200 N' },
    ],
    correct: 'n3-eq2-r2',
    hint: '\\( F_{atrito} = \\mu \\cdot Normal \\)',
    res: '\\( Normal = 30 \\cdot 10 = 300\\text{N} \\Rightarrow F_{at} = 0,4 \\cdot 300 = 120 \\text{ N} \\)',
  },
  {
    id: 11,
    title: '11. Space Bowl (Aceleração Centrípeta)',
    type: 'checkboxes',
    unit: 'm/s²',
    correct: 12,
    init: 0,
    banner: 'linear-gradient(135deg, #1b5e20 0%, #aed581 100%)',
    emoji: '🌀🕳️',
    text: 'Raio de 3m, velocidade constante de 6 m/s girando no ralo. Qual a aceleração centrípeta?',
    hint: '\\( a_{cp} = \\frac{v^2}{R} \\)',
    res: '\\( a_{cp} = \\frac{6^2}{3} = \\frac{36}{3} = 12 \\text{ m/s}^2 \\)',
  },
  {
    id: 12,
    title: '12. Kamikaze (Plano Inclinado)',
    type: 'tilt',
    unit: 'm/s²',
    correct: 8,
    init: 0,
    banner: 'linear-gradient(135deg, #33691e 0%, #cddc39 100%)',
    emoji: '📐🛹',
    text: 'Seno do ângulo de descida é 0,8. Sem atrito, qual a aceleração?',
    hint: '\\( a = g \\cdot \\sin(\\theta) \\)',
    res: '\\( a = 10 \\cdot 0,8 = 8 \\text{ m/s}^2 \\)',
  },
  {
    id: 13,
    title: '13. Kid\'s Lagoon (Calorimetria)',
    type: 'number',
    unit: 'MJ',
    correct: 20,
    init: 0,
    banner: 'linear-gradient(135deg, #2e7d32 0%, #dce775 100%)',
    emoji: '🌡️👶',
    text: '1.000 kg de água aquecidos em 5°C. Calor específico 4000 J/kg°C. Quantos Megajoules (MJ)?',
    hint: '\\( Q = m \\cdot c \\cdot \\Delta T \\)',
    res: '\\( Q = 1000 \\cdot 4000 \\cdot 5 = 20.000.000 \\text{ J} = 20 \\text{ MJ} \\)',
  },
  {
    id: 14,
    title: '14. Resgate Vortex (Trabalho)',
    type: 'equation-builder',
    unit: '',
    init: '',
    banner: 'linear-gradient(135deg, #1b5e20 0%, #8bc34a 100%)',
    emoji: '🛟⚙️',
    text: 'Energia inicial de 10.000 J. Final de 8.000 J. Clique nos blocos para montar a equação exata do Trabalho do atrito.',
    pieces: ['10000', '8000', '-', '+', '=', '/', '2000', '-2000', '18000'],
    correct: '8000-10000=-2000',
    hint: '\\( W = E_{final} - E_{inicial} \\)',
    res: '\\( W = 8000 - 10000 = -2000 \\text{ J} \\)',
  },
  {
    id: 15,
    title: '15. Motor Wave Lagoon (Frequência)',
    type: 'fraction-combo',
    unit: '',
    init: '?/?',
    banner: 'linear-gradient(135deg, #004d40 0%, #9ccc65 100%)',
    emoji: '⚙️⏱️',
    text: 'O motor da onda bate 15 vezes por minuto. Monte a fração correta para achar a frequência em Hertz.',
    correct: '15/60',
    hint: '\\( f = \\frac{\\text{Ciclos}}{\\Delta t \\text{ (segundos)}} \\)',
    res: '\\( f = \\frac{15}{60} = 0,25 \\text{ Hz} \\)',
  },
];
