// Fix script: cleanup duplicates, fix class_id in modules, rebuild
// run: node fix_all.mjs
import { supabase } from './scripts/supabase_helper.mjs';

// =====================================================================
// CONTENT DATA (All 91 pages - using FULL NAMES to match teacher assignment)
// Teacher Jonas has: subject = "Matemática 11B" → we use that exact name 
// =====================================================================
const data = [
    // Arte
    { disc: 'Arte 55B', front: '55B', cap: '1', mod: '1', title: 'Noções de estética e teoria da arte', topic: 'A. Pense: a arte é real?; B. Por que a humanidade produz arte?; C. Arte e beleza; D. Arte e artesanato' },
    { disc: 'Arte 55B', front: '55B', cap: '2', mod: '2', title: 'Arte na Pré-História', topic: 'A. Paleolítico; B. Neolítico; C. Idade dos Metais; D. Pré-História no Brasil' },
    { disc: 'Arte 55B', front: '55B', cap: '3', mod: '3', title: 'Arte na Mesopotâmia e no Egito', topic: 'A. Arte na Mesopotâmia; B. Arte egípcia' },
    { disc: 'Arte 55B', front: '55B', cap: '4', mod: '4', title: 'Arte grega', topic: 'A. Arquitetura; B. Pintura; C. Escultura' },
    { disc: 'Arte 55B', front: '55B', cap: '4', mod: '5', title: 'Arte romana', topic: 'A. Arquitetura; B. Escultura; C. Pintura' },
    // Biologia 41B
    { disc: 'Biologia 41B', front: '41B', cap: '1', mod: '1', title: 'Metodologia científica na biologia', topic: 'A. Investigação científica; B. Metodologia científica; C. Perguntas originais; D. Testando hipóteses' },
    { disc: 'Biologia 41B', front: '41B', cap: '1', mod: '2', title: 'Características dos seres vivos', topic: 'A. Vida; B. Propriedades da vida; C. A vida no interior da célula; D. Capacidade reprodutiva' },
    { disc: 'Biologia 41B', front: '41B', cap: '1', mod: '3', title: 'Níveis de organização dos seres vivos', topic: 'A. Átomo; B. Molécula; C. Organela; D. Célula; E. Tecido; F. Órgão; G. Sistema' },
    { disc: 'Biologia 41B', front: '41B', cap: '1', mod: '4', title: 'Equilíbrio, vida e energia', topic: 'A. Fundamentos da lógica da organização; B. Termodinâmica' },
    { disc: 'Biologia 41B', front: '41B', cap: '1', mod: '5', title: 'Origem dos seres vivos', topic: 'A. Teoria da geração espontânea; B. Teoria da biogênese' },
    // Biologia 42B
    { disc: 'Biologia 42B', front: '42B', cap: '1', mod: '1', title: 'Conceitos básicos de Ecologia', topic: 'A. Níveis de organização; B. População; C. Comunidade; D. Ecossistema' },
    { disc: 'Biologia 42B', front: '42B', cap: '1', mod: '2', title: 'Cadeias alimentares', topic: 'A. Cadeias alimentares; B. Teias alimentares' },
    { disc: 'Biologia 42B', front: '42B', cap: '1', mod: '3', title: 'Fluxo de energia', topic: 'A. Produtores; B. Consumidores; C. Decompositores' },
    // Biologia 43I
    { disc: 'Biologia 43I', front: '43I', cap: '1', mod: '1', title: 'Clima, água e solo', topic: 'A. Padrões climáticos globais; B. Influência regional no clima' },
    { disc: 'Biologia 43I', front: '43I', cap: '1', mod: '2', title: 'Biomas terrestres', topic: 'A. Floresta tropical; B. Savana; C. Deserto; D. Tundra' },
    // Filosofia 81B
    { disc: 'Filosofia 81B', front: '81B', cap: '1', mod: '1', title: 'Do mito à filosofia', topic: 'A. A originalidade da atitude filosófica; B. Pensamento racional' },
    { disc: 'Filosofia 81B', front: '81B', cap: '1', mod: '2', title: 'Os pré-socráticos', topic: 'A. Tales de Mileto; B. Anaxímenes; C. Heráclito; D. Parmênides' },
    // Física 21B
    { disc: 'Física 21B', front: '21B', cap: '1', mod: '1', title: 'Introdução ao estudo da Física', topic: 'A. Mecânica; B. Termodinâmica; C. Eletromagnetismo; D. Óptica' },
    { disc: 'Física 21B', front: '21B', cap: '1', mod: '2', title: 'Grandezas físicas e sistemas de unidades', topic: 'A. Grandezas fundamentais; B. Sistema Internacional de Unidades' },
    // Física 22B
    { disc: 'Física 22B', front: '22B', cap: '1', mod: '1', title: 'Introdução à óptica', topic: 'A. Conceito de luz; B. Velocidade da luz; C. Fontes de luz' },
    { disc: 'Física 22B', front: '22B', cap: '1', mod: '2', title: 'Reflexão e refração da luz', topic: 'A. Leis da reflexão; B. Leis da refração; C. Índice de refração' },
    // Física 23I
    { disc: 'Física 23I', front: '23I', cap: '1', mod: '1', title: 'Áreas da Física e outras ciências', topic: 'A. Física clássica e moderna; B. Relações com outras ciências' },
    // Geografia 70B
    { disc: 'Geografia 70B', front: '70B', cap: '1', mod: '1', title: 'O espaço geográfico', topic: 'A. Conceito de espaço geográfico; B. A relação homem-natureza' },
    { disc: 'Geografia 70B', front: '70B', cap: '1', mod: '2', title: 'Cartografia', topic: 'A. Escalas; B. Tipos de projeções; C. Interpretação de mapas' },
    // Gramática 51B
    { disc: 'Gramática 51B', front: '51B', cap: '1', mod: '1', title: 'Linguagem, língua, oralidade e escrita', topic: 'A. Língua e linguagem; B. Variação linguística' },
    { disc: 'Gramática 51B', front: '51B', cap: '1', mod: '2', title: 'Fonética e Fonologia', topic: 'A. Fonema e letra; B. Ditongos; C. Tritongos; D. Hiato' },
    // História 60B
    { disc: 'História 60B', front: '60B', cap: '1', mod: '1', title: 'As primeiras civilizações', topic: 'A. Mesopotâmia; B. Egito Antigo; C. Hebreus' },
    { disc: 'História 60B', front: '60B', cap: '1', mod: '2', title: 'Grécia Antiga', topic: 'A. Período Homérico; B. Período Arcaico; C. Período Clássico' },
    // Língua Inglesa 91B
    { disc: 'Língua Inglesa 91B', front: '91B', cap: '1', mod: '1', title: 'Unit 1 - Introduction', topic: 'A. Greetings; B. Introductions; C. Simple Present' },
    // Literatura 52B
    { disc: 'Literatura 52B', front: '52B', cap: '1', mod: '1', title: 'Trovadorismo', topic: 'A. Origem; B. Cantigas de amor; C. Cantigas de amigo; D. Cantigas de escárnio' },
    // Matemática 11B
    { disc: 'Matemática 11B', front: '11B', cap: '1', mod: '1', title: 'Conjuntos - Introdução', topic: 'A. Noções sobre conjuntos; B. Formas de representação; C. Diagrama de Euler-Venn' },
    { disc: 'Matemática 11B', front: '11B', cap: '1', mod: '2', title: 'Subconjuntos', topic: 'A. Subconjuntos; B. Relação de inclusão; C. Conjunto complementar' },
    { disc: 'Matemática 11B', front: '11B', cap: '1', mod: '3', title: 'Operações entre conjuntos', topic: 'A. União (ou reunião); B. Intersecção; C. Diferença' },
    { disc: 'Matemática 11B', front: '11B', cap: '2', mod: '4', title: 'Funções - Introdução', topic: 'A. Conceito de função; B. Domínio; C. Contradomínio; D. Imagem' },
    { disc: 'Matemática 11B', front: '11B', cap: '2', mod: '5', title: 'Função afim', topic: 'A. Definição; B. Gráfico; C. Coeficiente angular; D. Coeficiente linear' },
    { disc: 'Matemática 11B', front: '11B', cap: '2', mod: '6', title: 'Função quadrática', topic: 'A. Definição; B. Raízes; C. Vértice; D. Gráfico - parábola' },
    // Matemática 11I
    { disc: 'Matemática 11I', front: '11I', cap: '1', mod: '1', title: 'Sistemas ancestrais de numeração', topic: 'A. A invenção dos números; B. Sistemas ancestrais; C. Egípcio; D. Babilônico' },
    { disc: 'Matemática 11I', front: '11I', cap: '1', mod: '2', title: 'Algarismos indo-arábicos e sistema decimal', topic: 'A. Os algarismos indo-arábicos; B. Base de um sistema; C. Mudança de base' },
    { disc: 'Matemática 11I', front: '11I', cap: '2', mod: '3', title: 'Números naturais e operações', topic: 'A. Adição e subtração; B. Multiplicação; C. Divisão; D. Potenciação' },
    // Matemática 12B
    { disc: 'Matemática 12B', front: '12B', cap: '1', mod: '1', title: 'Razão e proporção', topic: 'A. Razão; B. Proporção; C. Constante de proporcionalidade' },
    { disc: 'Matemática 12B', front: '12B', cap: '1', mod: '2', title: 'Grandezas diretamente proporcionais', topic: 'A. Conceito; B. Tabela de proporcionalidade; C. Regra de três simples direta' },
    { disc: 'Matemática 12B', front: '12B', cap: '1', mod: '3', title: 'Grandezas inversamente proporcionais', topic: 'A. Conceito; B. Regra de três simples inversa' },
    // Matemática 12I
    { disc: 'Matemática 12I', front: '12I', cap: '1', mod: '1', title: 'Produtos notáveis', topic: 'A. Quadrado da soma; B. Quadrado da diferença; C. Produto da soma pela diferença' },
    { disc: 'Matemática 12I', front: '12I', cap: '1', mod: '2', title: 'Fatoração', topic: 'A. Fator comum; B. Agrupamento; C. Trinômio quadrado perfeito' },
    // Química 31B
    { disc: 'Química 31B', front: '31B', cap: '1', mod: '1', title: 'Introdução ao estudo da Química', topic: 'A. Explorando a matéria; B. Transformações' },
    { disc: 'Química 31B', front: '31B', cap: '1', mod: '2', title: 'Substâncias e misturas', topic: 'A. Substância pura; B. Mistura; C. Métodos de separação' },
    // Sociologia 82B
    { disc: 'Sociologia 82B', front: '82B', cap: '1', mod: '1', title: 'Ser humano, natureza e trabalho', topic: 'A. Seres socioculturais; B. Humanidade e natureza' },
    { disc: 'Sociologia 82B', front: '82B', cap: '1', mod: '2', title: 'Principais sociólogos', topic: 'A. Émile Durkheim; B. Max Weber; C. Karl Marx' },
    // Produção de Texto 53B
    { disc: 'Produção de Texto 53B', front: '53B', cap: '1', mod: '1', title: 'Texto e textualidade', topic: 'A. Coesão; B. Coerência; C. Intencionalidade; D. Intertextualidade' },
    { disc: 'Produção de Texto 53B', front: '53B', cap: '1', mod: '2', title: 'Tipos e gêneros textuais', topic: 'A. Narração; B. Descrição; C. Dissertação; D. Injunção; E. Exposição' },
    // Língua Espanhola 92B
    { disc: 'Língua Espanhola 92B', front: '92B', cap: '1', mod: '1', title: 'Unidad 1 - Presentaciones', topic: 'A. Saludos; B. Presentaciones; C. Artículos definidos e indefinidos' },
];

