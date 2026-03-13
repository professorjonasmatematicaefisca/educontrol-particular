import { createClient } from '@supabase/supabase-js';

// Old Project (SOURCE)
const OLD_URL = 'https://vxtfhwetkupfufeusxws.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI';

// New Project (TARGET)
const NEW_URL = 'https://hgohsmmtxggxlxkjptdt.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnb2hzbW10eGdneGx4a2pwdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTI5NjcsImV4cCI6MjA4ODkyODk2N30.a1XveWLJJHpOewzRnz22KQPMCSKCnl63m6UKc2VLFoI';

const source = createClient(OLD_URL, OLD_KEY);
const target = createClient(NEW_URL, NEW_KEY);

async function migrateTable(tableName, orderField = 'created_at') {
    console.log(`Migrando tabela: ${tableName}...`);
    const { data, error } = await source.from(tableName).select('*');
    if (error) {
        console.error(`Erro ao buscar dados de ${tableName}:`, error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log(`Tabela ${tableName} está vazia no destino.`);
        return;
    }

    // Para evitar erros de FK e duplicatas, vamos usar upsert
    const { error: insertError } = await target.from(tableName).upsert(data, { onConflict: tableName === 'users' ? 'email' : 'id' });
    
    if (insertError) {
        console.error(`Erro ao inserir dados em ${tableName}:`, insertError.message);
    } else {
        console.log(`✓ ${data.length} registros migrados para ${tableName}.`);
    }
}

async function run() {
    console.log('--- INICIANDO MIGRAÇÃO DE DADOS ---');

    // 1. Independent Tables
    await migrateTable('classes');
    await migrateTable('disciplines');
    await migrateTable('users');

    // 2. Dependent Tables
    await migrateTable('students');
    await migrateTable('enrollments');
    await migrateTable('planning_modules');

    // 3. Further Dependent
    await migrateTable('planning_schedule');
    await migrateTable('sessions');
    await migrateTable('session_records');
    await migrateTable('game_sessions');
    await migrateTable('game_participants');
    await migrateTable('study_guide_items');
    await migrateTable('requests');

    console.log('--- MIGRAÇÃO CONCLUÍDA ---');
}

run();
