#!/usr/bin/env node

/**
 * Script de Teste VAPI - Chamada de Teste Automatizada
 * 
 * Como usar:
 * 1. Configure as variáveis abaixo
 * 2. Execute: node teste-vapi-chamada.mjs
 * 
 * O que faz:
 * - Cria um agente VAPI
 * - Adiciona um contato
 * - Inicia uma chamada de teste
 * - Monitora o webhook de resposta
 */

import fetch from 'node-fetch';
import readline from 'readline';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const config = {
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'sua-service-role-key',
  
  // VAPI
  vapiApiKey: process.env.VAPI_API_KEY || 'sk_live_sua_chave_aqui',
  
  // Usuário para teste
  userId: process.env.TEST_USER_ID || 'user-teste-vapi',
  
  // Número de telefone para teste (deve ser seu número real)
  testPhoneNumber: process.env.TEST_PHONE || '+5519999999999',
  
  // Contato para chamada (número que será chamado)
  contactPhoneNumber: process.env.CONTACT_PHONE || '+5519988776655',
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function supabaseRequest(endpoint, method = 'GET', body = null) {
  const url = `${config.supabaseUrl}/rest/v1${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${config.supabaseKey}`,
    'Content-Type': 'application/json',
    'apikey': config.supabaseKey,
  };
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function vapiRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.vapi.ai${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${config.vapiApiKey}`,
    'Content-Type': 'application/json',
  };
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`VAPI error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

function log(prefix, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${prefix}: ${message}`);
}

function logSuccess(message) { log('✅', message); }
function logError(message) { log('❌', message); }
function logInfo(message) { log('ℹ️', message); }

// ============================================================================
// TESTE PASSO A PASSO
// ============================================================================

async function runTest() {
  try {
    log('🚀', 'Iniciando teste VAPI...');
    
    // ====== PASSO 1: Validar configuração ======
    logInfo('Validando configuração...');
    if (config.vapiApiKey === 'sk_live_sua_chave_aqui') {
      logError('Configure VAPI_API_KEY! Execute: export VAPI_API_KEY=seu_valor');
      process.exit(1);
    }
    if (config.supabaseKey === 'sua-service-role-key') {
      logError('Configure SUPABASE_SERVICE_ROLE_KEY! Execute: export SUPABASE_SERVICE_ROLE_KEY=seu_valor');
      process.exit(1);
    }
    logSuccess('Configuração validada');
    
    // ====== PASSO 2: Testar conexão com VAPI ======
    logInfo('Testando conexão com VAPI...');
    try {
      const assistants = await vapiRequest('/assistant');
      logSuccess(`Conectado à VAPI (${assistants.length} assistentes existentes)`);
    } catch (e) {
      logError(`Falha ao conectar VAPI: ${e.message}`);
      process.exit(1);
    }
    
    // ====== PASSO 3: Testar conexão com Supabase ======
    logInfo('Testando conexão com Supabase...');
    try {
      // Tenta ler uma tabela simples
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/user_agents?select=count()`,
        {
          headers: {
            'Authorization': `Bearer ${config.supabaseKey}`,
            'apikey': config.supabaseKey,
          }
        }
      );
      if (response.ok) {
        logSuccess('Conectado ao Supabase');
      }
    } catch (e) {
      logError(`Falha ao conectar Supabase: ${e.message}`);
      process.exit(1);
    }
    
    // ====== PASSO 4: Criar agente VAPI ======
    logInfo('Criando agente VAPI...');
    const vapiAgent = await vapiRequest('/assistant', 'POST', {
      name: 'Agente Teste Chamada',
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        systemPrompt: 'Você é um assistente de teste para validar chamadas via VAPI.',
      },
      voice: {
        provider: '11labs',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
        model: 'eleven_turbo_v2_5',
        stability: 0.5,
        similarityBoost: 0.5,
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'pt-BR',
      },
      firstMessage: 'Olá! Este é um teste de chamada automatizada via VAPI.',
      recordingEnabled: true,
      serverUrl: `${config.supabaseUrl}/functions/v1/vapi-webhook`,
      serverMessages: ['end-of-call-report', 'status-update', 'hang', 'function-call'],
    });
    
    logSuccess(`Agente VAPI criado: ${vapiAgent.id}`);
    
    // ====== PASSO 5: Criar agente no banco de dados ======
    logInfo('Criando agente no Supabase...');
    const dbAgent = await supabaseRequest('/user_agents', 'POST', {
      user_id: config.userId,
      name: 'Teste Chamada - ' + new Date().toISOString(),
      status: 'idle',
      agent_provider: 'vapi',
      agent_provider_id: vapiAgent.id,
      system_prompt: 'Assistente de teste para validação de chamadas.',
      allocated_credits: 1000,
      daily_minutes_limit: 500,
    });
    
    logSuccess(`Agente criado no BD: ${dbAgent[0]?.id}`);
    const agentId = dbAgent[0].id;
    
    // ====== PASSO 6: Adicionar número de telefone ======
    logInfo('Adicionando número de telefone...');
    const phoneData = await supabaseRequest('/user_phone_numbers', 'POST', {
      user_id: config.userId,
      number: config.testPhoneNumber,
      provider: 'vapi',
      vapi_phone_number_id: 'test-phone-123', // Use ID real da VAPI
    });
    
    logSuccess(`Número adicionado: ${phoneData[0]?.id}`);
    const phoneId = phoneData[0]?.id;
    
    // ====== PASSO 7: Associar número ao agente ======
    logInfo('Associando número ao agente...');
    await supabaseRequest(`/user_agents?id=eq.${agentId}`, 'PATCH', {
      phone_number_provider_id: phoneId,
    });
    
    logSuccess('Número associado ao agente');
    
    // ====== PASSO 8: Adicionar contato ======
    logInfo('Adicionando contato para chamada...');
    const contact = await supabaseRequest('/agent_contacts', 'POST', {
      agent_id: agentId,
      name: 'Teste - ' + new Date().toLocaleTimeString(),
      phone: config.contactPhoneNumber,
      status: 'pending',
      attempt_count: 0,
    });
    
    logSuccess(`Contato criado: ${contact[0]?.id}`);
    const contactId = contact[0]?.id;
    
    // ====== PASSO 9: Iniciar chamada ======
    logInfo('Iniciando chamada via Supabase function...');
    
    // Para este teste, você precisaria invocar a edge function
    // que está configurada no Supabase. Aqui mostramos a chamada esperada:
    
    logInfo('Payload que seria enviado:');
    const startCallPayload = {
      agentId: agentId,
      vapiAssistantId: vapiAgent.id,
      maxConcurrent: 1,
      contactIds: [contactId],
    };
    console.log(JSON.stringify(startCallPayload, null, 2));
    
    logSuccess('Teste preparado! Para iniciar a chamada real:');
    logInfo('1. Configure a edge function start-agent-calls em Supabase');
    logInfo('2. Execute: await supabase.functions.invoke("start-agent-calls", { body: ' + JSON.stringify(startCallPayload) + ' })');
    
    // ====== PASSO 10: Aguardar webhook ======
    logInfo('Para monitorar eventos da chamada:');
    logInfo('SELECT * FROM vapi_webhook_logs WHERE agent_id = \'' + agentId + '\' ORDER BY received_at DESC;');
    
    // ====== RESUMO ======
    log('📊', '=== RESUMO DO TESTE ===');
    log('📊', `Agente VAPI ID: ${vapiAgent.id}`);
    log('📊', `Agente BD ID: ${agentId}`);
    log('📊', `Número: ${config.testPhoneNumber}`);
    log('📊', `Contato: ${config.contactPhoneNumber}`);
    log('📊', `Créditos Alocados: 1000`);
    
    logSuccess('Teste preparado com sucesso!');
    logSuccess('Próximo passo: Invocar edge function start-agent-calls');
    
  } catch (error) {
    logError(`Erro durante teste: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTAR
// ============================================================================

runTest();
