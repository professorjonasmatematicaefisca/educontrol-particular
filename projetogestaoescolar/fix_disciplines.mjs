import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const correctId12B = '0525a6c4-bc97-474c-9aed-eadd4f3214aa'; // Matemática 12B - 1º AEM
const correctId11B = 'bec75529-271c-44c2-bfcb-684aaf111a2b'; // Matemática 11B - 1º AEM
const classId = 'd9da0a3d-dc7a-4d56-b035-714b1128ed24'; // 1º AEM

async function run() {
    console.log('Iniciando correção de IDs de disciplinas...');

    // 1. Procurar as disciplinas erradas recém criadas (1ª SÉRIE_MAT_12B e 1ª SÉRIE_MAT_11B)
    const { data: wrongDiscs } = await supabase.from('disciplines').select('id, name').in('name', ['1ª SÉRIE_MAT_12B', '1ª SÉRIE_MAT_11B']);

    if (!wrongDiscs || wrongDiscs.length === 0) {
        console.log('Não encontrei as disciplinas erradas.');
        return;
    }

    const wrongId12B = wrongDiscs.find(d => d.name === '1ª SÉRIE_MAT_12B')?.id;
    const wrongId11B = wrongDiscs.find(d => d.name === '1ª SÉRIE_MAT_11B')?.id;

    // 2. Apagar os planejamentos velhos das corretas na turma (para evitar duplicação em caso de retry)
    console.log('Limpando planejamentos antigos nas IDs corretas...');
    await supabase.from('planning_modules').delete().eq('class_id', classId).in('discipline_id', [correctId12B, correctId11B]);

    // 3. Atualizar os planning_modules mudando o discipline_id (errado -> correto)
    if (wrongId12B) {
        console.log(`Atualizando MAT 12B: ${wrongId12B} -> ${correctId12B}`);
        const { data, error } = await supabase.from('planning_modules')
            .update({ discipline_id: correctId12B })
            .eq('discipline_id', wrongId12B)
            .eq('class_id', classId);

        if (error) console.error('Erro ao atualizar 12B:', error);
    }

    if (wrongId11B) {
        console.log(`Atualizando MAT 11B: ${wrongId11B} -> ${correctId11B}`);
        const { data, error } = await supabase.from('planning_modules')
            .update({ discipline_id: correctId11B })
            .eq('discipline_id', wrongId11B)
            .eq('class_id', classId);

        if (error) console.error('Erro ao atualizar 11B:', error);
    }

    // 4. Apagar as disciplinas erradas da tabela de disciplinas
    if (wrongId12B || wrongId11B) {
        console.log('Deletando disciplinas erradas...');
        const idsToDelete = [wrongId12B, wrongId11B].filter(Boolean);
        const { error: delError } = await supabase.from('disciplines').delete().in('id', idsToDelete);
        if (delError) console.error('Erro ao deletar disciplinas:', delError);
        else console.log('Disciplinas erradas deletadas.');
    }

    console.log('Correção finalizada!');
}

run();
