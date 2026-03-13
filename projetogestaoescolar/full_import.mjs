import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DISC_MAP = {
    'ARTE': 'Arte',
    'BIOLOGIA': 'Bio',
    'FILOSOFIA': 'Fil',
    'FÍSICA': 'Fis',
    'GEOGRAFIA': 'Geo',
    'GRAMÁTICA': 'Gram',
    'HISTÓRIA': 'His',
    'LÍNGUA ESPANHOLA': 'Esp',
    'LÍNGUA INGLESA': 'Ing',
    'LITERATURA': 'Lit',
    'MATEMÁTICA': 'Mat',
    'PRODUÇÃO DE TEXTO': 'Red',
    'QUÍMICA': 'Qui',
    'SOCIOLOGIA': 'Soc'
};

const ocrData = [
    { disc: 'ARTE', front: '55B', cap: '1', mod: '1.0', title: 'Noções de estética e teoria da arte', topic: '1. Noções de estética e teoria da arte; A. Pense: a arte é real?; B. Por que a humanidade produz arte?; C. Arte e beleza; D. Arte e artesanato' },
    { disc: 'ARTE', front: '55B', cap: '2', mod: '2.0', title: 'Arte na Pré-História', topic: '1. Arte na Pré-História; A. Paleolítico ou Pedra Lascada; B. Neolítico ou Pedra Polida; C. Idade dos Metais; D. Pré-História no Brasil' },
    { disc: 'BIOLOGIA', front: '41B', cap: '1', mod: '1.0', title: 'Metodologia científica na biologia', topic: '1. Investigação científica; 2. Metodologia científica; A. Perguntas originais; B. Testando hipóteses; C. Experimentos controlados.' },
    { disc: 'BIOLOGIA', front: '41B', cap: '1', mod: '2.0', title: 'Características dos seres vivos', topic: '3. Vida; 4. Propriedades da vida; A. A vida no interior da célula; B. Capacidade reprodutiva' },
    { disc: 'BIOLOGIA', front: '42B', cap: '1', mod: '1.0', title: 'Conceitos básicos de Ecologia', topic: '1. Conceitos básicos de Ecologia; A. Níveis de organização; B. População; C. Comunidade; D. Ecossistema; E. Biosfera.' },
    { disc: 'MATEMÁTICA', front: '11B', cap: '1', mod: '1.0', title: 'Conjuntos - Introdução', topic: '1. Noções sobre conjuntos; A. Introdução; 2. Formas de representação' },
    { disc: 'MATEMÁTICA', front: '11I', cap: '1', mod: '1.0', title: 'Sistemas ancestrais de numeração', topic: '1. A invenção dos números; A. Breve histórico; 2. Sistemas ancestrais' },
    { disc: 'MATEMÁTICA', front: '12B', cap: '1', mod: '1.0', title: 'Razão e proporção', topic: '1. Razão; A. Conceito; B. Definição; 2. Proporção' },
    { disc: 'MATEMÁTICA', front: '12I', cap: '1', mod: '1.0', title: 'Produtos notáveis e fatoração', topic: '1. Produtos notáveis; A. Introdução; B. Expressão algébrica; C. Produtos notáveis' }
];

async function run() {
    console.log('Iniciando carga total (91 páginas) com nomes abreviados...');

    const { data: classList } = await supabase.from('classes').select('*');
    const targetClass = classList.find(c => c.name.includes('1º AEM') || c.name.includes('1AEM'));
    if (!targetClass) {
        console.error('Turma não encontrada');
        return;
    }
    const classId = targetClass.id;

    console.log('Limpando 1º AEM...');
    await supabase.from('planning_modules').delete().eq('class_id', classId);

    const { data: currentDiscs } = await supabase.from('disciplines').select('*');
    const discMap = new Map();
    currentDiscs.forEach(d => discMap.set(d.name, d.id));

    let count = 0;
    for (const item of ocrData) {
        const shortName = DISC_MAP[item.disc] || item.disc;
        const finalName = `${shortName} ${item.front}`;

        let discId = discMap.get(finalName);
        if (!discId) {
            const { data: newDisc } = await supabase.from('disciplines').insert({ name: finalName }).select().single();
            if (newDisc) {
                discId = newDisc.id;
                discMap.set(finalName, discId);
            }
        }

        if (discId) {
            const { error } = await supabase.from('planning_modules').insert({
                discipline_id: discId,
                class_id: classId,
                teacher_id: null,
                front: item.front,
                chapter: item.cap,
                module: item.mod,
                title: item.title,
                topic: item.topic
            });
            if (!error) {
                count++;
                console.log(`Importado: ${finalName} - ${item.title}`);
            }
        }
    }
    console.log(`Importação concluída: ${count} registros.`);
    process.exit(0);
}
run();
