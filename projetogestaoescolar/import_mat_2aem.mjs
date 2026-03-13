import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rawData12B = `1. CIRCUNFERÊNCIA TRIGONOMÉTRICA	1.0	Arcos côngruos na primeira volta	Relações trigonométricas na circunferência, funções trigonométricas e resolução de equações.
1. CIRCUNFERÊNCIA TRIGONOMÉTRICA	2.0	Seno e cosseno	Relações trigonométricas na circunferência, funções trigonométricas e resolução de equações.
1. CIRCUNFERÊNCIA TRIGONOMÉTRICA	3.0	Tangente	Relações trigonométricas na circunferência, funções trigonométricas e resolução de equações.
1. CIRCUNFERÊNCIA TRIGONOMÉTRICA	4.0	Resolução de equações trigonométricas I	Relações trigonométricas na circunferência, funções trigonométricas e resolução de equações.
1. CIRCUNFERÊNCIA TRIGONOMÉTRICA	5.0	Secante, cossecante e cotangente	Relações trigonométricas na circunferência, funções trigonométricas e resolução de equações.
1. CIRCUNFERÊNCIA TRIGONOMÉTRICA	6.0	Resolução de equações trigonométricas II	Relações trigonométricas na circunferência, funções trigonométricas e resolução de equações.
2. ARCOS TRIGONOMÉTRICOS	7.0	Adição e subtração de arcos trigonométricos	Relações entre arcos trigonométricos: adição, subtração, arco duplo e arcos côngruos.
2. ARCOS TRIGONOMÉTRICOS	8.0	Arco duplo	Relações entre arcos trigonométricos: adição, subtração, arco duplo e arcos côngruos.
2. ARCOS TRIGONOMÉTRICOS	9.0	Arcos côngruos	Relações entre arcos trigonométricos: adição, subtração, arco duplo e arcos côngruos.
3. EQUAÇÕES E INEQUAÇÕES TRIGONOMÉTRICAS	10.0	Equações trigonométricas: números reais	Resolução de equações e inequações trigonométricas no conjunto dos números reais.
3. EQUAÇÕES E INEQUAÇÕES TRIGONOMÉTRICAS	11.0	Inequações trigonométricas: números reais	Resolução de equações e inequações trigonométricas no conjunto dos números reais.
4. TEOREMA DOS SENOS E DOS COSSENOS (PARTE I)	12.0	Teorema dos senos	Aplicação do Teorema dos Senos na resolução de triângulos.
4. TEOREMA DOS SENOS E DOS COSSENOS (PARTE II)	13.0	Teorema dos cossenos	Aplicação do Teorema dos Cossenos na resolução de triângulos.
5. FUNÇÕES TRIGONOMÉTRICAS	14.0	Função periódica	Estudo das funções trigonométricas, suas propriedades, gráficos e aplicações.
5. FUNÇÕES TRIGONOMÉTRICAS	15.0	Função seno	Estudo das funções trigonométricas, suas propriedades, gráficos e aplicações.
5. FUNÇÕES TRIGONOMÉTRICAS	16.0	Função cosseno	Estudo das funções trigonométricas, suas propriedades, gráficos e aplicações.
5. FUNÇÕES TRIGONOMÉTRICAS	17.0	Função tangente	Estudo das funções trigonométricas, suas propriedades, gráficos e aplicações.
5. FUNÇÕES TRIGONOMÉTRICAS	18.0	Outras funções trigonométricas	Estudo das funções trigonométricas, suas propriedades, gráficos e aplicações.
5. FUNÇÕES TRIGONOMÉTRICAS	19.0	Gráficos das funções trigonométricas	Estudo das funções trigonométricas, suas propriedades, gráficos e aplicações.
5. FUNÇÕES TRIGONOMÉTRICAS	20.0	Funções trigonométricas: aplicações	Estudo das funções trigonométricas, suas propriedades, gráficos e aplicações.
6. FIGURAS ELEMENTARES	21.0	Áreas das superfícies de figuras elementares	Cálculo de áreas de superfícies planas: figuras triangulares, poligonais regulares, círculos e suas partes.
6. FIGURAS ELEMENTARES	22.0	Área de superfícies triangulares	Cálculo de áreas de superfícies planas: figuras triangulares, poligonais regulares, círculos e suas partes.
6. FIGURAS ELEMENTARES	23.0	Área de superfícies poligonais regulares e de círculos	Cálculo de áreas de superfícies planas: figuras triangulares, poligonais regulares, círculos e suas partes.
6. FIGURAS ELEMENTARES	24.0	Partes de um círculo: setor circular e segmento circular	Cálculo de áreas de superfícies planas: figuras triangulares, poligonais regulares, círculos e suas partes.
6. FIGURAS ELEMENTARES	25.0	Partes de um círculo: coroa circular	Cálculo de áreas de superfícies planas: figuras triangulares, poligonais regulares, círculos e suas partes.
7. POLÍGONOS CONVEXOS	26.0	Ângulos e diagonais	Propriedades dos polígonos convexos: ângulos internos e externos, diagonais e polígonos regulares.
7. POLÍGONOS CONVEXOS	27.0	Polígonos regulares	Propriedades dos polígonos convexos: ângulos internos e externos, diagonais e polígonos regulares.
8. GEOMETRIA ESPACIAL DE POSIÇÃO (PARTE I)	28.0	Fundamentos da geometria espacial de posição	Fundamentos da geometria espacial de posição: elementos geométricos no espaço e suas inter-relações.
8. GEOMETRIA ESPACIAL DE POSIÇÃO (PARTE II)	29.0	Aplicações da geometria espacial de posição	Aplicações da geometria espacial de posição na análise de relações entre pontos, retas e planos no espaço tridimensional.
9. POLIEDROS	30.0	Poliedros: definição	Definição e propriedades dos poliedros: prismas, pirâmides e suas aplicações no cálculo de áreas e volumes.
9. POLIEDROS	31.0	Cubos	Definição e propriedades dos poliedros: prismas, pirâmides e suas aplicações no cálculo de áreas e volumes.
9. POLIEDROS	32.0	Paralelepípedos	Definição e propriedades dos poliedros: prismas, pirâmides e suas aplicações no cálculo de áreas e volumes.
9. POLIEDROS	33.0	Prismas regulares	Definição e propriedades dos poliedros: prismas, pirâmides e suas aplicações no cálculo de áreas e volumes.
9. POLIEDROS	34.0	Pirâmides: elementos, áreas e volumes	Definição e propriedades dos poliedros: prismas, pirâmides e suas aplicações no cálculo de áreas e volumes.
9. POLIEDROS	35.0	Pirâmides: tetraedro	Definição e propriedades dos poliedros: prismas, pirâmides e suas aplicações no cálculo de áreas e volumes.
9. POLIEDROS	36.0	Aplicações envolvendo o volume de prismas e pirâmides	Definição e propriedades dos poliedros: prismas, pirâmides e suas aplicações no cálculo de áreas e volumes.
10. CILÍNDROS, CONES E ESFERAS	37.0	Cilíndros	Estudo dos sólidos de revolução: cilindros, cones e esferas — definições, propriedades, áreas e volumes
10. CILÍNDROS, CONES E ESFERAS	38.0	Cones	Estudo dos sólidos de revolução: cilindros, cones e esferas — definições, propriedades, áreas e volumes
10. CILÍNDROS, CONES E ESFERAS	39.0	Esferas	Estudo dos sólidos de revolução: cilindros, cones e esferas — definições, propriedades, áreas e volumes
11. INSCRIÇÃO E CIRCUNSCRIÇÃO DE SÓLIDOS	40.0	Conceitos fundamentais	Conceitos de inscrição e circunscrição de sólidos, suas propriedades, aplicações e relações entre sólidos semelhantes.
11. INSCRIÇÃO E CIRCUNSCRIÇÃO DE SÓLIDOS	41.0	Aplicações e propriedades	Conceitos de inscrição e circunscrição de sólidos, suas propriedades, aplicações e relações entre sólidos semelhantes.
11. INSCRIÇÃO E CIRCUNSCRIÇÃO DE SÓLIDOS	42.0	Sólidos semelhantes	Conceitos de inscrição e circunscrição de sólidos, suas propriedades, aplicações e relações entre sólidos semelhantes.
12. INTRODUÇÃO À GEOMETRIA ANALÍTICA (PARTE I)	43.0	Sistema de coordenadas cartesianas	Fundamentos da geometria analítica: sistema de coordenadas cartesianas e cálculo da distância entre dois pontos.
12. INTRODUÇÃO À GEOMETRIA ANALÍTICA (PARTE I)	44.0	Distância entre dois pontos	Fundamentos da geometria analítica: sistema de coordenadas cartesianas e cálculo da distância entre dois pontos.
12. INTRODUÇÃO À GEOMETRIA ANALÍTICA (PARTE II)	45.0	Ponto médio e baricentro	Cálculo do ponto médio, baricentro, área de triângulo e verificação de alinhamento de pontos no plano cartesiano.
12. INTRODUÇÃO À GEOMETRIA ANALÍTICA (PARTE II)	46.0	Área de um triângulo e alinhamento de pontos	Cálculo do ponto médio, baricentro, área de triângulo e verificação de alinhamento de pontos no plano cartesiano.
13. EQUAÇÃO FUNDAMENTAL DE UMA RETA	47.0	Inclinação e coeficiente angular	Estudo da reta no plano cartesiano: inclinação, coeficiente angular e suas equações fundamental, geral e reduzida.
13. EQUAÇÃO FUNDAMENTAL DE UMA RETA	48.0	Equação fundamental de uma reta	Estudo da reta no plano cartesiano: inclinação, coeficiente angular e suas equações fundamental, geral e reduzida.
13. EQUAÇÃO FUNDAMENTAL DE UMA RETA	49.0	Equação geral e equação reduzida de uma reta	Estudo da reta no plano cartesiano: inclinação, coeficiente angular e suas equações fundamental, geral e reduzida.
14. EQUAÇÕES DE RETAS E DISTÂNCIA PONTO-RETA (PARTE I)	50.0	Paralelismo de duas retas	Relações entre retas no plano: paralelismo, perpendicularidade e concorrência com base em suas equações.
14. EQUAÇÕES DE RETAS E DISTÂNCIA PONTO-RETA (PARTE I)	51.0	Retas concorrentes	Relações entre retas no plano: paralelismo, perpendicularidade e concorrência com base em suas equações.
14. EQUAÇÕES DE RETAS E DISTÂNCIA PONTO-RETA (PARTE I)	52.0	Retas perpendiculares	Relações entre retas no plano: paralelismo, perpendicularidade e concorrência com base em suas equações.
14. EQUAÇÕES DE RETAS E DISTÂNCIA PONTO-RETA (PARTE II)	53.0	Equações segmentárias e paramétricas	Equações segmentárias e paramétricas da reta, distância ponto-reta e posições relativas entre ponto e reta.
14. EQUAÇÕES DE RETAS E DISTÂNCIA PONTO-RETA (PARTE II)	54.0	Distância entre ponto e reta	Equações segmentárias e paramétricas da reta, distância ponto-reta e posições relativas entre ponto e reta.
14. EQUAÇÕES DE RETAS E DISTÂNCIA PONTO-RETA (PARTE II)	55.0	Posições relativas entre ponto e reta	Equações segmentárias e paramétricas da reta, distância ponto-reta e posições relativas entre ponto e reta.
15. CIRCUNFERÊNCIAS	56.0	Equação reduzida	Equações reduzida e geral da circunferência e análise das posições relativas entre ponto, reta e circunferências.
15. CIRCUNFERÊNCIAS	57.0	Equação geral	Equações reduzida e geral da circunferência e análise das posições relativas entre ponto, reta e circunferências.
15. CIRCUNFERÊNCIAS	58.0	Posições relativas entre ponto e circunferência	Equações reduzida e geral da circunferência e análise das posições relativas entre ponto, reta e circunferências.
15. CIRCUNFERÊNCIAS	59.0	Posições relativas entre reta e circunferência	Equações reduzida e geral da circunferência e análise das posições relativas entre ponto, reta e circunferências.
15. CIRCUNFERÊNCIAS	60.0	Posições relativas de circunferências	Equações reduzida e geral da circunferência e análise das posições relativas entre ponto, reta e circunferências.`;

