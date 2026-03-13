import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log('--- Listando Disciplinas ---');
    const { data: disciplines, error } = await supabase.from('disciplines').select('*').ilike('name', '%Matemática%');

    if (error) {
        console.error('Erro ao buscar dsiciplinas:', error);
        return;
    }

    disciplines.forEach(d => {
        console.log(`ID: ${d.id} | Nome: ${d.name}`);
    });

    console.log('\n--- Listando Turmas ---');
    const { data: classes } = await supabase.from('classes').select('*').ilike('name', '%1º AEM%');
    classes.forEach(c => {
        console.log(`ID: ${c.id} | Nome: ${c.name}`);
    });
}
run();
