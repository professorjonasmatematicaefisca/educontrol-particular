// Diagnostic script - run with: node debug_inspect.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    // Fetch classes
    const { data: classes } = await supabase.from('classes').select('id, name');
    console.log('\n=== CLASSES ===');
    classes.forEach(c => console.log(`  ID: ${c.id} | Name: ${c.name}`));

    // Fetch disciplines
    const { data: disciplines } = await supabase.from('disciplines').select('id, name');
    console.log('\n=== DISCIPLINES ===');
    disciplines.forEach(d => console.log(`  ID: ${d.id} | Name: ${d.name}`));

    // Fetch users with assignments
    const { data: users } = await supabase.from('users').select('id, name, email, assignments').eq('role', 'TEACHER');
    console.log('\n=== TEACHERS & ASSIGNMENTS ===');
    users.forEach(u => {
        console.log(`\nTeacher: ${u.name} (${u.email})`);
        (u.assignments || []).forEach(a => {
            console.log(`  classId: "${a.classId}" | subject: "${a.subject}"`);
        });
    });

    // Fetch some planning modules
    const { data: mods } = await supabase.from('planning_modules').select('id, class_id, discipline_id, title').limit(5);
    console.log('\n=== PLANNING MODULES (first 5) ===');
    mods.forEach(m => {
        const className = classes.find(c => c.id === m.class_id)?.name || m.class_id;
        const discName = disciplines.find(d => d.id === m.discipline_id)?.name || m.discipline_id;
        console.log(`  class: "${className}" | disc: "${discName}" | title: "${m.title}"`);
    });

    console.log(`\nTotal modules: ${mods.length} (showing 5)`);
    process.exit(0);
}
run();