const rawData11B = `1. ANÁLISE COMBINATÓRIA - PRINCÍPIOS DE CONTAGEM	1.0	Princípio multiplicativo	Princípios fundamentais da contagem e suas aplicações
1. ANÁLISE COMBINATÓRIA - PRINCÍPIOS DE CONTAGEM	2.0	Princípio da preferência	Princípios fundamentais da contagem e suas aplicações
1. ANÁLISE COMBINATÓRIA - PRINCÍPIOS DE CONTAGEM	3.0	Princípio aditivo	Princípios fundamentais da contagem e suas aplicações
2. ANÁLISE COMBINATÓRIA - FATORIAL, PERMUTAÇÃO E ARRANJO	4.0	Fatorial	Fatorial, permutação simples e arranjo simples na contagem de possibilidades.
2. ANÁLISE COMBINATÓRIA - FATORIAL, PERMUTAÇÃO E ARRANJO	5.0	Permutação simples	Fatorial, permutação simples e arranjo simples na contagem de possibilidades.
2. ANÁLISE COMBINATÓRIA - FATORIAL, PERMUTAÇÃO E ARRANJO	6.0	Arranjo simples	Fatorial, permutação simples e arranjo simples na contagem de possibilidades.
3. ANÁLISE COMBINATÓRIA - PRINCÍPIO DO DESPREZO DA ORDEM	7.0	Princípio do desprezo da ordem	Combinações e permutações com repetição no contexto do desprezo da ordem.
3. ANÁLISE COMBINATÓRIA - PRINCÍPIO DO DESPREZO DA ORDEM	8.0	Combinação simples	Combinações e permutações com repetição no contexto do desprezo da ordem.
3. ANÁLISE COMBINATÓRIA - PRINCÍPIO DO DESPREZO DA ORDEM	9.0	Permutação com elementos repetidos	Combinações e permutações com repetição no contexto do desprezo da ordem.
4. ANÁLISE COMBINATÓRIA - ANAGRAMAS E PERMUTAÇÃO CIRCULAR (PARTE I)	10.0	Anagramas	Anagramas e permutações circulares na contagem de agrupamentos.
4. ANÁLISE COMBINATÓRIA - ANAGRAMAS E PERMUTAÇÃO CIRCULAR (PARTE II)	11.0	Permutação circular	Anagramas e permutações circulares na contagem de agrupamentos.
5. ANÁLISE COMBINATÓRIA - FÓRMULAS DE CONTAGEM	12.0	Fórmulas de contagem	Aplicação de fórmulas de contagem e resolução de equações com fatoriais
5. ANÁLISE COMBINATÓRIA - FÓRMULAS DE CONTAGEM	13.0	Equações envolvendo fatoriais	Aplicação de fórmulas de contagem e resolução de equações com fatoriais
6. PROBABILIDADE (PARTE I)	14.0	Probabilidade: definição	Noções iniciais e definição clássica da probabilidade.
6. PROBABILIDADE (PARTE II)	15.0	Probabilidade: propriedades	Propriedades da probabilidade, união de eventos, probabilidade condicional e eventos independentes.
6. PROBABILIDADE (PARTE II)	16.0	Probabilidade da união de eventos	Propriedades da probabilidade, união de eventos, probabilidade condicional e eventos independentes.
6. PROBABILIDADE (PARTE II)	17.0	Probabilidade condicional	Propriedades da probabilidade, união de eventos, probabilidade condicional e eventos independentes.
6. PROBABILIDADE (PARTE II)	18.0	Probabilidade: eventos independentes	Propriedades da probabilidade, união de eventos, probabilidade condicional e eventos independentes.
6. PROBABILIDADE (PARTE III)	19.0	Probabilidade: eventos dependentes	Análise de eventos dependentes e suas implicações na probabilidade.
7. NÚMEROS BINOMINAIS	20.0	Números binominais: definição	Definição e propriedades dos números binominais no contexto da contagem e probabilidade.
7. NÚMEROS BINOMINAIS	21.0	Propriedades dos números binominais	Definição e propriedades dos números binominais no contexto da contagem e probabilidade.
8. TRIÂNGULO DE PASCAL (PARTE I)	22.0	Triângulo de Pascal: definição	Definição e construção do Triângulo de Pascal como ferramenta para contagem e análise combinatória.
8. TRIÂNGULO DE PASCAL (PARTE II)	23.0	Propriedades do triângulo de Pascal	Propriedades do Triângulo de Pascal e suas aplicações na contagem e nos coeficientes binomiais.
9. BINÔMIO DE NEWTON	24.0	Binômio de Newton: introdução	Expansão algébrica com o Binômio de Newton e determinação do termo geral.
9. BINÔMIO DE NEWTON	25.0	Fórmula do termo geral do binômio de Newton	Expansão algébrica com o Binômio de Newton e determinação do termo geral.
10. DISTRIBUIÇÃO BINOMINAL (PARTE I)	26.0	Fundamentos da distribuição binomial	Conceitos iniciais e fundamentos da distribuição binomial na análise de probabilidades.
10. DISTRIBUIÇÃO BINOMINAL (PARTE II)	27.0	Aplicações da distribuição binomial	Aplicações da distribuição binomial na resolução de problemas envolvendo probabilidades.
11. APLICAÇÕES DE ANÁLISE COMBINATÓRIA E PROBABILIDADE	28.0	Análise combinatória e probabilidade	Resolução de problemas que integram conceitos de análise combinatória e probabilidade.
12. TOMADA DE DECISÃO	29.0	A análise de enunciados	Análise e construção de enunciados para a tomada de decisão com base em raciocínio lógico e estatístico.
12. TOMADA DE DECISÃO	30.0	A construção de enunciados	Análise e construção de enunciados para a tomada de decisão com base em raciocínio lógico e estatístico.`;

