import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const classId2AEM = 'b0e39a8a-931a-4ac4-8785-d487d716f5cb';

async function run() {
    console.log('--- Atribuindo MAT 12B e 11B do 2º AEM ao Jonas ---');

    // Obter IDs das disciplinas
    const { data: discs } = await supabase.from('disciplines').select('id, name')
        .in('name', ['Matemática 12B - 2º AEM', 'Matemática 11B - 2º AEM']);

    const discMap = {};
    discs.forEach(d => discMap[d.name] = d.id);

    const { data: teachers } = await supabase.from('users').select('*').eq('email', 'jonas@gmail.com');
    if (!teachers || teachers.length === 0) {
        console.error('Professor Jonas não encontrado.');
        return;
    }

    const jonas = teachers[0];
    const assignments = jonas.assignments || [];
    let updated = false;

    // Verificar e adicionar 12B
    const id12B = discMap['Matemática 12B - 2º AEM'];
    if (id12B && !assignments.some(a => a.subject === id12B && a.classId === classId2AEM)) {
        assignments.push({ classId: classId2AEM, subject: id12B });
        updated = true;
    }

    // Verificar e adicionar 11B
    const id11B = discMap['Matemática 11B - 2º AEM'];
    if (id11B && !assignments.some(a => a.subject === id11B && a.classId === classId2AEM)) {
        assignments.push({ classId: classId2AEM, subject: id11B });
        updated = true;
    }

    if (updated) {
        const { error } = await supabase.from('users').update({ assignments: assignments }).eq('id', jonas.id);
        if (error) console.error('Erro ao atualizar atribuições:', error);
        else console.log('Disciplinas do 2º AEM atribuídas com sucesso ao Jonas!');
    } else {
        console.log('Jonas já possui as disciplinas do 2º AEM atribuídas.');
    }
}

run();
