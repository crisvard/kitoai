import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.log('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    console.log("Checking user_agents...");
    const { data: agents } = await supabase.from('user_agents').select('id, name, agent_name, provider, phone_number_provider_id');
    console.log("Agents:", agents);

    console.log("Checking user_phone_numbers...");
    const { data: numbers } = await supabase.from('user_phone_numbers').select('id, number, provider, vapi_phone_number_id');
    console.log("Numbers:", numbers);
}

check();
