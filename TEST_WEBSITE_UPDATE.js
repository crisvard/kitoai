// Script de teste para verificar se a atualização no Supabase está funcionando
// Cole isto no Console do navegador (F12) quando estiver logado

const testUpdateWebsiteActive = async () => {
  const { supabase } = window;
  
  // Obter usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ Usuário não autenticado');
    return;
  }
  
  console.log('👤 Usuário:', user.id);
  
  // Tentar atualizar website_active
  const now = new Date();
  console.log('📝 Tentando atualizar com valores:');
  console.log('   website_active: true');
  console.log('   website_activation_date:', now.toISOString());
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      website_active: true,
      website_activation_date: now.toISOString(),
    })
    .eq('id', user.id)
    .select();
  
  if (error) {
    console.error('❌ ERRO na atualização:', error);
    return;
  }
  
  console.log('✅ Atualização bem-sucedida!');
  console.log('📊 Dados retornados:', data);
  
  // Verificar se realmente foi salvo
  const { data: checkData, error: checkError } = await supabase
    .from('profiles')
    .select('website_active, website_activation_date')
    .eq('id', user.id)
    .single();
  
  if (checkError) {
    console.error('❌ Erro ao verificar:', checkError);
    return;
  }
  
  console.log('✅ Verificação (releitura do banco):');
  console.log('   website_active:', checkData.website_active);
  console.log('   website_activation_date:', checkData.website_activation_date);
};

// Executar o teste
testUpdateWebsiteActive();
