// Script: reset_disciplines.mjs
// Limpa TODAS as disciplinas e recria apenas as 26 oficiais
// Run: node reset_disciplines.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== DISCIPLINAS OFICIAIS (26 no total) =====
const OFFICIAL_DISCIPLINES = [
    '1ª SÉRIE_ART_55B',
    '1ª SÉRIE_BIO_41B',
    '1ª SÉRIE_BIO_42B',
    '1ª SÉRIE_BIO_43I',
    '1ª SÉRIE_FIL_81B',
    '1ª SÉRIE_FIS_21B',
    '1ª SÉRIE_FIS_22B',
    '1ª SÉRIE_FIS_23I',
    '1ª SÉRIE_GEO_70B',
    '1ª SÉRIE_GEO_70I',
    '1ª SÉRIE_GRA_51B',
    '1ª SÉRIE_HIS_60B',
    '1ª SÉRIE_HIS_60I',
    '1ª SÉRIE_LES_37I',
    '1ª SÉRIE_LIN_34B',
    '1ª SÉRIE_LIT_52B',
    '1ª SÉRIE_MAT_11B',
    '1ª SÉRIE_MAT_11I',
    '1ª SÉRIE_MAT_12B',
    '1ª SÉRIE_MAT_12I',
    '1ª SÉRIE_PTX_53B',
    '1ª SÉRIE_PTX_53I',
    '1ª SÉRIE_QUI_31B',
    '1ª SÉRIE_QUI_32B',
    '1ª SÉRIE_QUI_33I',
    '1ª SÉRIE_SOC_82B',
];

