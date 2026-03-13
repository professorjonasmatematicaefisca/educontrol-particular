
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock Data Imports (Ensure paths are correct relative to scripts folder)
import { SEED_CLASSES, SEED_TEACHERS, SEED_STUDENTS } from '../services/mockData';

// --- Env Loading Helper ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl = '';
let supabaseKey = '';

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    for (const line of lines) {
        if (line.startsWith('VITE_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim();
        } else if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
            supabaseKey = line.split('=')[1].trim();
        }
    }
} catch (e) {
    console.error("Could not read .env.local", e);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("Starting migration...");

    // 1. Migrate Classes
    console.log("Migrating Classes...");
    const { data: existingClasses } = await supabase.from('classes').select('name');
    const existingClassNames = new Set(existingClasses?.map((c: any) => c.name));

    const classesToInsert = SEED_CLASSES.filter(c => !existingClassNames.has(c.name)).map(c => ({
        name: c.name,
        period: c.period
    }));

    if (classesToInsert.length > 0) {
        const { error } = await supabase.from('classes').insert(classesToInsert);
        if (error) console.error("Error migrating classes:", error);
        else console.log(`Migrated ${classesToInsert.length} classes.`);
    } else {
        console.log("All classes already exist.");
    }

    // 2. Migrate Teachers (Users)
    console.log("Migrating Teachers...");
    const { data: existingUsers } = await supabase.from('users').select('email');
    const existingEmails = new Set(existingUsers?.map((u: any) => u.email));

    const teachersToInsert = SEED_TEACHERS.filter(t => !existingEmails.has(t.email)).map(t => ({
        name: t.name,
        email: t.email,
        password: '123', // Default
        role: 'TEACHER',
        subject: t.subject,
        assignments: t.assignments,
        photo_url: t.photoUrl
    }));

    if (teachersToInsert.length > 0) {
        const { error } = await supabase.from('users').insert(teachersToInsert);
        if (error) console.error("Error migrating teachers:", error);
        else console.log(`Migrated ${teachersToInsert.length} teachers.`);
    } else {
        console.log("All teachers already exist.");
    }

    // 3. Migrate Students
    console.log("Migrating Students...");
    const { data: existingStudents } = await supabase.from('students').select('name');
    const existingStudentNames = new Set(existingStudents?.map((s: any) => s.name));

    const studentsToInsert = SEED_STUDENTS.filter(s => !existingStudentNames.has(s.name)).map(s => ({
        name: s.name,
        photo_url: s.photoUrl,
        parent_email: s.parentEmail,
        class_name: s.className
    }));

    if (studentsToInsert.length > 0) {
        const { error } = await supabase.from('students').insert(studentsToInsert);
        if (error) console.error("Error migrating students:", error);
        else console.log(`Migrated ${studentsToInsert.length} students.`);
    } else {
        console.log("All students already exist.");
    }

    // 4. Migrate Occurrences
    console.log("Migrating Occurrences...");
    const { data: existingOccurrences } = await supabase.from('occurrences').select('id');
    const existingOccIds = new Set(existingOccurrences?.map((o: any) => o.id));

    // We don't have SEED_OCCURRENCES imported yet, let's check mockData
    const { SEED_OCCURRENCES } = await import('../services/mockData');

    const occurrencesToInsert = SEED_OCCURRENCES.filter(o => !existingOccIds.has(o.id)).map(o => ({
        id: o.id,
        type: o.type,
        description: o.description,
        student_ids: o.studentIds,
        date: o.date,
        status: o.status,
        photos: o.photos,
        reported_by: o.reportedBy
    }));

    if (occurrencesToInsert.length > 0) {
        const { error } = await supabase.from('occurrences').insert(occurrencesToInsert);
        if (error) console.error("Error migrating occurrences:", error);
        else console.log(`Migrated ${occurrencesToInsert.length} occurrences.`);
    } else {
        console.log("All occurrences already exist.");
    }

    console.log("Migration finished.");
}

migrate();
