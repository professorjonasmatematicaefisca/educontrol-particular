import { supabase } from './supabase_helper.mjs';

async function clearSchedules() {
    const { data, error } = await supabase.from('planning_schedule').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
        console.error("Error wiping schedules:", error);
    } else {
        console.log("Successfully wiped planning_schedule");
    }
}

clearSchedules();