// Mapeamento: nome oficial → módulos de conteúdo
const MODULES = [
    // ART 55B
    { disc: '1ª SÉRIE_ART_55B', cap: '1', mod: '1', title: 'Noções de estética e teoria da arte', topic: 'A. Pense: a arte é real?; B. Por que a humanidade produz arte?; C. Arte e beleza; D. Arte e artesanato' },
    { disc: '1ª SÉRIE_ART_55B', cap: '2', mod: '2', title: 'Arte na Pré-História', topic: 'A. Paleolítico; B. Neolítico; C. Idade dos Metais; D. Pré-História no Brasil' },
    { disc: '1ª SÉRIE_ART_55B', cap: '3', mod: '3', title: 'Arte na Mesopotâmia e no Egito', topic: 'A. Arte na Mesopotâmia; B. Arte egípcia' },
    { disc: '1ª SÉRIE_ART_55B', cap: '4', mod: '4', title: 'Arte grega', topic: 'A. Arquitetura; B. Pintura; C. Escultura' },
    { disc: '1ª SÉRIE_ART_55B', cap: '4', mod: '5', title: 'Arte romana', topic: 'A. Arquitetura; B. Escultura; C. Pintura' },
    // BIO 41B
    { disc: '1ª SÉRIE_BIO_41B', cap: '1', mod: '1', title: 'Metodologia científica na biologia', topic: 'A. Investigação científica; B. Metodologia científica; C. Perguntas originais; D. Testando hipóteses' },
    { disc: '1ª SÉRIE_BIO_41B', cap: '1', mod: '2', title: 'Características dos seres vivos', topic: 'A. Vida; B. Propriedades da vida; C. A vida no interior da célula; D. Capacidade reprodutiva' },
    { disc: '1ª SÉRIE_BIO_41B', cap: '1', mod: '3', title: 'Níveis de organização dos seres vivos', topic: 'A. Átomo; B. Molécula; C. Organela; D. Célula; E. Tecido; F. Órgão; G. Sistema' },
    { disc: '1ª SÉRIE_BIO_41B', cap: '1', mod: '4', title: 'Equilíbrio, vida e energia', topic: 'A. Fundamentos da lógica da organização; B. Termodinâmica' },
    { disc: '1ª SÉRIE_BIO_41B', cap: '1', mod: '5', title: 'Origem dos seres vivos', topic: 'A. Teoria da geração espontânea; B. Teoria da biogênese' },
    // BIO 42B
    { disc: '1ª SÉRIE_BIO_42B', cap: '1', mod: '1', title: 'Conceitos básicos de Ecologia', topic: 'A. Níveis de organização; B. População; C. Comunidade; D. Ecossistema' },
    { disc: '1ª SÉRIE_BIO_42B', cap: '1', mod: '2', title: 'Cadeias alimentares', topic: 'A. Cadeias alimentares; B. Teias alimentares' },
    { disc: '1ª SÉRIE_BIO_42B', cap: '1', mod: '3', title: 'Fluxo de energia', topic: 'A. Produtores; B. Consumidores; C. Decompositores' },
    // BIO 43I
    { disc: '1ª SÉRIE_BIO_43I', cap: '1', mod: '1', title: 'Clima, água e solo', topic: 'A. Padrões climáticos globais; B. Influência regional no clima' },
    { disc: '1ª SÉRIE_BIO_43I', cap: '1', mod: '2', title: 'Biomas terrestres', topic: 'A. Floresta tropical; B. Savana; C. Deserto; D. Tundra' },
    // FIL 81B
    { disc: '1ª SÉRIE_FIL_81B', cap: '1', mod: '1', title: 'Do mito à filosofia', topic: 'A. A originalidade da atitude filosófica; B. Pensamento racional' },
    { disc: '1ª SÉRIE_FIL_81B', cap: '1', mod: '2', title: 'Os pré-socráticos', topic: 'A. Tales de Mileto; B. Anaxímenes; C. Heráclito; D. Parmênides' },
    // FIS 21B
    { disc: '1ª SÉRIE_FIS_21B', cap: '1', mod: '1', title: 'Introdução ao estudo da Física', topic: 'A. Mecânica; B. Termodinâmica; C. Eletromagnetismo; D. Óptica' },
    { disc: '1ª SÉRIE_FIS_21B', cap: '1', mod: '2', title: 'Grandezas físicas e sistemas de unidades', topic: 'A. Grandezas fundamentais; B. Sistema Internacional de Unidades' },
    // FIS 22B
    { disc: '1ª SÉRIE_FIS_22B', cap: '1', mod: '1', title: 'Introdução à óptica', topic: 'A. Conceito de luz; B. Velocidade da luz; C. Fontes de luz' },
    { disc: '1ª SÉRIE_FIS_22B', cap: '1', mod: '2', title: 'Reflexão e refração da luz', topic: 'A. Leis da reflexão; B. Leis da refração; C. Índice de refração' },
    // FIS 23I
    { disc: '1ª SÉRIE_FIS_23I', cap: '1', mod: '1', title: 'Áreas da Física e outras ciências', topic: 'A. Física clássica e moderna; B. Relações com outras ciências' },
    // GEO 70B
    { disc: '1ª SÉRIE_GEO_70B', cap: '1', mod: '1', title: 'O espaço geográfico', topic: 'A. Conceito de espaço geográfico; B. A relação homem-natureza' },
    { disc: '1ª SÉRIE_GEO_70B', cap: '1', mod: '2', title: 'Cartografia', topic: 'A. Escalas; B. Tipos de projeções; C. Interpretação de mapas' },
    // GEO 70I
    { disc: '1ª SÉRIE_GEO_70I', cap: '1', mod: '1', title: 'Geopolítica e relações internacionais', topic: 'A. Conceito de geopolítica; B. Organismos internacionais; C. ONU' },
    // GRA 51B
    { disc: '1ª SÉRIE_GRA_51B', cap: '1', mod: '1', title: 'Linguagem, língua, oralidade e escrita', topic: 'A. Língua e linguagem; B. Variação linguística' },
    { disc: '1ª SÉRIE_GRA_51B', cap: '1', mod: '2', title: 'Fonética e Fonologia', topic: 'A. Fonema e letra; B. Ditongos; C. Tritongos; D. Hiato' },
    // HIS 60B
    { disc: '1ª SÉRIE_HIS_60B', cap: '1', mod: '1', title: 'As primeiras civilizações', topic: 'A. Mesopotâmia; B. Egito Antigo; C. Hebreus' },
    { disc: '1ª SÉRIE_HIS_60B', cap: '1', mod: '2', title: 'Grécia Antiga', topic: 'A. Período Homérico; B. Período Arcaico; C. Período Clássico' },
    // HIS 60I
    { disc: '1ª SÉRIE_HIS_60I', cap: '1', mod: '1', title: 'Pré-História', topic: 'A. Paleolítico; B. Neolítico; C. Homo sapiens' },
    // LES 37I
    { disc: '1ª SÉRIE_LES_37I', cap: '1', mod: '1', title: 'Unidad 1 - Presentaciones', topic: 'A. Saludos; B. Presentaciones; C. Artículos definidos e indefinidos' },
    // LIN 34B
    { disc: '1ª SÉRIE_LIN_34B', cap: '1', mod: '1', title: 'Unit 1 - Introduction', topic: 'A. Greetings; B. Introductions; C. Simple Present' },
    // LIT 52B
    { disc: '1ª SÉRIE_LIT_52B', cap: '1', mod: '1', title: 'Trovadorismo', topic: 'A. Origem; B. Cantigas de amor; C. Cantigas de amigo; D. Cantigas de escárnio' },
    { disc: '1ª SÉRIE_LIT_52B', cap: '1', mod: '2', title: 'Humanismo', topic: 'A. Contexto histórico; B. Características; C. Gil Vicente' },
    // MAT 11B
    { disc: '1ª SÉRIE_MAT_11B', cap: '1', mod: '1', title: 'Conjuntos - Introdução', topic: 'A. Noções sobre conjuntos; B. Formas de representação; C. Diagrama de Euler-Venn' },
    { disc: '1ª SÉRIE_MAT_11B', cap: '1', mod: '2', title: 'Subconjuntos', topic: 'A. Subconjuntos; B. Relação de inclusão; C. Conjunto complementar' },
    { disc: '1ª SÉRIE_MAT_11B', cap: '1', mod: '3', title: 'Operações entre conjuntos', topic: 'A. União; B. Intersecção; C. Diferença' },
    { disc: '1ª SÉRIE_MAT_11B', cap: '2', mod: '4', title: 'Funções - Introdução', topic: 'A. Conceito de função; B. Domínio; C. Contradomínio; D. Imagem' },
    { disc: '1ª SÉRIE_MAT_11B', cap: '2', mod: '5', title: 'Função afim', topic: 'A. Definição; B. Gráfico; C. Coeficiente angular; D. Coeficiente linear' },
    { disc: '1ª SÉRIE_MAT_11B', cap: '2', mod: '6', title: 'Função quadrática', topic: 'A. Definição; B. Raízes; C. Vértice; D. Gráfico - parábola' },
    // MAT 11I
    { disc: '1ª SÉRIE_MAT_11I', cap: '1', mod: '1', title: 'Sistemas ancestrais de numeração', topic: 'A. A invenção dos números; B. Sistemas ancestrais; C. Egípcio; D. Babilônico' },
    { disc: '1ª SÉRIE_MAT_11I', cap: '1', mod: '2', title: 'Algarismos indo-arábicos e sistema decimal', topic: 'A. Os algarismos indo-arábicos; B. Base de um sistema; C. Mudança de base' },
    { disc: '1ª SÉRIE_MAT_11I', cap: '2', mod: '3', title: 'Números naturais e operações', topic: 'A. Adição e subtração; B. Multiplicação; C. Divisão; D. Potenciação' },
    // MAT 12B
    { disc: '1ª SÉRIE_MAT_12B', cap: '1', mod: '1', title: 'Razão e proporção', topic: 'A. Razão; B. Proporção; C. Constante de proporcionalidade' },
    { disc: '1ª SÉRIE_MAT_12B', cap: '1', mod: '2', title: 'Grandezas diretamente proporcionais', topic: 'A. Conceito; B. Tabela de proporcionalidade; C. Regra de três simples direta' },
    { disc: '1ª SÉRIE_MAT_12B', cap: '1', mod: '3', title: 'Grandezas inversamente proporcionais', topic: 'A. Conceito; B. Regra de três simples inversa' },
    // MAT 12I
    { disc: '1ª SÉRIE_MAT_12I', cap: '1', mod: '1', title: 'Produtos notáveis', topic: 'A. Quadrado da soma; B. Quadrado da diferença; C. Produto da soma pela diferença' },
    { disc: '1ª SÉRIE_MAT_12I', cap: '1', mod: '2', title: 'Fatoração', topic: 'A. Fator comum; B. Agrupamento; C. Trinômio quadrado perfeito' },
    // PTX 53B
    { disc: '1ª SÉRIE_PTX_53B', cap: '1', mod: '1', title: 'Texto e textualidade', topic: 'A. Coesão; B. Coerência; C. Intencionalidade; D. Intertextualidade' },
    { disc: '1ª SÉRIE_PTX_53B', cap: '1', mod: '2', title: 'Tipos e gêneros textuais', topic: 'A. Narração; B. Descrição; C. Dissertação; D. Injunção; E. Exposição' },
    // PTX 53I
    { disc: '1ª SÉRIE_PTX_53I', cap: '1', mod: '1', title: 'Argumentação e dissertação', topic: 'A. Tese; B. Argumentos; C. Conclusão' },
    // QUI 31B
    { disc: '1ª SÉRIE_QUI_31B', cap: '1', mod: '1', title: 'Introdução ao estudo da Química', topic: 'A. Explorando a matéria; B. Transformações' },
    { disc: '1ª SÉRIE_QUI_31B', cap: '1', mod: '2', title: 'Substâncias e misturas', topic: 'A. Substância pura; B. Mistura; C. Métodos de separação' },
    // QUI 32B
    { disc: '1ª SÉRIE_QUI_32B', cap: '1', mod: '1', title: 'Tabela periódica', topic: 'A. Histórico; B. Organização; C. Propriedades periódicas' },
    // QUI 33I
    { disc: '1ª SÉRIE_QUI_33I', cap: '1', mod: '1', title: 'Ligações químicas', topic: 'A. Ligação iônica; B. Ligação covalente; C. Ligação metálica' },
    // SOC 82B
    { disc: '1ª SÉRIE_SOC_82B', cap: '1', mod: '1', title: 'Ser humano, natureza e trabalho', topic: 'A. Seres socioculturais; B. Humanidade e natureza' },
    { disc: '1ª SÉRIE_SOC_82B', cap: '1', mod: '2', title: 'Principais sociólogos', topic: 'A. Émile Durkheim; B. Max Weber; C. Karl Marx' },
];

