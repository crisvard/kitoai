#!/usr/bin/env node

const https = require('https');

const projectRef = 'hedxxbsieoazrmbayzab';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.hPvFj9wPkM3z0V5LX5hJlZNRdHOLhD2bFQXMxjp6Iu8';

const secrets = {
  STRIPE_PUBLISHABLE_KEY: 'pk_live_51SfTiJABFcfGgf231n03PL9pKY6Q98L7CDsKrqcKnGCcYWBVTVBiiUJAPHAR5yhImUCjxnxGjWgFy2WamZTeN4h100UrOFkIte',
  STRIPE_SECRET_KEY: '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',
  STRIPE_WEBHOOK_SECRET: 'whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB'
};

console.log('🔧 Configurando secrets do Stripe no Supabase...\n');

// Usar Management API do Supabase
const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/secrets`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json'
  }
};

const postData = JSON.stringify(
  Object.entries(secrets).map(([name, value]) => ({ name, value }))
);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ Secrets configuradas com sucesso!');
      console.log('\nSecrets criadas:');
      Object.keys(secrets).forEach(key => {
        console.log(`  - ${key}`);
      });
    } else {
      console.log('\n❌ Erro ao configurar secrets');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro:', e.message);
});

req.write(postData);
req.end();
