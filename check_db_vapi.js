import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hedxxbsieoazrmbayzab.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase
        .from('agent_call_history')
        .select('end_reason, status, started_at, vapi_call_id')
        .order('started_at', { ascending: false })
        .limit(3);
    console.log("Error:", error);
    console.log("History records:");
    console.dir(data, { depth: null });
}
run();