async function run() {
    console.log('\n=== RESET TOTAL DE DISCIPLINAS ===\n');

    // 1. Find 1º AEM class
    const { data: classes } = await supabase.from('classes').select('*');
    const aem1 = classes.find(c => c.name === '1º AEM' || (c.name.includes('1') && c.name.toUpperCase().includes('AEM')));
    if (!aem1) { console.error('ERRO: Turma 1º AEM não encontrada!'); process.exit(1); }
    console.log(`✓ Turma: ${aem1.name} (${aem1.id})`);

    // 2. Delete ALL planning_modules (we will recreate them)
    const { error: delMods } = await supabase.from('planning_modules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✓ Todos os módulos de planejamento deletados');

    // 3. Delete ALL disciplines
    const { error: delDiscs } = await supabase.from('disciplines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✓ Todas as disciplinas antigas deletadas');

    // 4. Create only the 26 official disciplines
    const { data: newDiscs, error: insDiscs } = await supabase
        .from('disciplines')
        .insert(OFFICIAL_DISCIPLINES.map(name => ({ name })))
        .select();

    if (insDiscs) { console.error('ERRO ao criar disciplinas:', insDiscs.message); process.exit(1); }
    console.log(`✓ ${newDiscs.length} disciplinas oficiais criadas`);

    // Build name→id map
    const discMap = new Map();
    newDiscs.forEach(d => discMap.set(d.name, d.id));

    // 5. Insert modules linked to official discipline IDs
    let count = 0;
    for (const m of MODULES) {
        const discId = discMap.get(m.disc);
        if (!discId) { console.warn(`  AVISO: Disciplina não mapeada: ${m.disc}`); continue; }

        const { error } = await supabase.from('planning_modules').insert({
            discipline_id: discId,
            class_id: aem1.id,
            teacher_id: null,
            front: m.disc.split('_').pop(), // e.g. 55B
            chapter: m.cap,
            module: m.mod,
            title: m.title,
            topic: m.topic
        });
        if (!error) count++;
        else console.error(`  ERRO em ${m.disc} - ${m.title}:`, error.message);
    }
    console.log(`\n✓ ${count}/${MODULES.length} módulos importados`);

    // 6. Update teacher assignments to use official discipline names
    const { data: teachers } = await supabase.from('users').select('*').in('role', ['TEACHER', 'COORDINATOR']);
    for (const teacher of teachers) {
        const assignments = teacher.assignments || [];
        const newAssignments = assignments.map(a => {
            // Resolve classId to UUID
            const matchedClass = classes.find(c => c.name === a.classId || c.id === a.classId);
            return {
                ...a,
                classId: matchedClass?.id || a.classId
            };
        });
        await supabase.from('users').update({ assignments: newAssignments }).eq('id', teacher.id);
    }
    console.log(`✓ Atribuições de ${teachers.length} professores atualizadas`);

    console.log('\n=== CONCLUÍDO ===\n');
    new Array(OFFICIAL_DISCIPLINES.length).fill(0).forEach((_, i) => {
        const d = newDiscs[i];
        console.log(`  ${i + 1}. ${d.name}`);
    });
    process.exit(0);
}
run();
