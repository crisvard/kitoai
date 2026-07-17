import fs from 'fs';

// Read .env manually
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=');
    env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
  }
}

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

async function checkLogs() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/agent_call_history?select=id,vapi_call_id,status,end_reason,created_at&order=created_at.desc&limit=50`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  const data = await response.json();
  console.log("Ultimas 5 chamadas:");
  console.log(JSON.stringify(data, null, 2));
}

checkLogs().catch(console.error);
