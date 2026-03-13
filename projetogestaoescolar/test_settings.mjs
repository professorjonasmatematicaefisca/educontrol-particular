import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const content = fs.readFileSync('.env.local', 'utf8');
const lines = content.split('\n');
let url = '', key = '';
for (const line of lines) {
    if (line.trim().startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.trim().startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function test() {
    const { data, error } = await supabase.from('settings').select('*').limit(1);
    console.log('Query settings:', JSON.stringify({ data, error }));
}
test();
