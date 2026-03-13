import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const correctId12B = '0525a6c4-bc97-474c-9aed-eadd4f3214aa'; // Matemática 12B - 1º AEM
const correctId11B = 'bec75529-271c-44c2-bfcb-684aaf111a2b'; // Matemática 11B - 1º AEM
const classId = 'd9da0a3d-dc7a-4d56-b035-714b1128ed24'; // 1º AEM

async function run() {
    console.log('--- Verificando Módulos de MAT 12B ---');
    const { data: mods12B } = await supabase.from('planning_modules').select('*').eq('class_id', classId).eq('discipline_id', correctId12B);
    console.log(`Encontrados: ${mods12B?.length}`);

    console.log('\n--- Verificando Módulos de MAT 11B ---');
    const { data: mods11B } = await supabase.from('planning_modules').select('*').eq('class_id', classId).eq('discipline_id', correctId11B);
    console.log(`Encontrados: ${mods11B?.length}`);

    console.log('\n--- Verificando Atribuições de Professores ---');
    const { data: teachers } = await supabase.from('users').select('id, name, email, assignments').in('role', ['TEACHER']);

    teachers?.forEach(t => {
        const has11B = t.assignments?.some(a => (a.subject === correctId11B || a.subject === 'Matemática 11B - 1º AEM') && (a.classId === classId || a.classId === '1º AEM'));
        const has12B = t.assignments?.some(a => (a.subject === correctId12B || a.subject === 'Matemática 12B - 1º AEM') && (a.classId === classId || a.classId === '1º AEM'));

        if (has11B || has12B) {
            console.log(`Prof: ${t.name} (${t.email}):`);
            console.log(`   - Tem MAT 11B: ${has11B ? 'SIM' : 'NÃO'}`);
            console.log(`   - Tem MAT 12B: ${has12B ? 'SIM' : 'NÃO'}`);
            console.log('---');
        }
    });

    console.log('\n--- Verificando Disciplinas na Tabela ---');
    const { data: discs } = await supabase.from('disciplines').select('*').in('id', [correctId11B, correctId12B]);
    discs?.forEach(d => console.log(`ID: ${d.id} | Nome: ${d.name}`));
}

run();
