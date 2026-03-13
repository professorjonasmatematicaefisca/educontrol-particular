import { supabase } from './scripts/supabase_helper.mjs';

const rawData12B = `1. Razão e proporção	1.0	Razão e proporção	1. Razão; A. Conceito; B. Definição; 2. Proporção; A. Conceito; B. Definição; C. Constante de proporcionalidade; D. Propriedade fundamental da proporção; E. Equivalências entre proporções
1. Razão e proporção	2.0	Escala numérica	3. Escala numérica; A. Conceito; B. Definição; C. Escala maior e escala menor
1. Razão e proporção	3.0	Grandezas proporcionais	4. Grandezas proporcionais; A. Grandezas diretamente proporcionais; B. Definição de grandezas diretamente proporcionais; C. Grandezas inversamente proporcionais; D. Definição de grandezas inversamente proporcionais
2. Regra de três	4.0	Regra de três simples	1. Regra de três simples; A. Regra de três simples para grandezas diretamente proporcionais (regra de três simples e direta); B. Regra de três simples para grandezas inversamente proporcionais (regra de três simples e inversa)
2. Regra de três	5.0	Regra de três composta	2. Regra de três composta; A. Conceito; B. Algoritmo para a resolução de problemas que envolvem a regra de três composta
3. Arcos e ângulos	6.0	Medidas de arcos: graus e radianos	1. Arcos e ângulos; A. Arcos de circunferência; B. Ângulos; 2. Correspondência entre arcos e ângulos; 3. Medida angular de arcos e ângulos; A. Grau; B. Radiano; C. Relação entre grau e radiano; D. Tabela dos arcos mais usados; 4. Comprimento de um arco de circunferência; A. Ângulo central em graus; B. Ângulo central em radianos
4. Ângulos	7.0	Ângulos - Classificação	1. Classificação dos ângulos; A. Classificação quanto à posição; B. Classificação quanto à medida; C. Extensão do conceito de ângulo; 2. Bissetriz de um ângulo
4. Ângulos	8.0	Ângulos complementares e ângulos suplementares	3. Ângulos complementares e ângulos suplementares; A. Ângulos complementares; B. Ângulos suplementares
4. Ângulos	9.0	Ângulos de duas retas cortadas por uma transversal	4. Ângulos de duas retas cortadas por uma transversal; A. Ângulos correspondentes; B. Ângulos colaterais internos; C. Ângulos colaterais externos; D. Ângulos alternos internos; E. Ângulos alternos externos; 5. Duas retas paralelas cortadas por uma transversal; A. Teorema importante
5. Estudo dos triângulos	10.0	Triângulos - Classificação e condições de existência	1. Triângulos; A. Introdução; B. Definição e notação; C. Elementos básicos; 2. Classificação e condições de existência de um triângulo; 3. Classificação dos triângulos; A. Classificação quanto à medida dos lados; B. Classificação quanto à medida dos ângulos internos
5. Estudo dos triângulos	11.0	Ângulos em um triângulo	4. Ângulos de um triângulo; A. Teorema dos ângulos internos ou teorema angular de Tales; B. Teorema do ângulo externo; C. Teorema dos ângulos externos
5. Estudo dos triângulos	12.0	Congruência de triângulos	5. Congruência de triângulos; A. Introdução; B. Definição; C. Casos de congruência
6. Pontos notáveis de um triângulo e áreas equivalentes em um triângulo	13.0	Triângulos - Baricentro e ortocentro	1. Pontos notáveis de um triângulo; A. Definições preliminares; B. Baricentro; C. Ortocentro
6. Pontos notáveis de um triângulo e áreas equivalentes em um triângulo	14.0	Triângulos - Incentro e circuncentro	D. Incentro; E. Circuncentro
6. Pontos notáveis de um triângulo e áreas equivalentes em um triângulo	15.0	Triângulos - Áreas equivalentes em um triângulo	2. Áreas equivalentes em um triângulo; A. Noção intuitiva de área; B. Definição da área de uma região poligonal; 3. Área de retângulos, paralelogramos e triângulos; A. Área de retângulos; B. Área de paralelogramos; C. Áreas de triângulos; D. Triângulos equivalentes; E. Divisão de uma região triangular em partes equivalentes
7. Quadriláteros notáveis	16.0	Quadriláteros notáveis	1. Quadrilátero; A. Definição; B. Elementos; 2. Quadriláteros notáveis; A. Trapézio; B. Classificação dos trapézios; C. Paralelogramo
8. Teorema linear de Tales	17.0	Teorema linear de Tales	1. Teorema linear de Tales; A. Pré-requisitos; B. Definições; C. Teorema de Tales
8. Teorema linear de Tales	18.0	Teorema da bissetriz interna (TBI) e da externa (TBE)	2. Teorema da bissetriz interna; A. Demonstração do teorema da bissetriz interna; 3. Teorema da bissetriz externa; A. Demonstração do teorema da bissetriz externa
9. Semelhanças	19.0	Semelhanças de triângulos: casos de semelhança	1. Semelhança entre figuras planas; 2. Semelhança de triângulos; 3. Propriedades das semelhanças de triângulos; 4. Teorema fundamental da semelhança de triângulos; 5. Critérios ou casos de semelhanças; A. Caso AA (ângulo-ângulo); B. Caso LAL (lado-ângulo-lado); C. Caso LLL (lado-lado-lado)
9. Semelhanças	20.0	Teoremas: base média, fundamental da semelhança e polígonos semelhantes	6. Teorema da base média de um triângulo; 7. Teorema da base média de um trapézio; 8. Perímetros e áreas de polígonos semelhantes; A. Perímetros; B. Áreas
9. Semelhanças	21.0	Relações métricas no triângulo retângulo	9. Relações métricas no triângulo; A. Projeções ortogonais
10. Ângulos na circunferência e relações métricas na circunferência	22.0	Ângulos na circunferência - Ângulos central, inscrito e de segmento	1. Ângulos na circunferência; A. Retomada de conhecimentos; B. Ângulo central; C. Ângulo inscrito; D. Quadriláteros inscritos em uma circunferência; E. Ângulo de segmento
10. Ângulos na circunferência e relações métricas na circunferência	23.0	Ângulos na circunferência - Ângulos excêntricos	F. Ângulos excêntricos
10. Ângulos na circunferência e relações métricas na circunferência	24.0	Relações métricas na circunferência e segmentos tangentes	2. Relações métricas na circunferência; A. Cordas que se interceptam em um ponto P diferente do centro; B. Cordas que não se interceptam; C. Um segmento secante e um segmento tangente à circunferência; D. Dois segmentos tangentes à circunferência; 3. Quadriláteros circunscritos em uma circunferência
11. Teorema de Pitágoras e razões trigonométricas no triângulo retângulo	25.0	Teorema de Pitágoras - Aplicações	1. Teorema de Pitágoras - Aplicações; A. Considerações iniciais; B. O teorema de Pitágoras; C. Aplicações do teorema de Pitágoras
11. Teorema de Pitágoras e razões trigonométricas no triângulo retângulo	26.0	Razões trigonométricas no triângulo retângulo	2. Trigonométricas no triângulo retângulo; A. Razões trigonométricas no triângulo retângulo
11. Teorema de Pitágoras e razões trigonométricas no triângulo retângulo	27.0	Ângulos notáveis e aplicações	3. Ângulos notáveis e aplicações; A. Apresentação; B. Quadro resumo
12. Relação fundamental da Trigonometria e razões trigonométricas inversas	28.0	Relação fundamental da Trigonometria	1. Relação fundamental da Trigonometria; A. Introdução; B. Demonstração; C. Consequências imediatas
12. Relação fundamental da Trigonometria e razões trigonométricas inversas	29.0	Razões trigonométricas inversas	2. Razões trigonométricas inversas; A. Secante; B. Cossecante; C. Cotangente; D. Propriedades; E. Quadro de relações trigonométricas
12. Relação fundamental da Trigonometria e razões trigonométricas inversas	30.0	Identidades trigonométricas	3. Identidades trigonométricas; A. Demonstração de uma identidade trigonométrica`;

