// Step 1: Rename disciplines to short names (ART_55B)
// Step 2: Create planning_locks table
// Step 3: Update teacher assignments
// Run: node rename_and_setup.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log('\n=== ETAPA 1: Renomear disciplinas ===\n');

    const { data: discs } = await supabase.from('disciplines').select('*');
    let renamed = 0;
    for (const d of discs) {
        // Remove "1ª SÉRIE_" prefix if present
        const shortName = d.name.replace(/^1ª SÉRIE_/, '');
        if (shortName !== d.name) {
            const { error } = await supabase.from('disciplines').update({ name: shortName }).eq('id', d.id);
            if (!error) { renamed++; console.log(`  ${d.name} → ${shortName}`); }
            else console.error(`  ERRO em ${d.name}:`, error.message);
        }
    }
    console.log(`✓ ${renamed} disciplinas renomeadas\n`);

    // Verify
    const { data: updated } = await supabase.from('disciplines').select('name').order('name');
    console.log('Disciplinas atuais:');
    updated.forEach(d => console.log(`  ${d.name}`));

    console.log('\n=== ETAPA 2: Criar tabela planning_locks ===\n');

    // Try creating via RPC or direct SQL — we'll use app_settings approach
    // First check if it exists
    const { data: existing, error: checkErr } = await supabase.from('planning_locks').select('*').limit(1);
    if (checkErr && checkErr.code === '42P01') {
        // Table doesn't exist — we'll need to create it via dashboard
        console.log('⚠ Tabela planning_locks não existe. Criando via insert...');
    }

    // Try to insert - if table exists, this works; if not, we handle it
    const { error: insertErr } = await supabase.from('planning_locks').upsert({
        id: 'global',
        locked: false,
        locked_by: null,
        teacher_id: null,
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (insertErr) {
        console.log('⚠ Tabela planning_locks precisa ser criada manualmente no Supabase.');
        console.log('  Vamos usar app_settings como alternativa...');

        // Try app_settings
        const { error: settErr } = await supabase.from('app_settings').upsert({
            key: 'planning_locked_global',
            value: 'false'
        }, { onConflict: 'key' });

        if (settErr) {
            console.log('⚠ Nem app_settings existe. Criaremos via Supabase MCP.');
        } else {
            console.log('✓ Configuração de bloqueio global criada em app_settings');
        }
    } else {
        console.log('✓ Tabela planning_locks configurada');
    }

    console.log('\n=== ETAPA 3: Atualizar assignments dos professores ===\n');

    const { data: teachers } = await supabase.from('users').select('*').in('role', ['TEACHER', 'COORDINATOR']);
    const { data: classes } = await supabase.from('classes').select('*');
    const { data: newDiscs } = await supabase.from('disciplines').select('*');

    for (const teacher of teachers) {
        const assignments = teacher.assignments || [];
        let changed = false;
        const newAssignments = assignments.map(a => {
            let subject = a.subject;
            // If subject has "1ª SÉRIE_" prefix, remove it
            if (subject.startsWith('1ª SÉRIE_')) {
                subject = subject.replace('1ª SÉRIE_', '');
                changed = true;
            }
            // Resolve classId to UUID if it's a name
            const matchedClass = classes.find(c => c.name === a.classId || c.id === a.classId);
            const classId = matchedClass?.id || a.classId;
            if (classId !== a.classId) changed = true;

            return { ...a, subject, classId };
        });

        if (changed) {
            await supabase.from('users').update({ assignments: newAssignments }).eq('id', teacher.id);
            console.log(`✓ ${teacher.name}: assignments atualizados`);
            newAssignments.forEach(a => console.log(`    classId: ${a.classId} | subject: ${a.subject}`));
        }
    }

    console.log('\n=== CONCLUÍDO ===');
    process.exit(0);
}
run();
