import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const testRecord = {
    date: '2026-02-02T08:00:00Z',
    teacher_id: '9d3a7599-b98d-43fe-9b5e-86ddddd27334', // Jonas Ferreira
    subject: 'Matemática 9º EFII', // Specific discipline for 9º EFII
    class_name: '9º A EFII',
    block: '1º Bloco',
    general_notes: 'Conteúdo: Razão e grandeza entre mesma espécies espécies diferentes e escala - Módulos 1 e 2. (Importado de: RELATORIO_9_A_EFII_20260202.pdf)',
    blocks_count: 2
};

async function run() {
    console.log('--- TEST IMPORT (9º ANO) ---');

    // 1. Insert into sessions
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert([testRecord])
        .select()
        .single();

    if (sessionError) {
        console.error('Error inserting session:', sessionError);
        return;
    }

    console.log('Session inserted successfully:', session.id);

    // 2. Fetch students for this class to create session_records (attendance)
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('class_name', testRecord.class_name);

    if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
    }

    if (students && students.length > 0) {
        const records = students.map(s => ({
            session_id: session.id,
            student_id: s.id,
            present: true,
            present2: true,
            counters: {}
        }));

        const { error: recordsError } = await supabase
            .from('session_records')
            .insert(records);

        if (recordsError) {
            console.error('Error inserting attendance records:', recordsError);
        } else {
            console.log(`Attendance records inserted for ${students.length} students.`);
        }
    }

    console.log('--- COMPLETE ---');
    process.exit(0);
}

run();
