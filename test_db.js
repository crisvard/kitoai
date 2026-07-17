import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('user_agents').select('id, agent_name, status, phone_number_provider_id');
  console.log('Agents:', data, error);
  if (data && data.length > 0) {
    const { data: contacts } = await supabase.from('agent_contacts').select('*').eq('agent_id', data[0].id);
    console.log('Contacts for agent 0:', contacts);
  }
}
run();
