import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hgohsmmtxggxlxkjptdt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnb2hzbW10eGdneGx4a2pwdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTI5NjcsImV4cCI6MjA4ODkyODk2N30.a1XveWLJJHpOewzRnz22KQPMCSKCnl63m6UKc2VLFoI";

const supabase = createClient(supabaseUrl, supabaseKey);

const assignmentId = 'a1ef6684-78f9-44bb-a68c-e613b8193391';

async function deleteAssignment() {
    console.log(`Deleting assignment ID: ${assignmentId}...`);
    const { error } = await supabase
        .from('simulado_assignments')
        .delete()
        .eq('id', assignmentId);

    if (error) {
        console.error("Error deleting assignment:", error);
    } else {
        console.log("Assignment deleted successfully.");
    }
}

deleteAssignment();
