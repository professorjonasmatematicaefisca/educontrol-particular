import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.VITE_SUPABASE_URL) dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: classes, error: errClass } = await supabase
    .from('scheduled_classes')
    .select('*, students(name)')
    .eq('payment_status', 'PAID');

  if (errClass || !classes) {
    console.error("Error:", errClass);
    return;
  }

  const classesToRevert = classes.filter(c => {
    const sName = Array.isArray(c.students) ? c.students[0]?.name : c.students?.name;
    return sName === 'Lorena Cardoso' || sName === 'Inácio Cardoso';
  });

  console.log(`Found ${classesToRevert.length} classes to revert.`);
  if (classesToRevert.length === 0) return;

  const classIds = classesToRevert.map(c => c.id);

  const { error: txErr } = await supabase
    .from('finance_transactions')
    .delete()
    .in('class_id', classIds);
  
  if (txErr) console.error("Error deleting tyx:", txErr);
  else console.log("Deleted related finance transactions.");

  const { error: updErr } = await supabase
    .from('scheduled_classes')
    .update({ payment_status: 'PENDING', payment_account_id: null, paid_at: null })
    .in('id', classIds);

  if (updErr) console.error("Error reverting classes:", updErr);
  else console.log("Successfully reverted classes to PENDING.");
}

run();
