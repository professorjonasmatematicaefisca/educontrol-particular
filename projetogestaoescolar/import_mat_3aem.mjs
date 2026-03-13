import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rawData = `1.0	Cálculos Percentuais	Porcentagem. Definição. Formas de representar as porcentagens.
2.0	Aplicando Porcentagens	Porcentagem. Porcentagem de uma quantia. Lucro.
3.0	Cálculo de Aumentos e Descontos	Aumentos e descontos percentuais. Aumento percentual. Desconto percentual.
4.0	Problemas com Aumentos e Descontos Percentuais	Aumentos e descontos sucessivos. Aumentos sucessivos. Descontos sucessivos. Aumento e desconto sucessivos (desconto e aumento sucessivos).
5.0	Introdução aos Ângulos	Estudo dos ângulos. Conceitos primitivos, definições e notações. Postulados e teoremas. Ângulos.
6.0	Ângulos entre Paralelas e Transversais	Ângulos determinados por duas retas com uma transversal. Definição. Propriedades. Teorema.
7.0	Estudo dos triângulos	Estudo dos triângulos. Introdução. Definição e elementos fundamentais. Estudo dos ângulos. Triângulos congruentes. Definição. Casos de congruências. Consequências importantes.
8.0	Quadriláteros notáveis	Quadriláteros notáveis. Introdução. Definição e elementos. Classificação dos quadriláteros convexos. Propriedades dos paralelogramos. Propriedades dos losangos. Propriedades do retângulo.
9.0	Pontos notáveis de um triângulo	Baricentro, circuncentro, ortocentro e incentro.
10.0	Ângulos na circunferência	Ângulo central, ângulo inscrito, ângulo de segmento, ângulo exterior, ângulo interior.
11.0	Estudo dos polígonos	Definição de polígonos. Nomenclatura. Diagonais. Soma dos ângulos internos. Soma dos ângulos externos.
12.0	Polígonos regulares	Definição de polígonos regulares. Polígonos regulares.
13.0	Segmentos proporcionais	Teoremas de Tales e da bissetriz interna. Introdução. Definições. Teorema de Tales. Teorema da bissetriz interna.
14.0	Semelhança de triângulos	Semelhança de triângulos. Introdução. Figuras semelhantes. Casos de semelhança.
15.0	Relações métricas no triângulo retângulo	Relações métricas no triângulo retângulo. Introdução. Triângulos retângulos semelhantes. Relações métricas. Teorema de Pitágoras. Recíproca do teorema de Pitágoras.
16.0	Problemas de tangência	Problemas de tangência. Introdução. Problemas de tangência. Propriedades de corda em circunferência.
17.0	Razões trigonométricas no triângulo retângulo	Introdução. Seno, cosseno e tangente de um ângulo agudo. Outras razões trigonométricas: cotangente, secante e cossecante.
18.0	Aplicações das razões trigonométricas	Seno, cosseno, tangente e cotangente de ângulos complementares. Seno, cosseno e tangente de ângulos notáveis. Seno, cosseno e tangente de 30° e 60°. Seno, cosseno e tangente de 45°.
19.0	Teorema dos senos	Teorema dos senos. Introdução. Teorema dos senos.
20.0	Teorema dos cossenos	Teorema dos cossenos. Introdução. Teorema dos cossenos. Síntese. Natureza de um triângulo.
21.0	Identidades trigonométricas	Identidades trigonométricas.
22.0	Relações métricas na circunferência	Relações métricas na circunferência. Introdução. Teoremas. Tangência. Quadriláteros circunscritíveis.
23.0	Relações métricas nos polígonos regulares	Relações métricas nos polígonos regulares. Introdução. Apótema de um polígono regular. Cálculo do apótema dos principais polígonos regulares. Cálculo do raio da circunferência circunscrita.
24.0	Comprimento de uma circunferência	Comprimento de uma circunferência. Introdução. Limites do comprimento de uma circunferência. O comprimento da circunferência e o número π. Comprimento de um arco de circunferência.
25.0	Medidas de arcos e ângulos	Graus, grados e radianos. Graus. Grados. Conversões.
26.0	Seno, cosseno e tangente no ciclo trigonométrico	O ciclo trigonométrico. Introdução. Números reais no ciclo trigonométrico. Seno, cosseno e tangente no ciclo trigonométrico.
27.0	Redução ao primeiro quadrante	Redução ao primeiro quadrante: simetrias. Simetria em relação ao eixo das ordenadas. Simetria em relação à origem dos eixos coordenados. Simetria em relação ao eixo das abcissas.
28.0	Equações trigonométricas na primeira volta	Equações trigonométricas na primeira volta. Equação da forma sen x = a. Equação da forma cos x = a. Equação da forma tg x = a.
29.0	Operações com arcos	Introdução. Adição de arcos. Diferença de arcos.
30.0	Arco duplo	Arco duplo.
31.0	Arcos trigonométricos: determinação	Introdução. O arco trigonométrico. Expressões gerais. Expressão geral dos reais associados a um ponto. Expressão geral dos reais associados a extremidades de um diâmetro. Expressão geral dos reais associados a pontos que dividem a circunferência em partes iguais.
32.0	Equações e inequações trigonométricas em R	Equações trigonométricas em R. Introdução. Equação da forma sen x = sen α. Equação da forma cos x = cos α. Equação da forma tg x = tg α.
33.0	Funções trigonométricas	Introdução. Função seno. Função elementar f(x) = sen x. Função cosseno. Função elementar f(x) = cos x. Função tangente.
34.0	Gráficos de funções trigonométricas	Gráficos de funções trigonométricas. Função f(x) = a + sen x. Função f(x) = b sen x. Função f(x) = sen (mx). Função f(x) = sen (x + n). Função f(x) = a + b sen (mx + n) (b ≠ 0 e m ≠ 0). Função. Função f(x) = a + b tg (mx + n). Outras funções.
35.0	Áreas das regiões elementares	Áreas das regiões elementares. Introdução. Conceitos básicos. Noção intuitiva de área. Definição da área de uma região poligonal. Regiões poligonais equivalentes. Cálculo de áreas. Área de um retângulo. Área de um paralelogramo. Área de um triângulo. Área de um trapézio. Área de um losango. Divisão de uma região triangular em partes equivalentes.
36.0	Expressões de área de um triângulo	Expressões da área de um triângulo. Introdução. Área de um triângulo em função da medida de dois lados e do ângulo compreendido entre eles. Fórmula de Heron. Fórmula da área em função do raio da circunferência inscrita. Fórmula da área em função do raio da circunferência circunscrita. Fórmula da área de um triângulo equilátero de lado a.
37.0	Área do círculo e de suas partes	Área do círculo e de suas partes. Introdução. Área de um polígono regular. Área de um círculo. Área das partes do círculo.
38.0	Razão entre áreas de figuras semelhantes	Razão entre áreas de figuras semelhantes. Introdução. Triângulos semelhantes. Retângulos semelhantes. Círculos. Figuras planas semelhantes.
39.0	Postulados da determinação e posições relativas de duas retas	Postulados da determinação e posições relativas de duas retas. Introdução. Postulados. Posições relativas de duas retas. Determinação de planos.
40.0	Posições relativas de uma reta e um plano, e entre dois planos – Projeções e distâncias	Posições relativas de uma reta e um plano e entre dois planos – Projeções e distâncias. Introdução. Posições relativas de reta e plano. Posições relativas de dois planos. Perpendicularismo. Reta e plano perpendiculares. Teorema do perpendicularismo entre reta e plano. Planos perpendiculares. Projeções ortogonais. Projeção ortogonal de um ponto sobre um plano. Projeção ortogonal de uma figura sobre um plano. Distância entre um ponto e um plano.
41.0	Poliedro convexo	Poliedro convexo. Introdução. Superfície poliédrica. Poliedro convexo. Lema do teorema de Euler. Teorema de Euler. Propriedade. Poliedros de Platão. Poliedros regulares.
42.0	Prisma (I)	Prisma: definição e paralelepípedos. Introdução. Definição e elementos. Nomenclatura e classificação. Cubo. Paralelepípedos.
43.0	Prisma (II)	Prisma: caso geral. Introdução. Princípio de Cavalieri. Volume de um prisma qualquer. Área e volume de prismas regulares.
44.0	Pirâmide (I)	Pirâmide. Introdução. Definição. Elementos. Nomenclatura. Classificação. Área lateral e área total.
45.0	Pirâmide (II)	Volume. Teorema. Pirâmide triangular. Pirâmide qualquer. Sólidos especiais. Tetraedro regular. Octaedro regular. Tetraedro trirretangular.
46.0	Cilindro circular	Cilindro circular. Introdução. Generalidades. Definição. Elementos. Classificação. Área lateral e total. Área lateral. Área total. Volume. Cilindro equilátero.
47.0	Cone circular	Cone circular. Introdução. Generalidades. Definição. Elementos. Classificação. Áreas lateral e total. Fórmulas do setor circular. Área lateral. Área total. Volume. Cone equilátero.
48.0	Esfera	Esfera. Introdução. Generalidades. Definição. Superfície esférica. Secção da esfera. Elementos. Volume. Área da superfície esférica. Partes da esfera. Fuso esférico. Cunha esférica.
49.0	Sólidos semelhantes	Definição. Consequências.
50.0	Introdução à geometria analítica	Plano cartesiano. Distância entre dois pontos. Ponto médio de um segmento. Como obter um ponto em GA.
51.0	Área de polígonos	Área de um triângulo. Área de um polígono.
52.0	Teoria angular	Teoria angular. Inclinação de uma reta. Coeficiente angular de uma reta. Como calcular o coeficiente angular. Condição de alinhamento para três pontos. Condição de paralelismo de retas. Condição de perpendicularismo de retas.
53.0	Equação fundamental da reta	Equação fundamental de uma reta.
54.0	Formas de equação da reta	Formas de equação da reta.
55.0	Posições relativas entre duas retas; Distância entre ponto e reta	Posições relativas entre duas retas. Distância entre ponto e reta.
56.0	Equações reduzida e geral da circunferência	Equações reduzida e geral da circunferência. Introdução. Equação reduzida. Equação geral.
57.0	Revisão Enem	-
58.0	Revisão Enem	-
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
    console.log('Iniciando importação de conteúdos para 3º AEM...');

    const classId = '7cc52c85-6698-4aa9-bbdd-6ec8f3982dad'; // 3º AEM
    const disciplineId = '5fd3c144-2559-4716-8d28-ed365f45b8c1'; // Matemática 112

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
