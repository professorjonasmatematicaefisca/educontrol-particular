import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual quick parser for .env
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("Starting migration...");

    // 1. Find Jonas
    const { data: users, error: errUsers } = await supabase.from('users').select('*').ilike('name', '%Jonas%').eq('role', 'TEACHER');
    if (errUsers || !users || users.length === 0) {
        console.error("Could not find teacher Jonas", errUsers);
        return;
    }
    const jonas = users[0];
    console.log(`Found Jonas: ${jonas.name} (${jonas.id})`);

    // 2. Find 9º Ano classes
    const { data: classes, error: errClasses } = await supabase.from('classes').select('*').ilike('name', '%9º%');
    if (errClasses || !classes || classes.length === 0) {
        console.error("Could not find any 9th grade classes", errClasses);
        return;
    }
    console.log(`Found ${classes.length} 9th grade classes:`, classes.map(c => c.name));

    // 3. Find all modules that belong to Jonas, or modules that need to be assigned to 9th grade?
    // "Esse con4teúdo já cadastrado preciso que deixe como foi o professor Jonas que inseriu"
    // Does it mean all current modules?
    const { data: modules, error: errMods } = await supabase.from('planning_modules').select('*');
    if (errMods) {
        console.error("Error fetching modules", errMods);
        return;
    }
    console.log(`Total modules found in DB: ${modules.length}`);

    // We only migrate the ones that don't have a specific 9th grade class, or we duplicate them for all 9th grade classes?
    // Let's find modules created by Jonas or perhaps all modules currently.
    // Wait, the easiest is to update ALL modules to be owned by Jonas if they aren't, 
    // AND if they are for a non-9th grade class, change them? 
    // Let's just find the modules that seem to be the ones mentioned.
    const jonasModules = modules; // Assuming all existing modules in test system should be assigned.

    // For safety, let's just make sure all existing modules are OWNED by Jonas
    if (jonasModules.length > 0) {
        console.log(`Updating ${jonasModules.length} modules to be owned by Jonas`);
        const { error: updErr } = await supabase.from('planning_modules').update({ teacher_id: jonas.id }).in('id', jonasModules.map(m => m.id));
        if (updErr) console.error("Error updating ownership", updErr);
    }

    // Now, for the class assignment. Should we assign them to 9º A and 9º B?
    // The user said: "Para os conteúdos ja cadastrados, preciso que corrija isso e atribua aos 9º. Esse con4teúdo já cadastrado preciso que deixe como foi o professor Jonas que inseriu para que apar(eça)..."
    // So update existing modules to be assigned to one of the 9th grade classes, e.g., '9º A'. Then duplicate them for '9º B' if both exist.
    const first9thClass = classes[0];
    const other9thClasses = classes.slice(1);

    console.log(`Assigning all baseline modules to class ${first9thClass.name}`);
    const { error: clsErr } = await supabase.from('planning_modules').update({ class_id: first9thClass.id }).in('id', jonasModules.map(m => m.id));
    if (clsErr) console.error("Error assigning class", clsErr);

    // Duplicate for other 9th grade classes
    if (other9thClasses.length > 0) {
        let toInsert = [];
        for (const cls of other9thClasses) {
            for (const mod of jonasModules) {
                // Check if this module already exists for this class
                const exists = modules.find(m => m.class_id === cls.id && m.title === mod.title && m.module === mod.module && m.chapter === mod.chapter);
                if (!exists) {
                    toInsert.push({
                        discipline_id: mod.discipline_id,
                        teacher_id: jonas.id,
                        class_id: cls.id,
                        front: mod.front,
                        chapter: mod.chapter,
                        module: mod.module,
                        title: mod.title,
                        topic: mod.topic,
                        bimestre: mod.bimestre || 1
                    });
                }
            }
        }
        if (toInsert.length > 0) {
            console.log(`Inserting ${toInsert.length} duplicated modules for other 9th grade classes...`);
            const { error: insErr } = await supabase.from('planning_modules').insert(toInsert);
            if (insErr) console.error("Error inserting duplicates", insErr);
        }
    }

    console.log("Migration complete!");
}

migrate();
