
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vxtfhwetkupfufeusxws.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("--- DIAGNÓSTICO DE MÓDULOS E TURMAS ---");

    const normalize = (s) => s.replace(/[º°]/g, 'o').trim().toLowerCase();

    // 1. Listar Turmas
    const { data: classes } = await supabase.from('classes').select('id, name');
    console.log("\nTurmas no Banco:");
    classes.forEach(c => {
        console.log(`- ID: ${c.id} | Nome: "${c.name}" | Normalizado: "${normalize(c.name)}"`);
    });

    const targetClass = classes.find(c => normalize(c.name) === normalize("9º A EFII"));
    if (!targetClass) {
        console.log("\nERRO: Turma '9º A EFII' não encontrada!");
        return;
    }
    console.log(`\nTurma Alvo Identificada: ${targetClass.name} (ID: ${targetClass.id})`);

    // 2. Listar Sessões da Turma
    const { data: sessions } = await supabase
        .from('sessions')
        .select('id, date, subject, class_name, module_ids, general_notes')
        .eq('class_name', targetClass.name);

    console.log(`\nSessões encontradas para "${targetClass.name}": ${sessions.length}`);
    sessions.forEach(s => {
        console.log(`- ID: ${s.id} | Data: ${s.date} | Disciplina: ${s.subject}`);
        console.log(`  Módulos Salvos (IDs): ${JSON.stringify(s.module_ids)}`);
        console.log(`  Conteúdo (Texto): ${s.general_notes?.substring(0, 100)}...`);
    });

    // 3. Verificar planning_usage
    const { data: usage } = await supabase
        .from('planning_usage')
        .select('*')
        .eq('class_id', targetClass.id);

    console.log(`\nRegistros em planning_usage para esta turma: ${usage.length}`);
    usage.forEach(u => {
        console.log(`- Module ID: ${u.module_id} | Is Used: ${u.is_used}`);
    });

    // 4. Verificar se há disparidade
    const usedInSessions = new Set();
    sessions.forEach(s => {
        if (s.module_ids) s.module_ids.forEach(id => usedInSessions.add(id));
    });

    const inUsageTable = new Set(usage.map(u => u.module_id));

    console.log("\n--- ANÁLISE ---");
    console.log(`Módulos referenciados em sessões: ${usedInSessions.size}`);
    console.log(`Módulos marcados em planning_usage: ${inUsageTable.size}`);

    const missingInUsage = [...usedInSessions].filter(id => !inUsageTable.has(id));
    if (missingInUsage.length > 0) {
        console.log(`AVISO: Existem ${missingInUsage.length} módulos em sessões que NÃO estão na planning_usage.`);
    }

    const orphanInUsage = [...inUsageTable].filter(id => !usedInSessions.has(id));
    if (orphanInUsage.length > 0) {
        console.log(`AVISO: Existem ${orphanInUsage.length} módulos na planning_usage que NÃO pertencem a nenhuma sessão ativa desta turma.`);
        console.log("Isso explica por que eles 'sumiram' e não voltam ao deletar as sessões vistas na tela.");
    }
}

debug();
