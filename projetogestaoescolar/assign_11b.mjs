import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const correctId11B = 'bec75529-271c-44c2-bfcb-684aaf111a2b'; // Matemática 11B - 1º AEM
const classId = 'd9da0a3d-dc7a-4d56-b035-714b1128ed24'; // 1º AEM

async function run() {
    console.log('--- Atribuindo MAT 11B ao Jonas ---');
    const { data: teachers } = await supabase.from('users').select('*').eq('email', 'jonas@gmail.com');

    if (!teachers || teachers.length === 0) {
        console.error('Professor Jonas não encontrado.');
        return;
    }

    const jonas = teachers[0];
    const assignments = jonas.assignments || [];

    const has11B = assignments.some(a => (a.subject === correctId11B || a.subject === 'Matemática 11B - 1º AEM') && (a.classId === classId || a.classId === '1º AEM'));

    if (has11B) {
        console.log('Jonas já tem MAT 11B.');
        return;
    }

    assignments.push({
        classId: classId,
        subject: correctId11B
    });

    const { error } = await supabase.from('users').update({ assignments: assignments }).eq('id', jonas.id);

    if (error) {
        console.error('Erro ao atualizar atribuições:', error);
    } else {
        console.log('MAT 11B atribuída com sucesso ao Jonas!');
    }
}

run();
