import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hgohsmmtxggxlxkjptdt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnb2hzbW10eGdneGx4a2pwdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTI5NjcsImV4cCI6MjA4ODkyODk2N30.a1XveWLJJHpOewzRnz22KQPMCSKCnl63m6UKc2VLFoI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function findIds() {
    console.log("Searching for student: Anabela Carvalho...");
    const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, name')
        .ilike('name', '%Anabela Carvalho%');

    if (studentError) {
        console.error("Error finding student:", studentError);
        return;
    }

    if (students.length === 0) {
        console.log("Student not found.");
    } else {
        console.log("Students found:", students);
    }

    console.log("\nSearching for simulado: Equação Exponencial...");
    const { data: simulados, error: simuladoError } = await supabase
        .from('simulados')
        .select('id, title, content_topic')
        .or('title.ilike.%Equação Exponencial%,content_topic.ilike.%Equação Exponencial%');

    if (simuladoError) {
        console.error("Error finding simulado:", simuladoError);
        return;
    }

    if (simulados.length === 0) {
        console.log("Simulado not found.");
    } else {
        console.log("Simulados found:", simulados);
    }

    if (students.length > 0 && simulados.length > 0) {
        const studentId = students[0].id;
        const simuladoId = simulados[0].id;

        console.log(`\nSearching for assignment for student ${studentId} and simulado ${simuladoId}...`);
        const { data: assignments, error: assignmentError } = await supabase
            .from('simulado_assignments')
            .select('*')
            .eq('student_id', studentId)
            .eq('simulado_id', simuladoId);

        if (assignmentError) {
            console.error("Error finding assignment:", assignmentError);
            return;
        }

        if (assignments.length === 0) {
            console.log("Assignment not found.");
        } else {
            console.log("Assignments found:", assignments);
        }
    }
}

findIds();
