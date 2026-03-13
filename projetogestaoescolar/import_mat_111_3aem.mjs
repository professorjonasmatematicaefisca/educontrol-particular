import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rawData = `1.0	Conjuntos	Conjuntos. Introdução. Notação e representação. Relação de pertinência. Conjuntos notáveis. Conjuntos finito e infinito. Igualdade de dois conjuntos. Relação de inclusão. Conjunto das partes.
2.0	Operações entre conjuntos	Introdução. União (ou reunião) de conjuntos. Intersecção de conjuntos. Diferença de conjuntos. Conjunto complementar. Conjuntos finitos: número de elementos.
3.0	Aplicações das Operações com Conjuntos	Resolução de problemas involving união e intersecção de dois ou mais conjuntos. Interdisciplinaridade com sistema ABO.
4.0	Conjuntos numéricos	Introdução. Conjunto dos números naturais. Conjunto dos números inteiros. Conjunto dos números racionais. Número irracionais. Conjunto dos números reais.
5.0	Produtos notáveis	Produtos notáveis. Introdução. Definição.
6.0	Fatoração	Fatoração. Definição. Casos de fatoração.
7.0	Simplificação de expressões algébricas	Aplicar o desenvolvimento de produtos notáveis ou fatoração para simplificar expressões algébricas.
8.0	Equação do 1º grau	Equações. Introdução. Definição. Raiz (ou solução) de uma equação com uma incógnita. Equações equivalentes. Resolução de uma equação.
9.0	Equação e problemas do 1º grau com uma incógnita	Equação do 1º grau com uma incógnita. Discussão. Problemas do 1º grau.
10.0	Equações do 1° grau com duas incógnitas	Equação do 1º grau com duas incógnitas.
11.0	Equação do 2º grau	Equação do 2º grau com uma incógnita. Definição. Resolução.
12.0	Equação e problemas 2º grau	Equação do 2º grau com uma incógnita. Número de raízes. Relações entre coeficientes e raízes (relações de Girard). Resolução de equações com mudança de variável.
13.0	Equação irracional	Equação irracional.
14.0	Equações modulares	Equação modular.
15.0	Coordenadas e plano cartesiano	Relações binárias entre conjuntos. Coordenadas. Plano cartesiano.
16.0	Noções fundamentais de funções	Funções – Introdução. Noção de função. Definição. Formas de representar uma função. Entendendo o símbolo f(x). Representando um ponto do gráfico da função. Gráfico de uma função. Reconhecimento de uma função por meio do diagrama de flechas. Reconhecimento de uma função por meio do seu gráfico cartesiano.
17.0	Domínio de uma função real	Função – Domínio de uma função real. Domínio e conjunto imagem quando se conhece o gráfico da função. Função real. Função real e seu domínio. Raiz (ou zero) da função.
18.0	Estudo das funções constante e linear	Funções constante e linear. Taxa média de variação de uma função. Funções crescente, decrescente e constante. Função linear. Função identidade.
19.0	Função do 1º grau	Função polinomial do 1º grau ou função afim. Introdução. Função polinomial do 1º grau ou função afim. Raiz da função do 1º grau. Taxa de variação da função do 1º grau. Coeficientes. Gráfico de uma função do 1º grau. Estudo do sinal da função afim.
20.0	Problemas envolvendo funções do 1° grau	Coeficientes. Gráfico de uma função do 1º grau. Estudo do sinal da função afim.
21.0	Função do 2º grau	Função do 2º grau – Introdução. Introdução. Função quadrática ou função polinomial do 2º grau. Gráfico da função quadrática: concavidade. Significado geométrico das raízes. Ponto de intersecção do gráfico com o eixo das ordenadas. Forma fatorada de f(x) = a · x² + b · x + c. Vértice da parábola. Conjunto imagem.
22.0	Função do 2º grau: pontos extremos	Função do 2º grau – Pontos extremos. Introdução. Vértice da parábola. Valores extremos.
23.0	Problemas envolvendo funções do 2° grau	Função do 2º grau – Aplicações.
24.0	Inequações do 1º e 2º graus	Inequações do 1º e 2º graus. Introdução. Propriedades. Inequação do 1º grau. Inequação do 2º grau.
25.0	Inequação produto	Inequações produto e quociente. Introdução. Inequação produto.
26.0	Inequação quociente	Inequação quociente. Potências com expoentes inteiros. Método prático.
27.0	Equação exponencial	Equação exponencial. Introdução. Potenciação e algumas propriedades.
28.0	Função exponencial	Função exponencial. Introdução. Função exponencial. Gráfico.
29.0	Inequação exponencial	Inequação exponencial. Resolução de inequação exponencial.
30.0	Logaritmos: definição e condições de existência	Logaritmo. Introdução. Definição. Condição de existência. Logaritmo com representação especial. Consequências importantes da definição.
31.0	Logaritmos: propriedades	Propriedades dos logaritmos. Introdução. Propriedades. Demonstrações. Cologaritmo. Antilogaritmo. Consequências das propriedades.
32.0	Equação logarítmica	Equação logarítmica. Introdução. Propriedade.
33.0	Função logarítmica	Função logarítmica. Gráfico.
34.0	Inequação logarítmica	Inequação logarítmica. Introdução. Inequação logarítmica. Resolução de inequação logarítmica. Resumindo.
35.0	Problemas envolvendo exponenciais e logaritmos	Solução de problemas envolvendo logaritmos em diversos contextos (pH, intensidade sonora, escala Richter, crescimento populacional, meia-vida, dentre outros).
36.0	Funções definidas por várias sentenças	Apresentar o que são funções definidas por várias sentenças. Gráficos de funções definidas por várias sentenças. Problemas envolvendo funções definidas por várias sentenças.
37.0	Progressão aritmética: definição e termo geral	Progressão aritmética – Definição e termo geral. Introdução. Definição. Classificação. Termo geral. Representações especiais da PA. Propriedade.
38.0	Progressão aritmética: soma dos termos	Progressão aritmética – Soma dos termos. Termos equidistantes dos extremos. Propriedade. Soma dos n primeiros termos da PA.
39.0	Progressão geométrica: definição e termo geral	Progressão geométrica – Definição e termo geral. Definição. Classificação. Termo geral. Representações especiais da PG. Propriedades.
40.0	Progressão geométrica: soma dos termos	Progressão geométrica – Soma dos termos. Soma dos n primeiros termos da PG. Progressão geométrica convergente. Limite da soma dos infinitos termos da PG convergente.
41.0	Juros simples e compostos	Juros simples e compostos. Juros. Definição de juro. Conceitos. Juro simples. Juro composto.
42.0	Problemas envolvendo juros	Juros simples e compostos. Juros. Definição de juro. Conceitos. Juro simples. Juro composto.
43.0	Juros e progressões	Relacionar juros e sequências. Resolver problemas envolvendo aplicações com rendimentos sucessivos. Inflação e impostos.
44.0	Matrizes: conceitos e operações básicas	Matrizes: conceitos e operações básicas. Introdução. Conceito. Apresentação. Classificação. Igualdade de matrizes. Adição e subtração de matrizes. Multiplicação de uma matriz por uma constante.
45.0	Matrizes: multiplicação	Introdução. Definição e existência. Propriedades.
46.0	Determinantes - Definição e cálculo de determinantes de matrizes de ordem 1, 2 e 3	Introdução. Definições. Determinante de uma matriz de ordem 1. Determinante de uma matriz de ordem 2. Determinante de uma matriz de ordem 3.
47.0	Determinantes - Teorema de Laplace	Menor complementar e cofator. Teorema de Laplace.
48.0	Determinantes - Teorema de Jacobi e propriedades dos determinantes	Teorema de Jacobi. Propriedade dos determinantes. Determinante de Vandermonde. Teorema de Binet. Regra de Chió.
49.0	Matriz inversa	Cálculo da matriz inversa de ordem 2. Problemas simples envolvendo matriz inversa e multiplicação de matrizes.
50.0	Sistemas lineares: método do Escalonamento	Equação linear. Sistema linear m × n. Sistema linear 2 × 2. Regra de Cramer. Sistema linear homogêneo.
51.0	Sistemas lineares: discussão	Discussão de um sistema linear. Sistema com o número de equações igual ao número de incógnitas. Sistema com o número de equações diferente do número de incógnitas.
52.0	Números complexos I	Números complexos. Unidade imaginária. A unidade imaginária na resolução de equações. Conjunto dos número complexos. Forma algébrica. Igualdade de números complexos. Operações com números complexos. Número complexo conjugado. Potências da unidade imaginária.
53.0	Números complexos II	Divisão de números complexos. Plano de Argand-Gauss (plano complexcomplexo). Módulo de um número complexo. Argumento de um número complexo. Números complexos – Forma trigonométrica.
54.0	Polinômios - Definição	Introdução. Polinômios – Definição. Polinômios ou função polinomial. Monômios. Valor numérico de um polinômio. Raiz ou zero de um polinômio. Polinômio identicamente nulo. Polinômios idênticos. Polinômios – Operações. Adição (subtração) de polinômios. Multiplicação de polinômios.
55.0	Polinômios – Divisão	Divisão de polinômios. Divisão pelo método da chave. Considerações sobre o grau. O método de Descartes. Dispositivo prático de Briot-Ruffini. Briot-Ruffini para o binômio ax + b (a ≠ 0, b ≠ 0 e a ≠ 1). Teorema do resto. Teorema de D’Alembert.
56.0	Polinômios – Critérios de divisibilidade	Critérios de divisibilidade. Divisibilidade por (x – a) · (x – b). Divisões sucessivas.
57.0	Revisão Enem	-
58.0	Revisão Enem	(em branco)
59.0	Revisão Enem	-
60.0	Revisão Enem	-`;

