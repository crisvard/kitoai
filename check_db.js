require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
    // Buscar contatos stuck em calling
    const { data, error } = await supabase.from('agent_contacts').select('*').eq('status', 'calling');
    console.log('Stuck contacts in calling:', data?.length);
    if (data && data.length > 0) {
        console.log(data[0]);

        // Check call history for this contact
        const { data: hist } = await supabase.from('agent_call_history').select('*').eq('contact_id', data[0].id).order('created_at', { ascending: false }).limit(1);
        console.log('Latest history for contact:', hist);
    }
}
check();
