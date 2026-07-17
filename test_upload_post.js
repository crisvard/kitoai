// Script de teste da API Upload-Post (com mock)
import dotenv from 'dotenv';

dotenv.config();

const USE_MOCK_API = process.env.VITE_USE_MOCK_API === 'true';

async function schedulePost(postData) {
  if (USE_MOCK_API) {
    // Simular agendamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    const postId = `mock_${Date.now()}`;
    console.log('📤 [MOCK] Post agendado:', postData);
    return { postId };
  }

  // Código da API real...
  return { postId: 'real_api_not_implemented' };
}

async function getPostStatus(postId) {
  if (USE_MOCK_API) {
    // Simular status baseado no tempo
    const now = Date.now();
    const postTime = parseInt(postId.split('_')[1] || '0');
    const elapsed = now - postTime;

    let status = 'pending';
    if (elapsed > 10000) status = 'scheduled'; // 10s depois: scheduled
    if (elapsed > 20000) status = 'published'; // 20s depois: published

    console.log('📊 [MOCK] Status do post:', status);
    return { status };
  }

  return { status: 'unknown' };
}

async function testAPI() {
  console.log('🧪 Testando API Upload-Post...');
  console.log('Mock API:', USE_MOCK_API ? 'Ativada ✅' : 'Desativada ❌');

  try {
    // Teste de agendamento
    console.log('📤 Agendando post de teste...');
    const result = await schedulePost({
      platforms: ['instagram'],
      content: 'Teste de post via API - ' + new Date().toISOString(),
      hashtags: ['#teste'],
      mediaUrls: [],
      scheduledAt: new Date(Date.now() + 60000).toISOString(), // 1 min no futuro
    });

    console.log('✅ Post agendado com ID:', result.postId);

    // Teste de status
    console.log('📊 Verificando status inicial...');
    let status = await getPostStatus(result.postId);
    console.log('📊 Status inicial:', status.status);

    // Aguardar e verificar novamente
    console.log('⏳ Aguardando 15 segundos para mudança de status...');
    setTimeout(async () => {
      status = await getPostStatus(result.postId);
      console.log('📊 Status após 15s:', status.status);

      setTimeout(async () => {
        status = await getPostStatus(result.postId);
        console.log('📊 Status após 25s:', status.status);
        console.log('🎉 Teste concluído!');
      }, 10000);
    }, 15000);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testAPI();