async function run() {
    console.log('\n=== INICIANDO FIX COMPLETO ===\n');

    // Step 1: Get all classes and find 1º AEM
    const { data: classes } = await supabase.from('classes').select('*');
    const aem1 = classes.find(c => c.name === '1º AEM' || c.name.includes('1') && c.name.includes('AEM'));
    if (!aem1) { console.error('Turma 1º AEM não encontrada! Classes:', classes.map(c => c.name)); process.exit(1); }
    console.log(`✓ Turma encontrada: ${aem1.name} (ID: ${aem1.id})`);

    // Step 2: Delete ALL existing planning_modules for 1º AEM (including those with null class_id)
    await supabase.from('planning_modules').delete().eq('class_id', aem1.id);
    await supabase.from('planning_modules').delete().is('class_id', null);
    console.log('✓ Módulos antigos deletados (incluindo os com class_id=null)');

    // Step 3: Remove duplicate/old-style disciplines
    const oldStyleNames = ['Arte', 'Biologia', 'Filosofia', 'Física', 'Geografia', 'Gramática', 'História',
        'Língua Espanhola', 'Língua Inglesa', 'Literatura', 'Matemática', 'Produção de Texto', 'Química', 'Sociologia',
        'Arte 55B', 'Bio 41B', 'Bio 42B', 'Mat 11B', 'Mat 11I', 'Mat 12B', 'Mat 12I',
        'Biologia 41B', 'Biologia 43I', 'Física 21B', 'Física 22B', 'Física 23I'];

    const { data: existingDiscs } = await supabase.from('disciplines').select('*');
    const discMap = new Map();

    for (const d of existingDiscs) {
        discMap.set(d.name, d.id);
    }

    // Step 4: Ensure disciplines exist with correct full names
    const discNames = [...new Set(data.map(item => item.disc))];
    for (const name of discNames) {
        if (!discMap.has(name)) {
            const { data: newD } = await supabase.from('disciplines').insert({ name }).select().single();
            if (newD) {
                discMap.set(name, newD.id);
                console.log(`✓ Criou disciplina: ${name}`);
            }
        }
    }

    // Step 5: Insert all modules with correct class_id
    let count = 0;
    for (const item of data) {
        const discId = discMap.get(item.disc);
        if (!discId) { console.error(`Disc not found: ${item.disc}`); continue; }

        const { error } = await supabase.from('planning_modules').insert({
            discipline_id: discId,
            class_id: aem1.id,  // ← FIXED: using actual UUID
            teacher_id: null,
            front: item.front,
            chapter: item.cap,
            module: item.mod,
            title: item.title,
            topic: item.topic
        });
        if (!error) {
            count++;
        } else {
            console.error(`Erro em ${item.disc} - ${item.title}:`, error.message);
        }
    }
    console.log(`\n✓ ${count}/${data.length} módulos importados com sucesso!`);

    // Step 6: Fix teacher assignments — ensure classId is the UUID, not the name
    const { data: teachers } = await supabase.from('users').select('*').eq('role', 'TEACHER');
    for (const teacher of teachers) {
        const assignments = teacher.assignments || [];
        let changed = false;
        const newAssignments = assignments.map(a => {
            // If classId is a name (not UUID format), resolve it to UUID
            if (!a.classId || a.classId.includes('-')) return a; // Already looks like a UUID
            const matchedClass = classes.find(c => c.name === a.classId);
            if (matchedClass && matchedClass.id !== a.classId) {
                changed = true;
                return { ...a, classId: matchedClass.id };
            }
            return a;
        });
        if (changed) {
            await supabase.from('users').update({ assignments: newAssignments }).eq('id', teacher.id);
            console.log(`✓ Atribuição corrigida para professor: ${teacher.name}`);
        }
    }

    console.log('\n=== FIX CONCLUÍDO ===\n');
    process.exit(0);
}
run();
