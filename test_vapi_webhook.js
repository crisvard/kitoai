// Teste rápido para verificar webhook no número VAPI
// Execute com: node test_vapi_webhook.js

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // ID do número na VAPI

if (!VAPI_API_KEY) {
  console.error('Configure VAPI_API_KEY');
  process.exit(1);
}

async function checkPhoneNumber() {
  const url = PHONE_NUMBER_ID 
    ? `https://api.vapi.ai/phone-number/${PHONE_NUMBER_ID}`
    : 'https://api.vapi.ai/phone-number';
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
  });
  
  const data = await res.json();
  
  if (Array.isArray(data)) {
    console.log('Números encontrados:', data.length);
    data.forEach(n => {
      console.log('\n--- Número:', n.number, '---');
      console.log('ID:', n.id);
      console.log('Provider:', n.provider);
      console.log('Webhook URL:', n.server?.url || 'NÃO CONFIGURADO');
      console.log('Server Messages:', n.serverMessages || 'NÃO CONFIGURADO');
    });
  } else {
    console.log('Número:', data.number);
    console.log('Webhook URL:', data.server?.url || 'NÃO CONFIGURADO');
    console.log('Server Messages:', data.serverMessages || 'NÃO CONFIGURADO');
  }
}

checkPhoneNumber().catch(console.error);