function parseRawData(rawData, disciplineName, front) {
    const lines = rawData.trim().split('\n');
    const modules = [];
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        if (parts.length >= 4) {
            const capMatch = parts[0].match(/^(\d+)\./);
            let cap = "1";
            if (capMatch) {
                cap = capMatch[1];
            } else {
                cap = parts[0];
            }

            const modMatch = parts[1].match(/^(\d+)/);
            let mod = "1";
            if (modMatch) {
                mod = modMatch[1];
            } else {
                mod = parts[1];
            }

            modules.push({
                disc: disciplineName,
                front: front,
                cap: cap,
                mod: mod,
                title: parts[2].trim(),
                topic: parts[3].trim()
            });
        }
    }
    return modules;
}

async function run() {
    console.log('Iniciando importacao de Matemática 12B e Matemática 11B para 2º AEM...');

    // 1. Achar a turma 2º AEM
    const { data: classList, error: errC } = await supabase.from('classes').select('*');
    if (errC) { console.error('Erro classes:', errC); return; }

    // Procura por '2o AEM'
    const targetClass = classList.find(c => c.name.includes('2º AEM') || c.name.includes('2AEM'));
    if (!targetClass) {
        console.error('Turma não encontrada para importação (2º AEM)');
        return;
    }
    const classId = targetClass.id;
    console.log('Turma encontrada:', targetClass.name, 'ID:', classId);

    // 2. Prepara os modulos
    const modules12B = parseRawData(rawData12B, 'Matemática 12B - 2º AEM', '12B');
    const modules11B = parseRawData(rawData11B, 'Matemática 11B - 2º AEM', '11B');
    const allModules = [...modules12B, ...modules11B];

    // 3. Pegar as disciplinas
    const { data: currentDiscs, error: errD } = await supabase.from('disciplines').select('*');
    if (errD) { console.error('Erro disciplinas:', errD); return; }

    const discMap = new Map();
    currentDiscs.forEach(d => discMap.set(d.name, d.id));

    // Cleanup anterior (Substituir as dessas frentes para essa turma)
    const discToClean = [discMap.get('Matemática 12B - 2º AEM'), discMap.get('Matemática 11B - 2º AEM')].filter(Boolean);
    if (discToClean.length > 0) {
        console.log('Removendo registros antigos dessas disciplinas nesta turma...');
        await supabase.from('planning_modules').delete().eq('class_id', classId).in('discipline_id', discToClean);
    }

    let count = 0;
    for (const item of allModules) {
        let discId = discMap.get(item.disc);
        // Garantir que a disciplina exista (se faltar algo)
        if (!discId) {
            console.log('Criando disciplina ausente:', item.disc);
            const { data: newDisc, error: errN } = await supabase.from('disciplines').insert({ name: item.disc }).select().single();
            if (newDisc) {
                discId = newDisc.id;
                discMap.set(item.disc, discId);
            } else {
                console.error('Falha ao criar disciplina:', errN);
                continue;
            }
        }

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
        } else {
            console.error('Erro ao inserir:', item.title, error.message);
        }
    }

    console.log("Importacao concluida com: " + count + " registros.");
}

run();