function parseRawData(data) {
    const lines = data.trim().split('\n');
    const modules = [];
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        if (parts.length >= 2) {
            const modLabel = parts[0].trim();
            const modMatch = modLabel.match(/^(\d+)/);
            let modNum = modMatch ? modMatch[1] : modLabel;

            // Determine chapter as the integer part of the module
            let chapter = modNum;

            modules.push({
                chapter: chapter,
                module: modNum,
                title: parts[1].trim(),
                topic: parts[2] ? parts[2].trim() : '-'
            });
        }
    }
    return modules;
}

async function run() {
    console.log('Iniciando importação de conteúdos para 3º AEM - Matemática 111...');

    const classId = '7cc52c85-6698-4aa9-bbdd-6ec8f3982dad'; // 3º AEM
    const disciplineId = '932c14e4-1cd6-4dc1-83be-ec86430d79a7'; // Matemática 111

    const modules = parseRawData(rawData);
    console.log(`Parsed ${modules.length} modules.`);

    // 1. Cleanup existing modules for this discipline and class
    console.log('Limpando registros antigos...');
    const { error: deleteError } = await supabase
        .from('planning_modules')
        .delete()
        .eq('class_id', classId)
        .eq('discipline_id', disciplineId);

    if (deleteError) {
        console.error('Erro ao limpar registros:', deleteError.message);
        return;
    }

    // 2. Insert new modules
    let count = 0;
    for (const item of modules) {
        const { error } = await supabase.from('planning_modules').insert({
            discipline_id: disciplineId,
            class_id: classId,
            teacher_id: null,
            front: 'AEM', // Default front for AEM
            chapter: item.chapter,
            module: item.module,
            title: item.title,
            topic: item.topic
        });

        if (!error) {
            count++;
        } else {
            console.error(`Erro ao inserir módulo ${item.module}:`, error.message);
        }
    }

    console.log(`Importação concluída: ${count} de ${modules.length} registros inseridos.`);
    process.exit(0);
}

run();