const rawData11B = `1. Conjuntos	1.0	Conjuntos - Introdução	1. Noções sobre conjuntos; A. Introdução; 2. Formas de representação de um conjunto; A. Enumeração ou listagem; B. Representação pela propriedade de seus elementos; C. Diagrama de Euler-Venn; 3. Relação de pertinência; 4. Conjuntos iguais; 5. Conjuntos notáveis; A. Conjunto unitário; B. Conjunto vazio; C. Conjunto universo; 6. Conjuntos finitos e infinitos; A. Conjunto finito; B. Conjunto infinito
1. Conjuntos	2.0	Subconjuntos	7. Subconjuntos – Relação de inclusão; A. Propriedades da inclusão; B. Conjunto complementar
1. Conjuntos	3.0	União e intersecção de conjuntos	8. Operações entre conjuntos; A. União (ou reunião) de conjuntos; B. Intersecção de conjuntos
1. Conjuntos	4.0	Diferença de conjuntos	C. Diferença de conjuntos
1. Conjuntos	5.0	Número de elementos de conjuntos finitos	9. Números de elementos de conjuntos finitos; A. Número de elementos da diferença de conjuntos; B. Número de elementos da união e da intersecção de conjuntos
1. Conjuntos	6.0	Conjunto das partes e operações com conjuntos	10. Conjunto de conjuntos; A. Conjunto das partes – Número de elementos do conjunto das partes
2. Conjuntos numéricos	7.0	Conjunto dos números naturais, inteiros e racionais	1. Introdução; 2. Conjunto dos números naturais (N); A. Subconjuntos notáveis do conjunto dos números naturais; B. Definições relevantes; C. Reta numérica (ou numerada) para os números naturais; D. Ordem no conjunto dos números naturais; E. Operações fechadas no conjunto dos números naturais; 3. Conjuntos dos números inteiros (Z); A. Subconjuntos notáveis do conjunto dos números inteiros; B. Definições relevantes; C. Reta numérica (ou numerada) para os números inteiros; D. Ordem no conjunto dos números inteiros; E. Operações fechadas no conjunto dos números inteiros; 4. Conjunto dos números racionais (Q); A. Números que são racionais; B. Representação decimal de um número racional; C. Conversão de número racional na forma fracionária em um número na forma decimal; D. Conversão de um número racional na forma decimal exata em um número racional na forma fracionária; E. Conversão de um número racional na forma decimal infinita em um número racional na forma fracionária; F. Subconjuntos notáveis do conjunto dos números racionais; G. Reta numérica (ou numerada) para os números racionais; I. Entre dois números racionais há pelo menos um número racional; J. Operações fechadas no conjunto dos números racionais
2. Conjuntos numéricos	8.0	Conjunto dos números irracionais e reais - Intervalos reais	5. Conjunto dos números irracionais (I); A. Propriedades dos números irracionais; 6. Conjunto dos reais (R); A. Subconjuntos notáveis do conjunto dos números reais
2. Conjuntos numéricos	9.0	Operações com intervalos	7. Intervalos reais; A. Representações de intervalos; B. Intersecção de intervalos; C. Diferença entre intervalos
3. Porcentagem	10.0	Porcentagem - Definição e transações comerciais	1. Porcentagem ou percentagem; A. Introdução; B. Definição; 2. Formas de representar uma porcentagem; A. Forma percentual; B. Forma fracionária; C. Forma decimal; 3. Porcentagem de um valor; A. Porcentagem de uma porcentagem; 4. Custo, lucro e venda; A. Definições; B. Porcentagem do lucro sobre o preço de custo; C. Porcentagem do lucro sobre o preço de venda
3. Porcentagem	11.0	Porcentagem - Aumentos sucessivos e descontos sucessivos	5. Aumento simples; A. Caso geral; 6. Desconto simples; A. Caso geral; 7. Aumentos sucessivos; A. Caso geral; B. Aumentos sucessivos com a mesma taxa percentual; 8. Descontos sucessivos; A. Descontos sucessivos com a mesma taxa percentual
3. Porcentagem	12.0	Porcentagem - Aumentos e descontos sucessivos	9. Aumentos e descontos sucessivos
4. Porcentagem - Juros e número-índice	13.0	Porcentagem - Matemática financeira - Juro simples	1. Juro; A. Introdução; B. Definição; C. Conceitos importantes da Matemática financeira; 2. Juro simples; A. Definição
4. Porcentagem - Juros e número-índice	14.0	Porcentagem - Matemática financeira - Juro composto	3. Juro composto; A. Definição
4. Porcentagem - Juros e número-índice	15.0	Porcentagem - Números-índice e índices inflacionários	4. Números-índice e índices inflacionários; A. Introdução; B. Definição de número-índice; C. Número-índice simples; D. Números-índice de ligação ou relativos em cadeia; E. Mudança da data-base; F. Números-índice agregados ou agregativos ou compostos; 5. Inflação; A. Índices de inflação; B. Principais índices de inflação do país; 6. Número-Índice de índices inflacionários; 7. Deflação; A. Definição
5. Função (Parte I)	16.0	Noção intuitiva de função	1. Noção intuitiva de função; 2. Interpretando a noção intuitiva de função; 3. O símbolo f(x)
5. Função (Parte I)	17.0	Definição de função	4. Definição de função; A. Par ordenado; B. Produto cartesiano; C. Definição de função; D. Maneiras de representar uma função
5. Função (Parte I)	18.0	Domínio, contradomínio e imagem da função	5. Domínio, contradomínio e imagem da função; A. Função real; B. Raiz ou zero de uma função; C. Domínio de uma função real
5. Função (PARTE II)	19.0	Gráfico de uma função	6. Representação de funções; A. Outras maneiras de representar uma função; 7. Representação de um par ordenado no plano cartesiano; A. Plano cartesiano; 8. Representando um ponto; 8. Representando um ponto do gráfico da função no plano cartesiano; 9. Gráfico de uma função; 10. Gráfico – Domínio e imagem; A. Projeção ortogonal de um ponto do plano cartesiano nos eixos coordenados; 11. Gráfico – Reconhecimento de uma função
6. Função polinomial do 1º grau	20.0	Função polinomial do 1º grau (função afim)	1. Função afim ou polinomial do 1º grau; A. Introdução; B. Definição; C. Raiz de função polinomial do 1º grau
6. Função polinomial do 1º grau	21.0	Gráfico da função afim e da função constante	2. Gráfico da função afim ou polinomial do 1º grau e da função constante; A. Função constante; B. Gráfico da função do 1º grau; C. Interpretação geométrica da raiz da função do 1º grau; D. Interpretação geométrica do termo independente (coeficiente linear); E. Crescimento e decrescimento de função; F. Taxa de variação ou coeficiente angular
6. Função polinomial do 1º grau	22.0	Função linear - Proporcionalidade	3. Proporcionalidade e a função linear; A. Função linear; B. Função identidade
6. Função polinomial do 1º grau	23.0	Estudo dos sinais - Inequações	4. Estudo dos sinais – inequações; A. Estudo dos sinais; B. Inequação do 1º grau
6. Função polinomial do 1º grau	24.0	Inequações - Produto ou quociente	5. Inequações - Produto ou quociente; A. Inequação produto; B. Inequação quociente
7. Função polinomial do 2º grau (função quadrática)	25.0	Função polinomial do 2º grau (função quadrática)	1. Função polinomial do 2º grau (função quadrática); A. Definição; B. Raízes da função do 2º grau; C. Trinômio do 2º grau
7. Função polinomial do 2º grau (função quadrática)	26.0	Função polinomial do 2º grau - Gráficos	2. Função polinomial do 2º grau - Gráficos; A. Concavidade da parábola; B. Interpretação geométrica da raiz de uma função do 2º grau; C. Termo independente; D. Eixo de simetria e vértice da parábola; E. Conjunto imagem
7. Função polinomial do 2º grau (função quadrática)	27.0	Função polinomial do 2º grau - Máximos e mínimos	3. Função polinomial do 2º grau - Máximos e mínimos; A. Máximos e mínimos
7. Função polinomial do 2º grau (função quadrática)	28.0	Inequação do 2º grau	4. Inequação do 2º grau; A. Estudo do sinal de uma função do 2º grau; B. Inequação do 2º grau
7. Função polinomial do 2º grau (função quadrática)	29.0	Inequações - Produto ou quociente	5. Inequações - Produto ou quociente; A. Inequação produto; B. Inequação quociente
7. Função polinomial do 2º grau (função quadrática)	30.0	Sistemas de inequações	6. Sistemas de inequações
8. Função composta	31.0	Função composta	1. Função composta; A. Introdução; B. Definição; C. Domínio da função composta
9. Módulo de número real	32.0	Módulo - Definição	1. Módulo - Definição; A. Introdução; B. Definição; C. Propriedades
9. Módulo de número real	33.0	Função modular	2. Função modular; A. Definição; B. Composição com função modular
9. Módulo de número real	34.0	Gráfico de funções modulares	3. Gráfico de função modular
9. Módulo de número real	35.0	Equações modulares	4. Equação modular; A. Introdução; B. Propriedades; C. Equação modular
9. Módulo de número real	36.0	Inequações modulares	5. Inequação modular; A. Introdução; B. Propriedades; C. Inequação modular
10. Tipos de função	37.0	Classificação das funções	1. Classificação das funções; A. Introdução; B. Função injetora; C. Função sobrejetora; D. Função bijetora ou correspondência biunívoca
10. Tipos de função	38.0	Função inversa - Estudo analítico	2. Função inversa - Estudo analítico; A. Introdução; B. A inversa de uma função; C. Condição para existir a inversa de uma função; D. Determinando a inversa de uma função; E. Composição de função e sua inversa
10. Tipos de função	39.0	Função inversa - Estudo gráfico	3. Função inversa - Estudo gráfico
11. Função exponencial (Parte I)	40.0	Potenciação	1. Potenciação; A. Introdução; B. Definição; C. Propriedades de potenciação; D. Notação científica
11. Função exponencial (Parte I)	41.0	Radiciação	2. Radiciação; A. Introdução; B. Definições; C. Potências com expoente racional; D. Propriedades de radiciação; E. Racionalização de denominadores
11. Função exponencial (Parte I)	42.0	Equação exponencial	3. Equação exponencial; A. Introdução; B. Propriedade; D. Resolução de equação exponencial simples
11. Função exponencial (Parte II)	43.0	Equação exponencial com variável auxiliar	4. Equação exponencial com variável auxiliar; A. Introdução; B. Alguns exemplos de mudança de variável
11. Função exponencial (Parte II)	44.0	Função exponencial	5. Função exponencial; A. Introdução; B. Definição; C. Gráfico
11. Função exponencial (Parte II)	45.0	Inequações exponenciais	6. Inequação exponencial; A. Resolução de inequação exponencial
12. Logaritmos (Parte I)	46.0	Logaritmos - Definição	1. Logaritmos - Definição; A. Introdução; B. Definição; C. Logaritmo com notação especial; D. Condição de existência; E. Consequências imediatas da definição
12. Logaritmos (Parte I)	47.0	Propriedades operatórias dos logaritmos	2. Propriedades operatórias dos logaritmos; A. Introdução; B. Propriedades; C. Cologaritmo; D. Consequências imediatas das propriedades; E. Mudança de base; F. Consequência da mudança de base
12. Logaritmos (Parte I)	48.0	Equações logarítmicas	3. Equações logarítmicas; A. Introdução; B. Definição; C. Propriedade; D. Equação logarítmica imediata; E. Equação logarítmica não imediata
12. Logaritmos (Parte II)	49.0	Função logarítmica	4. Função logarítmica; A. Introdução; B. Definição
12. Logaritmos (Parte II)	50.0	Função logarítmica: análise gráfica	C. Gráfico da função logarítmica
12. Logaritmos (Parte II)	51.0	Inequações logarítmicas	5. Inequação logarítmica; A. Resolução de inequação logarítmica
13. Sequências numéricas (Parte I)	52.0	Sequências numéricas	1. Sequências; A. Introdução; B. Definição; C. Igualdade de sequências; D. Representação genérica; E. Lei de recorrência; F. Fórmula do termo geral
13. Sequências numéricas (Parte I)	53.0	Progressão aritmética - Definição, conceitos e termo geral	2. Progressão aritmética - Definição, conceitos e termo geral; A. Introdução; B. Definição; C. Classificação da PA; D. Termo geral da PA; E. Representação geométrica dos termos da PA
13. Sequências numéricas (Parte I)	54.0	Progressão aritmética - Notações auxiliares, propriedades e interpolação aritmética	3. Notações auxiliares, propriedades e interpolação aritmética; A. Notações auxiliares; B. Propriedades da PA; C. Interpolação aritmética
13. Sequências numéricas (Parte II)	55.0	Progressão aritmética - Soma dos n primeiros termos de uma PA	4. Soma dos n primeiros termos de uma PA; Soma dos n primeiros termos de uma PA
13. Sequências numéricas (Parte II)	56.0	Progressão geométrica - Definição, conceitos e termo geral	5. PG – Definição e termo geral; A. Introdução; B. Definição; C. Classificação de uma PG; D. Termo geral da PG
13. Sequências numéricas (Parte II)	57.0	Progressão geométrica - Notações auxiliares, propriedades e interpolação geométrica	6. Interpolação geométrica
13. Sequências numéricas (Parte II)	58.0	Progressão geométrica - Produto de n termos de uma PG e soma de n termos de uma PG	7. Notações auxiliares da PG
13. Sequências numéricas (Parte II)	59.0	Progressão geométrica - Soma de infinitos termos	8. Propriedades da PG; 9. Produto dos n primeiros termos de uma PG
13. Sequências numéricas (Parte II)	60.0	Progressões aritmética e geométrica - Problemas	10. Soma dos n primeiros termos de uma PG; 11. Soma dos infinitos termos de uma PG`;

function parseRawData(rawData, disciplineName, front) {
    const lines = rawData.trim().split('\n');
    const modules = [];
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        if (parts.length >= 4) {
            // "1. Razão e proporção" -> cap: "1"
            const capMatch = parts[0].match(/^(\d+)\./);
            let cap = "1";
            if (capMatch) {
                cap = capMatch[1];
            } else {
                cap = parts[0];
            }

            // "1.0" -> "1"
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
    console.log('Iniciando importacao de MAT 12B e MAT 11B para 1o AEM...');

    // 1. Achar a turma 1o AEM
    const { data: classList, error: errC } = await supabase.from('classes').select('*');
    if (errC) { console.error('Erro classes:', errC); return; }

    // Procura por '1o AEM' ou similar
    const targetClass = classList.find(c => c.name.includes('1º AEM') || c.name.includes('1AEM'));
    if (!targetClass) {
        console.error('Turma não encontrada para importação');
        return;
    }
    const classId = targetClass.id;
    console.log('Turma encontrada:', targetClass.name, 'ID:', classId);

    // 2. Prepara os modulos
    const modules12B = parseRawData(rawData12B, '1ª SÉRIE_MAT_12B', '12B');
    const modules11B = parseRawData(rawData11B, '1ª SÉRIE_MAT_11B', '11B');
    const allModules = [...modules12B, ...modules11B];

    // 3. Pegar as disciplinas
    const { data: currentDiscs, error: errD } = await supabase.from('disciplines').select('*');
    if (errD) { console.error('Erro disciplinas:', errD); return; }

    const discMap = new Map();
    currentDiscs.forEach(d => discMap.set(d.name, d.id));

    // Cleanup anterior (Substituir as dessas frentes para essa turma)
    const discToClean = [discMap.get('1ª SÉRIE_MAT_12B'), discMap.get('1ª SÉRIE_MAT_11B')].filter(Boolean);
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

    console.log(`Importacao concluida com: ${count} registros.`);
}

run();
